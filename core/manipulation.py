from copy import deepcopy
from pptx.oxml import parse_xml
from pptx.oxml.ns import nsdecls
from threading import Lock, Thread, Event
import botocore.exceptions
from queue import Queue
import shutil
import tempfile
from io import BytesIO
from concurrent.futures import ThreadPoolExecutor
from pptx import Presentation
from pydub import AudioSegment
from dotenv import load_dotenv
from zipfile import ZipFile
from ssml_validation import *
from exceptions import *
from utils import *
import subprocess
import boto3
import uuid
import io
import os
import traceback
import zipfile

load_dotenv()


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

    def __del__(self):
        self.polly = None


def init_polly():
    return Polly(aws_access_key_id, aws_secret_access_key, region)


aws_access_key_id = os.getenv('aws_access_key_id')
aws_secret_access_key = os.getenv('aws_secret_access_key')
bucket_name = os.getenv('bucket_name')
region = os.getenv('region')
schema_path = os.getenv('schema_path')
path_to_libreoffice = os.getenv("path_to_libreoffice")

s3_singleton = S3Singleton(
    aws_access_key_id, aws_secret_access_key, region, bucket_name)


half_sec_silence = AudioSegment.silent(duration=500)

max_workers = 20
executor = ThreadPoolExecutor(max_workers=max_workers)


def zip_pptx(pptx_buffer):
    edited_buffer = BytesIO()
    with zipfile.ZipFile(edited_buffer, 'w') as zip_ref:
        zip_ref.writestr("file.pptx", pptx_buffer.getvalue())
    return edited_buffer


def unzip_file_to_temp(zip_byte_data_io):
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
        file = io.BytesIO()
        obj.download_fileobj(file)
        if file is None:
            raise AmazonException("file is None")
        return unzip_file_to_temp(file)
    except UserParameterException as e:
        raise UserParameterException(e)
    except Exception as e:
        if isinstance(e, botocore.exceptions.ClientError):
            if e.response['Error']['Code'] == 'NoSuchKey':
                raise UserParameterException(
                    f"File not found: check parameters. Error: {str(e)}")
        raise AmazonException(f"Exception downloading file from s3: {str(e)}")


def upload_file_to_s3(usermail, project, filename, file):
    try:
        file = zip_pptx(file)
        if (not filename.lower().endswith((".zip"))):
            raise ElaborationException(
                "File must be a .zip before being uploaded to S3")

        obj = s3_singleton.s3.Object(
            bucket_name, f'{usermail}/{project}/edited/{filename}')
        # if (is_pptx_file(filename)):
        file.seek(0)
        obj.upload_fileobj(file)
        response = obj.get()
        if not (response and response['ResponseMetadata']['HTTPStatusCode'] == 200):
            raise AmazonException("Upload to S3 failed")
    except UserParameterException as e:
        raise UserParameterException(e)
    except Exception as e:
        raise AmazonException(f"Exception uploading pptx to s3: {str(e)}")


def generate_tts(polly, text, voice_id):
    try:
        response = polly.synthesize_speech(
            VoiceId=voice_id, OutputFormat='mp3', Text=text, TextType='ssml', Engine='neural')
        if not response['ResponseMetadata']['HTTPStatusCode'] == 200:
            raise AmazonException(
                f"Polly failed to elaborate tts. Response is not 200.")
        return BytesIO(response['AudioStream'].read())
    except AmazonException as e:
        raise AmazonException(e)


def pptx_to_pdf(pptx_buffer):
    temp_dir = None
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pptx") as temp_file:
        temp_file_path = temp_file.name
        # Get the directory containing the temp file
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
    zip_byte_data_io = download_file_from_s3(usermail, project, filename)
    pptx_buffer = unzip_file_to_temp(zip_byte_data_io)

    prs = Presentation(pptx_buffer)
    pdf_buffer, temp_dir = pptx_to_pdf(pptx_buffer)

    # Assuming pdf_to_images can handle buffers.
    images = pdf_to_images(pdf_buffer)

    return prs, images, temp_dir


def generate_audio(polly, index, prefix, text, voice_name, base64):
    # generate_tts now returns the audio_buffer directly
    audio_buffer = generate_tts(polly, text, voice_name)

    audio_buffer.seek(0)
    audio = AudioSegment.from_file(audio_buffer, format="mp3")

    if base64:
        return audiosegment_to_base64(audio)

    return audio, audio_buffer


# TODO: remove index
def combine_audios_and_generate_file(index, audios, base64):
    audios.pop()
    combined_audio = audios[0]

    for audio in audios[1:]:
        combined_audio += audio

    combined_buffer = io.BytesIO()
    combined_audio.export(combined_buffer, format="mp3", bitrate="320k")
    combined_buffer.seek(0)  # TODO: check if seek(0) is needed

    if base64:
        return audiosegment_to_base64(combined_audio)

    # TODO: remove 1 param and let only combined buffer
    return combined_audio, combined_buffer


# PROCESS PPTX BLOCK

def process_pptx(usermail, project, filename):
    pptx_buffer = download_file_from_s3(usermail, project, filename)

    if add_tts_to_pptx(pptx_buffer):
        edited_filename = f"{os.path.splitext(filename)[0]}_edited.zip"
        upload_file_to_s3(usermail, project, edited_filename, pptx_buffer)
    else:
        raise ElaborationException("PPTX has no notes to elaborate")


def add_tts_to_pptx(pptx_buffer):
    prs = Presentation(pptx_buffer)

    queue = Queue()
    lock = Lock()
    event = Event()

    def process_queue(slides_number):
        count = 0
        while count < slides_number:
            try:
                print("ciao")
                with lock:
                    data = queue.get()
                if (data[2] == False):
                    raise (globals()[data[4]])(data[5])
                elif (data[1] is not None):
                    update_slide_with_processed_data(
                        data[0], data[1], data[3])
                count += 1
            except queue.Empty:
                pass
            except Exception as e:
                event.set()
                return False, type(e).__name__, e
        return True
    results = []
    final_result_future = executor.submit(process_queue, len(prs.slides))
    for slide_index, slide in enumerate(prs.slides):
        result = executor.submit(process_slide, Polly(
            aws_access_key_id, aws_secret_access_key, region), slide, slide_index, queue, lock, event)
        results.append(result)
    final_result = final_result_future.result()
    if not final_result[0]:
        raise (globals()[final_result[4]])(final_result[5])

    pptx_buffer.seek(0)
    prs.save(pptx_buffer)
    return True


def process_slide(polly, slide, slide_index, queue, lock, event):
    if event.is_set():
        return
    try:
        notes_text, modified = check_slide_have_notes(slide.notes_slide)
        if not modified:
            with lock:
                queue.put([slide, None, True, slide_index])
            return

        parsed_ssml = check_correct_validate_parse_text(notes_text)

        audio_buffer = None
        if len(parsed_ssml) == 1:
            unique_id = uuid.uuid4()
            voice_name, text = parsed_ssml[0]
            _, audio_buffer = generate_audio(
                polly, unique_id, "slide", text, voice_name, False)  # TODO: remove unnecessary params and returns
        else:
            audios = []
            for voice_name, text in parsed_ssml:
                unique_id = uuid.uuid4()
                # TODO: remove unnecessary params and returns
                audio, _ = generate_audio(
                    polly, unique_id, "multi_voice", text, voice_name, False)
                audios.append(audio)
                audios.append(half_sec_silence)

            # TODO: remove first returned result _ which is not used
            _, audio_buffer = combine_audios_and_generate_file(
                "combined", audios, False)
        with lock:
            queue.put([slide, audio_buffer, True, slide_index])
    except Exception as e:
        with lock:
            queue.put([slide, None, False, slide_index, type(e).__name__, e])


def update_slide_with_processed_data(slide, audio, slide_index):
    try:
        slide.shapes.turbo_add_enabled = True
        add_audio_to_slide(slide, audio)
    except Exception as e:
        raise ElaborationException(
            f"Error while adding audio to slide{str(slide_index)}: {str(e)}")
    finally:
        slide.shapes.turbo_add_enabled = False


def process_slide_at_index(slide_index, cloned_pptx_buffer):
    cloned_prs = Presentation(cloned_pptx_buffer)
    slide = cloned_prs.slides[slide_index]

    # Call your original process_slide function
    process_slide(slide)

    return slide._element.xml


# def process_slide(slide):
#     try:
#         notes_text, modified = check_slide_have_notes(slide.notes_slide)
#         if not modified:
#             return modified
#         parsed_ssml = check_correct_validate_parse_text(notes_text)
#     except UserParameterException as e:
#         raise UserParameterException(e)
#     except Exception as e:
#         raise ElaborationException(
#             f"Presentation Elaboration: Exception during SSML correction/validation/parsing: {str(e)}")

#     try:
#         if len(parsed_ssml) == 1:
#             unique_id = uuid.uuid4()
#             for voice_name, text in parsed_ssml:
#                 audio, audio_buffer = generate_audio(
#                     unique_id, "slide", text, voice_name, False)
#                 slide.shapes.turbo_add_enabled = True
#                 add_audio_to_slide(slide, audio_buffer)
#                 slide.shapes.turbo_add_enabled = False
#         else:
#             audios = []
#             for voice_name, text in parsed_ssml:
#                 unique_id = uuid.uuid4()
#                 audio, _ = generate_audio(
#                     unique_id, "multi_voice", text, voice_name, False)
#                 audios.append(audio)
#                 audios.append(half_sec_silence)
#             combined_audio, combined_buffer = combine_audios_and_generate_file(
#                 "combined", audios, False)
#             slide.shapes.turbo_add_enabled = True
#             add_audio_to_slide(slide, combined_buffer)
#             slide.shapes.turbo_add_enabled = False
#         return modified
#     except AmazonException as e:
#         raise AmazonException(e)
#     except UserParameterException as e:
#         raise UserParameterException(e)
#     except Exception as e:
#         raise ElaborationException(
#             f"Exception while processing a slide: {str(e)}")

# TTS TEXT PREVIEW BLOCK


def process_preview(text):
    unique_id = uuid.uuid4()
    try:
        parsed_ssml = check_correct_validate_parse_text(text)
    except UserParameterException as e:
        raise UserParameterException(e)
    except Exception as e:
        raise ElaborationException(
            f"Audio Preview: Exception during SSML correction/validation/parsing: {str(e)}")

    audios = []

    def generate_for_voice(voice_name, text):
        try:
            audio, _ = generate_audio(voice_name, temp_folder,
                                      "multi_voice", text, voice_name, False)
            audios.append(audio)
            audios.append(half_sec_silence)
        except Exception as e:
            # Handle or log exceptions during audio generation
            pass

    try:
        temp_folder = create_folder(f"{unique_id}_temp")
        if len(parsed_ssml) == 1:
            for voice_name, text in parsed_ssml:
                audio, _ = generate_audio(
                    voice_name, temp_folder, "slide", text, voice_name, False)
                audio_buffer = audiosegment_to_stream(audio)
                return audio_buffer
        else:
            with ThreadPoolExecutor() as executor:
                executor.map(generate_for_voice, [voice_name for voice_name, _ in parsed_ssml], [
                             text for _, text in parsed_ssml])

            combined_audio, _ = combine_audios_and_generate_file(
                "combined", temp_folder, audios, False)
            audio_buffer = audiosegment_to_stream(combined_audio)

            return audio_buffer
    except AmazonException as e:
        raise AmazonException(e)
    except ElaborationException as e:
        raise ElaborationException(e)
    except UserParameterException as e:
        raise UserParameterException(e)
    except Exception as e:
        raise ElaborationException(
            f"Exception while processing text: {str(e)}")
    finally:
        delete_folder(temp_folder)

# PPTX SPLIT BLOCK


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


def process_pptx_split(usermail, project, filename):
    # This will store the path to the temp directory (if you have one)

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
