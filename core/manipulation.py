import threading
from zipfile import ZipFile
from pptx import Presentation
from pptx.util import Inches
from pydub import AudioSegment
from ssml_validation import *
from pdf2image import convert_from_path
from pydub import AudioSegment
import subprocess
import base64
import boto3
import uuid
import json
import io
import os
from dotenv import load_dotenv
from exceptions import *

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


class PollySingleton:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, aws_access_key_id, aws_secret_access_key, region_name):
        if cls._instance is None:
            cls._instance = super(PollySingleton, cls).__new__(cls)
            cls._instance.polly = boto3.client('polly',
                                               aws_access_key_id=aws_access_key_id,
                                               aws_secret_access_key=aws_secret_access_key,
                                               region_name=region_name)
        return cls._instance


# Get environment variables
aws_access_key_id = os.getenv('aws_access_key_id')
aws_secret_access_key = os.getenv('aws_secret_access_key')
bucket_name = os.getenv('bucket_name')
region = os.getenv('region')
schema_path = os.getenv('schema_path')


s3_singleton = S3Singleton(
    aws_access_key_id, aws_secret_access_key, region, bucket_name)

polly_singleton = PollySingleton(
    aws_access_key_id, aws_secret_access_key, region)


# Generate 0.5 seconds of silence
half_sec_silence = AudioSegment.silent(
    duration=500)  # duration in milliseconds


def split_input_path(input_path):
    usermail, filename = input_path.split('/', 1)
    return usermail, filename


def download_pptx_from_s3(usermail, project, filename):
    try:
        obj = s3_singleton.s3.Object(bucket_name,
                                     f'{usermail}/{project}/{filename}')
        pptx_file = io.BytesIO()
        obj.download_fileobj(pptx_file)
        if obj is None:
            raise UserParameterException("File not found: check parameters")
        return pptx_file
    except UserParameterException as e:
        raise UserParameterException(e)
    except Exception as e:
        raise AmazonException(e)


def upload_pptx_to_s3(usermail, project, filename, pptx_file):
    try:
        obj = s3_singleton.s3.Object(bucket_name,
                                    f'{usermail}/{project}/edited/{filename}')
        pptx_file.seek(0)
        obj.upload_fileobj(pptx_file)
    except Exception as e:
        raise AmazonException(e)


# def upload_mp3_to_s3(usermail, project, filename, audio_segment):
#     try:
#         mp3_buffer = io.BytesIO()
#         audio_segment.export(mp3_buffer, format="mp3")
#         mp3_buffer.seek(0)
#         obj = s3_singleton.s3.Object(
#             bucket_name, f'{usermail}/{project}/edited/{filename}')
#         obj.upload_fileobj(mp3_buffer)
#     except Exception as e:
#         raise AmazonException(e)


def generate_tts(text, voice_id):
    try:
        try:
            polly_client = polly_singleton.polly
            response = polly_client.synthesize_speech(
                VoiceId=voice_id, OutputFormat='mp3', Text=text, TextType='ssml', Engine='neural')
        except Exception as e:
            raise AmazonException(f"Exception from Polly: {str(e)}")
        filename = f'tts_{uuid.uuid4()}.mp3'
        with open(filename, 'wb') as out:
            out.write(response['AudioStream'].read())
        return filename
    except AmazonException as e:
        raise AmazonException(e)
    except Exception as e:
        raise ElaborationException(f"Exception while saving audio to file: {str(e)}")



def combine_audio_files(audio_files):
    combined = AudioSegment.empty()
    for audio_file in audio_files:
        audio = AudioSegment.from_mp3(audio_file)
        combined += audio
    combined_filename = f"/tmp/combined_{hash(''.join(audio_files))}.mp3"
    combined.export(combined_filename, format="mp3")
    return combined_filename


def process_slide(slide):
    try:
        modified = False

        notes_slide = slide.notes_slide
        notes_text = notes_slide.notes_text_frame.text

        if not notes_text or not notes_text.strip():
            return modified

        checked_missing_tags = find_missing_tags(notes_text)
        corrected_ssml = correct_special_characters(
            checked_missing_tags)
        validation_result = validate_ssml(corrected_ssml, schema_path)

        if not validation_result:
            raise ElaborationException(f"Validation failed.")
        parsed_ssml = parse_ssml(corrected_ssml)
    except UserParameterException as e:
        raise UserParameterException(e)
    except Exception as e:
        raise ElaborationException(
            f"Presentation Elaboration: Exception during SSML correction/validation/parsing: {str(e)}")
    try:
        if len(parsed_ssml) == 1:
            for voice_name, text in parsed_ssml:
                try:
                    filename = generate_tts(text, voice_name)
                    audio = AudioSegment.from_file(filename, format='mp3')
                
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
                finally:
                    os.remove(filename)
        else:
            try:
                audios = []
                for voice_name, text in parsed_ssml:
                    filename = generate_tts(text, voice_name)
                    audio = AudioSegment.from_mp3(filename)
                    audios.append(audio)
                    audios.append(half_sec_silence)
                audios.pop()
                combined_audio = audios[0]
                for audio in audios[1:]:
                    combined_audio += audio
                combined_filename = f'combined_{uuid.uuid4()}.mp3'
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
                raise Exception(f"Error during audio combining/exporting or adding to slide: {str(e)}")
            finally:
                os.remove(combined_filename)
        modified = True
        return modified
    except OSError as e:
        raise ElaborationException(
            f"Critical: could not delete temp file: {e.filename}")
    except AmazonException as e:
        raise AmazonException(e)
    except UserParameterException as e:
        raise UserParameterException(e)
    except Exception as e:
        raise ElaborationException(f"Exception while processing a slide: {str(e)}")


def add_tts_to_pptx(pptx_file):
    try:
        pptx_file.seek(0)
        prs = Presentation(pptx_file)
        modified = False
        for slide in prs.slides:
            if process_slide(slide):
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


def process_pptx(usermail, project, filename):
    pptx_file = download_pptx_from_s3(usermail, project, filename)
    modified = add_tts_to_pptx(pptx_file)  # Capture the modified flag
    if modified:  # Only upload if changes were made
        edited_filename = f"{os.path.splitext(filename)[0]}_edited{os.path.splitext(filename)[1]}"
        upload_pptx_to_s3(usermail, project, edited_filename, pptx_file)


def process_preview(text):
    try:
        checked_missing_tags = find_missing_tags(text)
        corrected_ssml = correct_special_characters(checked_missing_tags)
        validation_result = validate_ssml(corrected_ssml, schema_path)
        if not validation_result:
            raise ElaborationException(
                f"Validation failed.")
        parsed_ssml = parse_ssml(corrected_ssml)
    except UserParameterException as e:
        raise UserParameterException(e)
    except Exception as e:
        raise ElaborationException(
            f"(Audio Preview: Exception during SSML correction/validation/parsing: {str(e)}")
    try:
        if len(parsed_ssml) == 1:
            for voice_name, text in parsed_ssml:
                try: 
                    filename = generate_tts(text, voice_name)
                    audio = AudioSegment.from_file(filename, format='mp3')
                except AmazonException as e:
                    raise AmazonException(e)
                except ElaborationException as e:
                    raise ElaborationException(e)
                except Exception as e:
                    raise Exception(
                        f"Error during audio exporting: {str(e)}")
                finally:
                    os.remove(filename)
            return audio
        else:
            try:
                audios = []
                for voice_name, text in parsed_ssml:
                    filename = generate_tts(text, voice_name)
                    audio = AudioSegment.from_mp3(filename)
                    audios.append(audio)
                    audios.append(half_sec_silence)
                audios.pop()
                combined_audio = audios[0]
                for audio in audios[1:]:
                    combined_audio += audio
                combined_filename = f'combined_{uuid.uuid4()}.mp3'
                combined_audio.export(
                        combined_filename, format="mp3", bitrate="320k")
                return combined_audio
            except AmazonException as e:
                raise AmazonException(e)
            except ElaborationException as e:
                raise ElaborationException(e)
            except Exception as e:
                raise Exception(f"Error during combined audio exporting: {str(e)}")
            finally:
                os.remove(combined_filename)
    except OSError as e:
        raise ElaborationException(
            f"Critical: could not delete temp file: {e.filename}")
    except AmazonException as e:
        raise AmazonException(e)
    except UserParameterException as e:
        raise UserParameterException(e)
    except Exception as e:
        raise ElaborationException(f"Exception while processing a slide: {str(e)}")


def extract_fonts_from_pptx(pptx_path, extract_to):
    with ZipFile(pptx_path, 'r') as zip_ref:
        for file_info in zip_ref.infolist():
            print(f"Extracted {file_info.filename} to {extract_to}")
            if 'ppt/fonts/' in file_info.filename:
                zip_ref.extract(file_info, extract_to)
                print(f"Extracted {file_info.filename} to {extract_to}")


def pptx_to_pdf(pptx_file_path):

    path_to_libreoffice = r"C:\Program Files\LibreOffice\program\soffice.exe"
    try:
        # Check if file exists
        if not os.path.exists(pptx_file_path):
            print(f"File not found: {pptx_file_path}")
            return None

        # Check file permissions
        if not os.access(pptx_file_path, os.R_OK):
            print(f"No read permissions for file: {pptx_file_path}")
            return None

        # Generate the output PDF path
        output_folder = os.path.dirname(pptx_file_path)
        output_pdf_path = os.path.join(
            output_folder, f"{os.path.splitext(os.path.basename(pptx_file_path))[0]}.pdf")

        # Form the command for LibreOffice
        command = f"\"{path_to_libreoffice}\"lowriter --headless --convert-to pdf --outdir \"{output_folder}\" \"{pptx_file_path}\""

        # Start the process
        process = subprocess.Popen(
            command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # Wait for the process to complete or time out
        try:
            stdout, stderr = process.communicate(
                timeout=20)  # Set timeout to 20 seconds
            print("Standard Output:", stdout.decode())
            print("Standard Error:", stderr.decode())
        except subprocess.TimeoutExpired:
            print("Process timed out. Killing it.")
            process.terminate()
        # try:
        #     os.remove(pptx_file_path)
        # except OSError as e:
        #     print(f"Error: {e.filename} - {e.strerror}.")

        return output_pdf_path

    except Exception as e:
        print(f"An error occurred: {e}")
        return None


def pdf_to_images(pdf_path):
    return convert_from_path(pdf_path)


def extract_notes_from_slide(slide):
    slide_number = slide.slide_id
    notes_text = ""
    if slide.has_notes_slide:
        notes_slide = slide.notes_slide
        notes_text = notes_slide.notes_text_frame.text
    return slide_number, notes_text


def upload_to_s3_subfolder(file_path, usermail, project, subfolder, filename):
    obj = s3_singleton.Object(
        bucket_name, f'{usermail}/{project}/edited/{subfolder}/{filename}')
    with open(file_path, 'rb') as f:
        obj.upload_fileobj(f)


def extract_notes_and_images_from_pptx(pptx_file):
    prs = Presentation(pptx_file)
    extracted_data = []
    for i, slide in enumerate(prs.slides):
        slide_image = io.BytesIO()  # Replace with your actual slide to image conversion
        notes = slide.notes_slide.notes_text if slide.notes_slide else ''
        if notes:
            tts_data = generate_tts(notes)
        else:
            tts_data = None
        extracted_data.append({
            "slide_image": slide_image,
            "tts_data": tts_data
        })
    return extracted_data


def upload_to_s3(usermail, project, filename, file_obj):
    obj = s3_singleton.Object(
        bucket_name, f'{usermail}/{project}/edited/{filename}')
    file_obj.seek(0)
    obj.upload_fileobj(file_obj)


def generate_tts2(text, voice_id, filename):
    polly_client = polly_singleton.polly
    try:
        response = polly_client.synthesize_speech(
            VoiceId=voice_id, OutputFormat='mp3', Text=text, TextType='ssml', Engine='neural')
        with open(filename, 'wb') as out:  # open for [w]riting as [b]inary
            out.write(response['AudioStream'].read())
    except Exception as e:
        print(f"Error during audio generation: {str(e)}")
        return None


def audiosegment_to_base64(audio_segment):
    buffer = io.BytesIO()
    audio_segment.export(buffer, format="mp3")
    return base64.b64encode(buffer.getvalue()).decode('utf-8')


def image_to_base64(image):
    image_bytes = io.BytesIO()
    image.save(image_bytes, format='JPEG')
    return base64.b64encode(image_bytes.getvalue()).decode('utf-8')


def process_pptx_split(usermail, project, filename):
    tts_generated = False
    try:
        # Download the pptx file from S3
        pptx_file = download_pptx_from_s3(usermail, project, filename)

        # Create a temporary folder
        temp_folder = f"{usermail}_{project}_temp"
        os.makedirs(temp_folder, exist_ok=True)

        # Generate the full path where the file will be saved
        pptx_file_path = os.path.join(temp_folder, filename)

        # Save the BytesIO object to a file
        with open(pptx_file_path, 'wb') as f:
            f.write(pptx_file.getbuffer())

        # Assert that the file exists and is not empty
        assert os.path.isfile(
            pptx_file_path), f"{pptx_file_path} is not a file"

        pptx_file.seek(0)
        prs = Presentation(pptx_file)

        # Convert PPTX to PDF
        pdf_path = pptx_to_pdf(pptx_file_path).replace('.pptx.pdf', '.pdf')

        # Convert PDF to Images
        print("prima")
        images = pdf_to_images(pdf_path)
        print("dopo")

        slide_data = []

        for i, (slide, image) in enumerate(zip(prs.slides, images)):
            try:
                notes_slide = slide.notes_slide
                notes_text = notes_slide.notes_text_frame.text

                image_path = os.path.join(temp_folder, f'slide_{i}.jpg')
                image.save(image_path)
                image_base64 = image_to_base64(image)

                tts_generated = False

                if not notes_text or not notes_text.strip():
                    print("No notes text for this slide, skipping TTS...")
                else:
                    checked_missing_tags = find_missing_tags(notes_text)
                    corrected_ssml = correct_special_characters(
                        checked_missing_tags)

                    if not validate_ssml(corrected_ssml, schema_path):
                        print("Invalid SSML, skipping...")
                    else:
                        parsed_ssml = parse_ssml(corrected_ssml)
                        try:
                            if len(parsed_ssml) == 1:
                                for voice_name, text in parsed_ssml:
                                    filename = os.path.join(
                                        temp_folder, f'slide_{i}.mp3')
                                    audio = generate_tts2(
                                        text, voice_name, filename)
                                    audio = AudioSegment.from_file(filename)
                                    audio_base64 = audiosegment_to_base64(
                                        audio)
                                    tts_generated = True

                            else:  # For more than one voice tag in the notes
                                audios = []
                                for j, (voice_name, text) in enumerate(parsed_ssml):
                                    filename = os.path.join(
                                        temp_folder, f'multi_voice_{j}.mp3')
                                    generate_tts2(text, voice_name, filename)
                                    audio = AudioSegment.from_file(filename)
                                    audios.append(audio)
                                combined_audio = sum(audios[1:], audios[0])
                                combined_filename = os.path.join(
                                    temp_folder, f'slide_{i}.mp3')
                                combined_audio.export(
                                    combined_filename, format="mp3", bitrate="320k")
                                audio_base64 = audiosegment_to_base64(
                                    combined_audio)
                                tts_generated = True
                        except Exception as e:
                            print(f"Error during audio generation: {str(e)}")
                            return  # Skip the slide if there was an error
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

                slide_data.append(slide_info)

            except Exception as e:
                print(f"An error occurred while processing slide {i}: {e}")

        # # Cleanup temporary files
        # os.remove(pptx_file_path)
        # os.remove(pdf_path)
        # for i in range(len(images)):
        #     os.remove(f"/tmp/slide_{i}.jpg")
        #     if os.path.exists(f"/tmp/slide_{i}.mp3"):
        #         os.remove(f"/tmp/slide_{i}.mp3")
        return slide_data

    except Exception as e:
        print(f"An exception occurred in process_pptx_split: {e}")
        return json.dumps({"error": str(e)})
