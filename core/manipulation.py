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


def zip_pptx(pptx_buffer):
    edited_buffer = BytesIO()
    with zipfile.ZipFile(edited_buffer, 'w') as zip_ref:
        zip_ref.writestr("file.pptx", pptx_buffer.getvalue())
    return edited_buffer


def unzip_file(zip_byte_data_io):
    with zipfile.ZipFile(zip_byte_data_io, 'r') as zip_ref:
        for name in zip_ref.namelist():
            if name.endswith('.pptx'):
                return BytesIO(zip_ref.read(name))
    return None


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


def generate_tts(polly, text, voice_id):
    response = polly.polly.synthesize_speech(
        VoiceId=voice_id, OutputFormat='mp3', Text=text, TextType='ssml', Engine='neural')

    if not response['ResponseMetadata']['HTTPStatusCode'] == 200:
        raise AmazonException(
            f"Polly failed to elaborate tts. Response is not 200.")
    audio_data = response['AudioStream'].read()
    return AudioSegment.from_mp3(io.BytesIO(audio_data))


def pptx_to_pdf(pptx_buffer):
    temp_dir = None
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pptx") as temp_file:
        temp_file_path = temp_file.name
        temp_dir = os.path.dirname(temp_file_path)
        temp_file.write(pptx_buffer.getvalue())

    output_pdf_buffer = BytesIO()
    pdf_temp_file_path = temp_file_path.replace(".pptx", ".pdf")

    command = f"\"{path_to_libreoffice}\" --headless --convert-to pdf --outdir \"{os.path.dirname(temp_file_path)}\" \"{temp_file_path}\""
    process = subprocess.Popen(
        command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
    _, _ = process.communicate(timeout=60)

    if process.returncode != 0:
        raise ElaborationException(
            "Error converting PPTX to PDF using LibreOffice.")

    with open(pdf_temp_file_path, 'rb') as f:
        output_pdf_buffer.write(f.read())

    # Remove temporary files
    os.remove(temp_file_path)
    os.remove(pdf_temp_file_path)

    return output_pdf_buffer, temp_dir  # Return both the buffer and the temp dir


def get_folder_prs_images_from_pptx(usermail, project, filename):
    pptx_buffer = download_file_from_s3(usermail, project, filename)

    prs = Presentation(pptx_buffer)
    pdf_buffer, temp_dir = pptx_to_pdf(pptx_buffer)

    # Assuming pdf_to_images can handle buffers.
    images = pdf_to_images(pdf_buffer)

    return prs, images, temp_dir


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
            executor.submit(convert_text_to_audio_thread,
                            notes_text, slide_index, queue, stop_event, folder)
    process_queue(len(prs.slides), queue, prs, stop_event)
    output_buffer = io.BytesIO()
    prs.save(output_buffer)
    output_buffer.seek(0)
    return output_buffer


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
                "Unexpeceted critical error. Check exception handling. Slides Processing Threads are not filling the queue correctly. Timeout reached.")
        except Exception as e:
            stop_event.set()
            raise e


def get_notes_from_slide(slide, slide_index, queue):
    notes_text = check_slide_have_notes(slide.notes_slide)
    if not notes_text:
        queue.put([None, True, slide_index])
        return None
    return notes_text


def convert_text_to_audio_thread(notes_text, slide_index, queue, stop_event, folder):
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
        print(e)
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


def process_pptx_split(usermail, project, filename):
    try:
        prs, images, temp_dir = get_folder_prs_images_from_pptx(
            usermail, project, filename)

        stream = io.BytesIO()
        with ZipFile(stream, "w") as zf:
            with ThreadPoolExecutor(max_workers=20) as executor:
                slide_process_results = list(executor.map(
                    lambda slide_data: process_slide_for_zip(
                        slide_data[0], slide_data[1][0], slide_data[1][1]),
                    enumerate(zip(prs.slides, images), 1)
                ))

            for i, result in slide_process_results:
                zf.writestr(f"slide_{i}.png", result.get('img_buffer', b''))
                audio_buffer = result.get('audio_buffer')
                if audio_buffer:
                    zf.writestr(f"audio_{i}.mp3", audio_buffer)

        stream.seek(0)
        return stream

    except OSError as e:
        raise ElaborationException(
            f"Could not process file due to OS path issue: {e.filename}")
    except AmazonException as e:
        raise AmazonException(e)
    except UserParameterException as e:
        raise UserParameterException(e)
    except ElaborationException as e:
        raise ElaborationException(e)
    except Exception as e:
        raise ElaborationException(
            f"Exception while processing pptx: {str(e)}")
    finally:
        delete_folder(temp_dir)


def process_slide_for_zip(i, slide, image):
    result = {}
    try:
        audio_segment = get_slide_audio_preview(i, slide)

        img_buffer = io.BytesIO()

        # Check if image is already a BytesIO object
        if isinstance(image, io.BytesIO):
            img_bytes = image.getvalue()
        else:  # Otherwise, assume it's a Pillow Image object
            image.save(img_buffer, 'PNG')
            img_bytes = img_buffer.getvalue()

        result['img_buffer'] = img_bytes

        if audio_segment:
            audio_buffer = audiosegment_to_stream(audio_segment)
            result['audio_buffer'] = audio_buffer.getvalue()

        return i, result
    except Exception as e:
        raise ElaborationException(
            f"Exception while processing slide {i}: {str(e)}")


def get_slide_audio_preview(index, slide):
    notes_text, have_notes = check_slide_have_notes(slide.notes_slide)
    if not have_notes:
        return None
    parsed_ssml = check_correct_validate_parse_text(notes_text)
    try:
        audio_mp3 = None
        if len(parsed_ssml) == 1:
            for voice_name, text in parsed_ssml:
                audio_mp3, _ = generate_audio(
                    index, "slide", text, voice_name, False)
        else:
            audios = []
            for j, (voice_name, text) in enumerate(parsed_ssml):
                audio, _ = generate_audio(
                    j, "multi_voice", text, voice_name, False)
                audios.append(audio)
                audios.append(half_sec_silence)
            audio_mp3, _ = combine_audios_and_generate_file(
                index, audios, False)
        return audio_mp3
    except AmazonException as e:
        raise AmazonException(e)
    except Exception as e:
        raise ElaborationException(
            f"Exception while saving audio to file: {str(e)}")
