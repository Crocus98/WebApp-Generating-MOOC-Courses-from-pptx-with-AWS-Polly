from threading import Lock, Thread, Event
import botocore.exceptions
from queue import Queue, Empty
import shutil
from io import BytesIO
from concurrent.futures import ThreadPoolExecutor
from pptx import Presentation, oxml
from pydub import AudioSegment
from dotenv import load_dotenv
from zipfile import ZipFile
from ssml_validation import *
from exceptions import *
from utils import *
import tempfile
import subprocess
import boto3
import io
import os
import traceback
import zipfile

load_dotenv()
aws_access_key_id = os.getenv('aws_access_key_id')
aws_secret_access_key = os.getenv('aws_secret_access_key')
bucket_name = os.getenv('bucket_name')
region = os.getenv('region')
schema_path = os.getenv('schema_path')
path_to_libreoffice = os.getenv("path_to_libreoffice")


class S3Singleton:
    _instance = None

    def __new__(cls, aws_access_key_id, aws_secret_access_key, region_name, bucket_name):
        if cls._instance is None:
            cls._instance = super(S3Singleton, cls).__new__(cls)
            cls._instance.s3 = boto3.resource('s3',
                                              aws_access_key_id=aws_access_key_id,
                                              aws_secret_access_key=aws_secret_access_key,
                                              region_name=region_name)
            cls._instance.bucket_name = bucket_name
        return cls._instance


class Polly:
    def __init__(self, aws_access_key_id, aws_secret_access_key, region_name):
        self.polly = boto3.client('polly',
                                  aws_access_key_id=aws_access_key_id,
                                  aws_secret_access_key=aws_secret_access_key,
                                  region_name=region_name)


def init_polly():
    try:
        return Polly(aws_access_key_id, aws_secret_access_key, region)
    except Exception as e:
        raise ElaborationException(
            f"Failed to create polly instance for your request: {str(e)}")


s3_singleton = S3Singleton(
    aws_access_key_id, aws_secret_access_key, region, bucket_name)
half_sec_silence = AudioSegment.silent(duration=500)
max_workers = 12
executor = ThreadPoolExecutor(max_workers=max_workers)


def download_file_from_s3(usermail, project, filename):
    try:
        obj = s3_singleton.s3.Object(
            bucket_name, f'{usermail}/{project}/{filename}')
        obj.get()
        stream = io.BytesIO()
        obj.download_fileobj(stream)
        if stream is None:
            raise AmazonException("file is None")
        return unzip_file(stream)
    except Exception as e:
        if isinstance(e, botocore.exceptions.ClientError):
            if e.response['Error']['Code'] == 'NoSuchKey':
                raise UserParameterException(
                    f"Download failed: File not found: check parameters. Error: {str(e)}")
        raise AmazonException(f"Exception downloading file from s3: {str(e)}")


def upload_file_to_s3(usermail, project, filename, file):
    try:
        file = zip_pptx(file)
        if (not filename.lower().endswith((".zip"))):
            raise ElaborationException(
                "File must be a .zip before being uploaded to S3")

        obj = s3_singleton.s3.Object(
            bucket_name, f'{usermail}/{project}/edited/{filename}')

        file.seek(0)
        obj.upload_fileobj(file)
        response = obj.get()
        if not (response and response['ResponseMetadata']['HTTPStatusCode'] == 200):
            raise AmazonException(
                f"Upload to S3 failed, code: {str(response['ResponseMetadata']['HTTPStatusCode'])}")
    except ElaborationException as e:
        raise ElaborationException(e)
    except Exception as e:
        raise AmazonException(f"Exception uploading pptx to s3: {str(e)}")

# PROCESS PPTX BLOCK


def process_pptx(usermail, project, filename, folder):
    edited_pptx_buffer = add_tts_to_pptx(
        download_file_from_s3(usermail, project, filename), folder)
    edited_filename = f"{os.path.splitext(filename)[0]}_edited.zip"
    upload_file_to_s3(usermail, project, edited_filename, edited_pptx_buffer)


def add_tts_to_pptx(pptx_buffer, folder):
    prs = Presentation(pptx_buffer)
    queue = Queue()
    stop_event = Event()
    for slide_index, slide in enumerate(prs.slides):
        notes_text = get_notes_from_slide(slide, slide_index, queue)
        if (notes_text is not None):
            executor.submit(convert_text_to_audio_file_thread,
                            notes_text, slide_index, queue, stop_event, folder)
    process_queue(len(prs.slides), queue, prs, stop_event)
    output_stream = io.BytesIO()
    prs.save(output_stream)
    output_stream.seek(0)
    return output_stream


def process_queue(slides_number, queue, prs, stop_event):
    count = 0
    while count < slides_number:
        try:
            # [AudioPath, ElaborationSuccessful, SlideIndex, ExceptionType, ErrorMessage]
            data = queue.get(timeout=20)
            if (data[1] == False):
                raise (globals()[data[3]])(data[4])
            elif (data[0] is not None):
                add_audio_to_slide_turbo(prs.slides[data[2]], data[2], data[0])
            count += 1
        except Empty:
            stop_event.set()
            raise ElaborationException(
                "Unexpeceted critical error. Slides Processing Threads are not filling the queue correctly. Timeout reached.")
        except Exception as e:
            stop_event.set()
            raise e


def convert_text_to_audio_file_thread(notes_text, slide_index, queue, stop_event, folder):
    try:
        if stop_event.is_set():
            return
        parsed_ssml = check_correct_validate_parse_text(notes_text)
        if stop_event.is_set():
            return
        audio = process_parsed_ssml(parsed_ssml)
        if stop_event.is_set():
            return
        audiofile = tempfile.NamedTemporaryFile(
            suffix=".mp3", delete=False, dir=folder)
        audiofile.write(audio.read())
        queue.put([audiofile.name, True, slide_index])
    except Exception as e:
        stop_event.set()
        queue.put([None, False, slide_index, type(e).__name__,
                  "Audio Processing Error: " + str(e)])
    finally:
        if (audiofile is not None):
            audiofile.close()


def process_parsed_ssml(parsed_ssml):
    try:
        audios = []
        polly = init_polly()
        for voice_name, text in parsed_ssml:
            audios.append(generate_tts(polly, text, voice_name))
            audios.append(half_sec_silence)
        return audiosegment_to_stream(combine_audios(audios))
    except botocore.exceptions.ReadTimeoutError as e:
        raise AmazonException("Timeout error generating tts.")
    except AmazonException as e:
        raise AmazonException(e)
    except Exception as e:
        raise ElaborationException(
            f"Unexpected error during processing parsed ssml: {str(e)}")


def add_audio_to_slide_turbo(slide, slide_index, audio_path):
    try:
        slide.shapes.turbo_add_enabled = True
        add_audio_to_slide(slide, audio_path)
    except Exception as e:
        raise ElaborationException(
            f"Error while adding audio to slide {slide_index}: {str(e)}")
    finally:
        slide.shapes.turbo_add_enabled = False


# TTS TEXT PREVIEW BLOCK
def process_preview(text):
    try:
        parsed_ssml = check_correct_validate_parse_text(text)
        return process_parsed_ssml(parsed_ssml)
    except AmazonException as e:
        raise AmazonException(e)
    except ElaborationException as e:
        raise ElaborationException(e)
    except UserParameterException as e:
        raise UserParameterException(e)
    except Exception as e:
        raise ElaborationException(
            f"Exception while processing text: {str(e)}")

# PPTX SPLIT BLOCK


def process_pptx_split(usermail, project, filename, folder):
    pptx_buffer = download_file_from_s3(usermail, project, filename)
    prs = Presentation(pptx_buffer)
    pdf_buffer = pptx_to_pdf(pptx_buffer, folder)
    images = pdf_to_images(pdf_buffer)

    queue = Queue()
    stop_event = Event()

    for slide_index, (slide, image) in enumerate(zip(prs.slides, images)):
        notes_text = check_slide_have_notes(slide.notes_slide)
        executor.submit(convert_text_to_audio_and_queue_data,
                        slide_index, notes_text, image, queue, stop_event, folder)

    result = process_queue_split(len(prs.slides), queue, prs, stop_event)

    return result_to_zip_stream(result)


def result_to_zip_stream(result):
    try:
        stream = io.BytesIO()
        print("TODO")
        return stream
    except Exception as e:
        raise ElaborationException(
            f"Error while crafting the preview zip: {str(e)}")


def process_queue_split(slides_number, queue, prs, stop_event):
    count = 0
    results = []
    while count < slides_number:
        try:
            # [slide_index, notes_text, audio_stream, image_stream, success, error_type, error_message]
            data = queue.get(timeout=20)
            result = {
                'slide_index': data[0],
                'slide_notes': data[1],
                'audio_buffer': data[2].getvalue() if data[2] is not None else None,
                'img_buffer': data[3].getvalue(),
                'error_type': data[5] if not data[4] else None,
                'error_message': data[6] if not data[4] else None
            }
            results[data[0]] = result
            count += 1
        except Empty:
            stop_event.set()
            raise ElaborationException(
                "Unexpeceted critical error. Slides Processing Threads for preview are not filling the queue correctly. Timeout reached.")
        except Exception as e:
            stop_event.set()
            raise ElaborationException(
                "Error while processing queue for slides preview.")
    return results


def convert_text_to_audio_and_queue_data(slide_index, notes_text, image, queue, stop_event, folder):
    try:
        if stop_event.is_set():
            return
        parsed_ssml = check_correct_validate_parse_text(notes_text)
        if stop_event.is_set():
            return
        audio = process_parsed_ssml(parsed_ssml)
        queue.put([slide_index, audio_stream, image,
                  notes_text, True])
    except Exception as e:
        # [slide_index,notes_text audio_stream, image_stream, success, error_type, error_message]
        queue.put([slide_index, None, image, notes_text, False, type(
            e).__name__, "Audio Processing Error: " + str(e)])
