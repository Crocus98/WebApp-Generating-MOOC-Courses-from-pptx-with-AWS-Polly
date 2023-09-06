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
        notes_text, modified = check_slides_modified(slide.notes_slide)
        if not modified:
            return modified
        parse_ssml = check_correct_validate_parse_text(notes_text)
    except UserParameterException as e:
        raise UserParameterException(e)
    except Exception as e:
        raise ElaborationException(
            f"Presentation Elaboration: Exception during SSML correction/validation/parsing: {str(e)}")
    try:
        if len(parsed_ssml) == 1:
            unique_id = uuid.uuid4()
            for voice_name, text in parsed_ssml:
                try:
                    filename = os.path.join(
                        temp_folder, f'slide_{unique_id}.mp3')
                    audio = generate_tts(
                        text, voice_name, filename)
                    audio = AudioSegment.from_file(filename)

                    left, top, width, height = Inches(
                        1), Inches(2.5), Inches(1), Inches(1)
                    slide.shapes.add_movie(
                        filename, left, top, width, height, mime_type="audio/mp3", poster_frame_image=None)
                except AmazonException as e:
                    raise AmazonException(e)
                except ElaborationException as e:
                    raise ElaborationException(e)
                except Exception as e:
                    raise Exception(
                        f"Error during audio combining/exporting or adding to slide: {str(e)}")
        else:
            audios = []
            for voice_name, text in parsed_ssml:
                try:
                    unique_id = uuid.uuid4()
                    filename = os.path.join(
                        temp_folder, f'multi_voice_{unique_id}.mp3')
                    generate_tts(text, voice_name, filename)
                    audio = AudioSegment.from_file(filename)
                    audios.append(audio)
                    audios.append(half_sec_silence)
                except AmazonException as e:
                    raise AmazonException(e)
                except ElaborationException as e:
                    raise ElaborationException(e)
                except Exception as e:
                    raise Exception(
                        f"Error during audio combining/exporting or adding to slide: {str(e)}")
            audios.pop()
            combined_audio = audios[0]
            for audio in audios[1:]:
                combined_audio += audio
            try:
                combined_filename = os.path.join(
                    temp_folder, f'combined.mp3')
                combined_audio.export(
                    combined_filename, format="mp3", bitrate="320k")
                left, top, width, height = Inches(
                    1), Inches(2.5), Inches(1), Inches(1)
                slide.shapes.add_movie(
                    combined_filename, left, top, width, height, mime_type="audio/mp3", poster_frame_image=None)
            except AmazonException as e:
                raise AmazonException(e)
            except ElaborationException as e:
                raise ElaborationException(e)
            except Exception as e:
                raise Exception(
                    f"Error during audio combining/exporting or adding to slide: {str(e)}")
        return modified
    except OSError as e:
        raise ElaborationException(
            f"Critical: could not delete temp file: {e.filename}")
    except AmazonException as e:
        raise AmazonException(e)
    except UserParameterException as e:
        raise UserParameterException(e)
    except Exception as e:
        raise ElaborationException(
            f"Exception while processing a slide: {str(e)}")

def process_preview(text):
    unique_id = uuid.uuid4()
    temp_folder = create_folder(f"{unique_id}_temp")
    try:
        parse_ssml = check_correct_validate_parse_text(text)
    except UserParameterException as e:
        raise UserParameterException(e)
    except Exception as e:
        raise ElaborationException(
            f"Audio Preview: Exception during SSML correction/validation/parsing: {str(e)}")

    try:
        if len(parsed_ssml) == 1:
            for voice_name, text in parsed_ssml:
                try:
                    filename = os.path.join(
                        temp_folder, f'slide_{voice_name}.mp3')
                    audio = generate_tts(
                        text, voice_name, filename)
                    audio = AudioSegment.from_file(filename)
                except AmazonException as e:
                    raise AmazonException(e)
                except ElaborationException as e:
                    raise ElaborationException(e)
                except Exception as e:
                    raise Exception(
                        f"Error during audio exporting: {str(e)}")
                finally:
                    delete_folder(temp_folder)
            return audio
        else:
            try:
                audios = []
                for voice_name, text in parsed_ssml:
                    filename = os.path.join(
                        temp_folder, f'multi_voice_{voice_name}.mp3')
                    generate_tts(text, voice_name, filename)
                    audio = AudioSegment.from_file(filename)
                    audios.append(audio)
                    audios.append(half_sec_silence)
                audios.pop()
                combined_audio = audios[0]
                for audio in audios[1:]:
                    combined_audio += audio
                combined_filename = os.path.join(
                    temp_folder, f'combined.mp3')
                combined_audio.export(
                    combined_filename, format="mp3", bitrate="320k")
                return combined_audio
            except AmazonException as e:
                raise AmazonException(e)
            except ElaborationException as e:
                raise ElaborationException(e)
            except Exception as e:
                raise Exception(
                    f"Error during combined audio exporting: {str(e)}")
            finally:
                delete_folder(temp_folder)
    except OSError as e:
        raise ElaborationException(
            f"Could not process file due to OS path issue: {e.filename}")
    except AmazonException as e:
        raise AmazonException(e)
    except ElaborationException as e:
        raise ElaborationException(e)
    except UserParameterException as e:
        raise UserParameterException(e)
    except Exception as e:
        raise ElaborationException(
            f"Exception while processing text: {str(e)}")

def process_slide_split(slide, image):
    notes_text, modified = check_slides_modified(slide.notes_slide)
    if not modified:
        return
    
    image_path = os.path.join(temp_folder, f'slide_{i}.jpg')
    image.save(image_path)
    image_base64 = image_to_base64(image)

    tts_generated = False
    parse_ssml = check_correct_validate_parse_text(text)
    try:
        if len(parsed_ssml) == 1:
            for voice_name, text in parsed_ssml:
                filename = os.path.join(
                    temp_folder, f'slide_{i}.mp3')
                audio = generate_tts(
                    text, voice_name, filename)
                audio = AudioSegment.from_file(filename)
                audio_base64 = audiosegment_to_base64(
                    audio)
                tts_generated = True

        else:
            audios = []
            for j, (voice_name, text) in enumerate(parsed_ssml):
                filename = os.path.join(
                    temp_folder, f'multi_voice_{j}.mp3')
                generate_tts(text, voice_name, filename)
                audio = AudioSegment.from_file(filename)
                audios.append(audio)
                audios.append(half_sec_silence)
            combined_audio = sum(audios[1:], audios[0])
            combined_filename = os.path.join(
                temp_folder, f'slide_{i}.mp3')
            combined_audio.export(
                combined_filename, format="mp3", bitrate="320k")
            audio_base64 = audiosegment_to_base64(
                combined_audio)
            tts_generated = True
    except AmazonException as e:
        raise AmazonException(e)
    except Exception as e:
        raise ElaborationException(
            f"Exception while saving audio to file: {str(e)}")
slide_info = {
    "slide_id": i,
    "image": {
        "data": image_base64,
        "filename": f"slide_{i}.jpg"
    },
    "tts": {
        "data": audio_base64,
        "filename": f"slide_{i}.mp3"
    } if tts_generated else None
}
return slide_info

def process_pptx_split(usermail, project, filename):
    tts_generated = False
    try:
        temp_folder, prs, images = get_folder_prs_images_from_pptx(usermail, project, filename)
        slide_data = []
        for i, (slide, image) in enumerate(zip(prs.slides, images)):
            slide_data.append(process_slide_split(slide, image))
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

# def extract_notes_from_slide(slide):
#     slide_number = slide.slide_id
#     notes_text = ""
#     if slide.has_notes_slide:
#         notes_slide = slide.notes_slide
#         notes_text = notes_slide.notes_text_frame.text
#     return slide_number, notes_text


# def upload_to_s3_subfolder(file_path, usermail, project, subfolder, filename):
#     obj = s3_singleton.Object(
#         bucket_name, f'{usermail}/{project}/edited/{subfolder}/{filename}')
#     with open(file_path, 'rb') as f:
#         obj.upload_fileobj(f)


# def extract_notes_and_images_from_pptx(pptx_file):
#     prs = Presentation(pptx_file)
#     extracted_data = []
#     for i, slide in enumerate(prs.slides):
#         slide_image = io.BytesIO()  # Replace with your actual slide to image conversion
#         notes = slide.notes_slide.notes_text if slide.notes_slide else ''
#         if notes:
#             tts_data = generate_tts(notes)
#         else:
#             tts_data = None
#         extracted_data.append({
#             "slide_image": slide_image,
#             "tts_data": tts_data
#         })
#     return extracted_data