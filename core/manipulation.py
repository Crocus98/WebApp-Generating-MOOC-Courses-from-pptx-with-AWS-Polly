from pptx import Presentation
from pptx.util import Inches
from pydub import AudioSegment
from ssml_validation import *
from pdf2image import convert_from_path
from pydub import AudioSegment
from exceptions import *
from utils import *
import subprocess
import shutil
import base64
import boto3
import uuid
import io
import os

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
        self.polly = None  #called with -> del obj

aws_access_key_id = os.getenv('aws_access_key_id')
aws_secret_access_key = os.getenv('aws_secret_access_key')
bucket_name = os.getenv('bucket_name')
region = os.getenv('region')
schema_path = os.getenv('schema_path')
path_to_libreoffice = os.getenv("path_to_libreoffice")

s3_singleton = S3Singleton(aws_access_key_id, aws_secret_access_key, region, bucket_name)
polly_object = Polly(aws_access_key_id, aws_secret_access_key, region)

half_sec_silence = AudioSegment.silent(duration=500)

def download_file_from_s3(usermail, project, filename):
    try:
        obj = s3_singleton.s3.Object(bucket_name,f'{usermail}/{project}/{filename}')
        if not obj.get():
            raise UserParameterException("File not found: check parameters")
        file = io.BytesIO()
        obj.download_fileobj(file)
        if file is None:
            raise AmazonException("file is None")
        return file
    except UserParameterException as e:
        raise UserParameterException(e)
    except Exception as e:
        raise AmazonException(f"Exception downloading file from s3: {str(e)}")

def upload_file_to_s3(usermail, project, filename, file):
    try:
        obj = s3_singleton.s3.Object(bucket_name,f'{usermail}/{project}/edited/{filename}')
        if(is_pptx_file(filename)):
            file.seek(0)
        obj.upload_fileobj(file)
        response = obj.get()
        if not (response and response['ResponseMetadata']['HTTPStatusCode'] == 200):
            raise AmazonException("Upload to S3 failed")
    except Exception as e:
        raise AmazonException(f"Exception uploading pptx to s3: {str(e)}")

def generate_tts(text, voice_id, filename):
    try:
        try:
            response = polly_object.polly.synthesize_speech(VoiceId=voice_id, OutputFormat='mp3', Text=text, TextType='ssml', Engine='neural')
            if not response['ResponseMetadata']['HTTPStatusCode'] == 200:
                raise AmazonException(f"Polly failed to elaborate tts. Response is not 200.")
        except Exception as e:
            raise AmazonException(f"Exception from Polly: {str(e)}")
        with open(filename, 'wb') as out:
            out.write(response['AudioStream'].read())
    except AmazonException as e:
        raise AmazonException(e)
    except Exception as e:
        raise ElaborationException(
            f"Exception while saving audio into file: {str(e)}")

def pptx_to_pdf(pptx_file_path):
    if not file_ispptx_exists_readpermission(pptx_file_path):
        raise ElaborationException(f"Temporary copy of file is either not found, not a pptx or not readable due to permissions: {pptx_file_path}")

    output_folder = os.path.dirname(pptx_file_path)
    output_pdf_path = os.path.join(output_folder, f"{os.path.splitext(os.path.basename(pptx_file_path))[0]}.pdf")

    command = f"\"{path_to_libreoffice}\"lowriter --headless --convert-to pdf --outdir \"{output_folder}\" \"{pptx_file_path}\""

    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        process.communicate(timeout=20)
    except subprocess.TimeoutExpired:
        raise ElaborationException(
            f"Process for pptx conversion timed out. Killing it.")
    finally:
        process.terminate()
    return output_pdf_path

def get_folder_prs_images_from_pptx(usermail, project, filename):
    pptx_file = download_file_from_s3(usermail, project, filename)
    folder = create_folder(f"{usermail}_{project}_temp")
    pptx_file_path = os.path.join(folder, filename)
    with open(pptx_file_path, 'wb') as f:
        f.write(pptx_file.getbuffer())
    pptx_file.seek(0)
    prs = Presentation(pptx_file)
    pdf_path = pptx_to_pdf(pptx_file_path).replace('.pptx.pdf', '.pdf')
    images = pdf_to_images(pdf_path)
    return folder, prs, images

def generate_audio(index, folder, prefix, text, voice_name, base64):
    filename = os.path.join(folder, f'{prefix}_{index}.mp3')
    generate_tts(text, voice_name, filename)
    audio = AudioSegment.from_file(filename)
    if(base64):
        return audiosegment_to_base64(audio)
    return audio

def combine_audios_and_generate_file(index, folder, audios, base64):
    combined_audio = sum(audios)
    combined_filename = os.path.join(folder, f'slide_{index}.mp3')
    combined_audio.export(combined_filename, format="mp3", bitrate="320k")
    if(base64):
        return audiosegment_to_base64(combined_audio)
    return combined_audio

#PROCESS PPTX BLOCK

def process_pptx(usermail, project, filename):
    pptx_file = download_file_from_s3(usermail, project, filename)
    if add_tts_to_pptx(pptx_file, usermail, project):
        edited_filename = f"{os.path.splitext(filename)[0]}_edited{os.path.splitext(filename)[1]}"
        upload_file_to_s3(usermail, project, edited_filename, pptx_file)
    else:
        raise ElaborationException("PPTX has no notes to elaborate")

def add_tts_to_pptx(pptx_file, usermail, project):
    try:
        temp_folder = create_folder(f"{usermail}_{project}_temp")
        pptx_file.seek(0)
        prs = Presentation(pptx_file)
        modified = False
        for slide in prs.slides:
            if process_slide(slide, temp_folder):
                modified = True
        pptx_file.seek(0)
        if modified:
            prs.save(pptx_file)
        pptx_file.seek(0)
        return modified
    except AmazonException as e:
        raise AmazonException(e)
    except UserParameterException as e:
        raise UserParameterException(e)
    except ElaborationException as e:
        raise ElaborationException(e)
    except Exception as e:
        raise ElaborationException(
            f"Exception adding tts to pptx: {str(e)}")
    finally:
        delete_folder(temp_folder)

def process_slide(slide, temp_folder):
    try:
        notes_text, modified = check_slide_have_notes(slide.notes_slide)
        if not modified:
            return modified
        parsed_ssml = check_correct_validate_parse_text(notes_text)
    except UserParameterException as e:
        raise UserParameterException(e)
    except Exception as e:
        raise ElaborationException(
            f"Presentation Elaboration: Exception during SSML correction/validation/parsing: {str(e)}")
    try:
        if len(parsed_ssml) == 1:
            unique_id = uuid.uuid4()
            for voice_name, text in parsed_ssml:
                audio = generate_audio(unique_id,temp_folder,"slide",text, voice_name, False)
                left, top, width, height = Inches(1), Inches(2.5), Inches(1), Inches(1)
                slide.shapes.add_movie(filename, left, top, width, height, mime_type="audio/mp3", poster_frame_image=None)
        else:
            audios = []
            for voice_name, text in parsed_ssml:
                unique_id = uuid.uuid4()
                audios.append(generate_audio(unique_id,temp_folder,"multi_voice",text, voice_name, False))
                audios.append(half_sec_silence)
            combined_audio = combine_audios_and_generate_file("combined",temp_folder,audios, False)
            left, top, width, height = Inches(
                1), Inches(2.5), Inches(1), Inches(1)
            slide.shapes.add_movie(
                combined_filename, left, top, width, height, mime_type="audio/mp3", poster_frame_image=None)
        return modified
    except AmazonException as e:
        raise AmazonException(e)
    except UserParameterException as e:
        raise UserParameterException(e)
    except Exception as e:
        raise ElaborationException(f"Exception while processing a slide: {str(e)}")

#TTS TEXT PREVIEW BLOCK

def process_preview(text):
    unique_id = uuid.uuid4()
    temp_folder = create_folder(f"{unique_id}_temp")
    try:
        parsed_ssml = check_correct_validate_parse_text(text)
    except UserParameterException as e:
        raise UserParameterException(e)
    except Exception as e:
        raise ElaborationException(
            f"Audio Preview: Exception during SSML correction/validation/parsing: {str(e)}")
    try:
        if len(parsed_ssml) == 1:
            for voice_name, text in parsed_ssml:
                return generate_audio(voice_name, temp_folder,"slide", text, voice_name, False)
        else:
            audios = []
            for voice_name, text in parsed_ssml:
                audios.append(generate_audio(voice_name, temp_folder,"multi_voice", text, voice_name, False))
                audios.append(half_sec_silence)
            combined_audio = combine_audios_and_generate_file("combined", temp_folder, audios, True)
            return combined_audio
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

#PPTX SPLIT BLOCK
def process_slide_split(index, slide, image, folder):
    notes_text, have_notes = check_slide_have_notes(slide.notes_slide)
    image_base64 = extract_image_from_slide(folder,image)
    if not have_notes:
        return slide_split_data(index, image_base64, None)
    parsed_ssml = check_correct_validate_parse_text(notes_text)
    try:
        audio_base64 = None
        if len(parsed_ssml) == 1:
            for voice_name, text in parsed_ssml:
                audio_base64 = generate_audio(index, folder,"slide",text, voice_name, True)
        else:
            audios = []
            for j, (voice_name, text) in enumerate(parsed_ssml):
                audios.append(generate_audio(index, folder,"multi_voice",text, voice_name, False))
                audios.append(half_sec_silence)
            audio_base64 = combine_audios_and_generate_file(index, folder, audios, True)
        return slide_split_data(index, image_base64, audio_base64)
    except AmazonException as e:
        raise AmazonException(e)
    except Exception as e:
        raise ElaborationException(
            f"Exception while saving audio to file: {str(e)}")

def process_pptx_split(usermail, project, filename):
    try:
        temp_folder, prs, images = get_folder_prs_images_from_pptx(usermail, project, filename)
        slide_data = []
        for i, (slide, image) in enumerate(zip(prs.slides, images)):
            slide_data.append(process_slide_split(i, slide, image, temp_folder))
        return slide_data
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
            f"Exception while processing slides splitting: {str(e)}")
    finally:
        delete_folder(temp_folder)