from zipfile import ZipFile
from pptx import Presentation
from pptx.util import Inches
from pptx.enum.shapes import MSO_SHAPE
from dotenv import load_dotenv
from pydub import AudioSegment
from concurrent.futures import ThreadPoolExecutor
from ssml_validation import *
from pdf2image import convert_from_path
from pydub import AudioSegment
from pydub.playback import play
import subprocess
import tempfile
import boto3
import uuid
import json
import time
import io
import os


# Get environment variables
aws_access_key_id = os.getenv('aws_access_key_id')
aws_secret_access_key = os.getenv('aws_secret_access_key')
bucket_name = os.getenv('bucket_name')
region = os.getenv('region')
schema_path = os.getenv('schema_path')


# Generate 0.5 seconds of silence
half_sec_silence = AudioSegment.silent(
    duration=500)  # duration in milliseconds


def split_input_path(input_path):
    usermail, filename = input_path.split('/', 1)
    return usermail, filename


def download_pptx_from_s3(usermail, project, filename):
    s3 = boto3.resource('s3', aws_access_key_id=aws_access_key_id,
                        aws_secret_access_key=aws_secret_access_key, region_name=region)
    obj = s3.Object(bucket_name, f'{usermail}/{project}/{filename}')
    pptx_file = io.BytesIO()
    obj.download_fileobj(pptx_file)
    return pptx_file


def upload_pptx_to_s3(usermail, project, filename, pptx_file):
    s3 = boto3.resource('s3', aws_access_key_id=aws_access_key_id,
                        aws_secret_access_key=aws_secret_access_key, region_name=region)
    # Include the 'edited' directory in the path
    obj = s3.Object(bucket_name, f'{usermail}/{project}/edited/{filename}')
    pptx_file.seek(0)
    obj.upload_fileobj(pptx_file)


def upload_mp3_to_s3(usermail, project, filename, audio_segment):
    # Convert AudioSegment to bytes and save in a BytesIO object
    mp3_buffer = io.BytesIO()
    audio_segment.export(mp3_buffer, format="mp3")

    # Reset buffer position to the beginning
    mp3_buffer.seek(0)

    # Upload BytesIO object to S3
    s3 = boto3.resource('s3', aws_access_key_id=aws_access_key_id,
                        aws_secret_access_key=aws_secret_access_key, region_name=region)
    obj = s3.Object(bucket_name, f'{usermail}/{project}/edited/{filename}')
    obj.upload_fileobj(mp3_buffer)


def generate_tts(text, voice_id):
    polly_client = boto3.client('polly', aws_access_key_id=aws_access_key_id,
                                aws_secret_access_key=aws_secret_access_key, region_name=region)
    try:

        response = polly_client.synthesize_speech(
            VoiceId=voice_id, OutputFormat='mp3', Text=text, TextType='ssml', Engine='neural')
        # Create unique filename for the audio file
        filename = f'tts_{uuid.uuid4()}.mp3'
        with open(filename, 'wb') as out:  # open for [w]riting as [b]inary
            out.write(response['AudioStream'].read())
    except Exception as e:
        print(f"Error during audio generation: {str(e)}")
        return None

    return filename


def combine_audio_files(audio_files):
    combined = AudioSegment.empty()
    for audio_file in audio_files:
        audio = AudioSegment.from_mp3(audio_file)
        combined += audio
    combined_filename = f"/tmp/combined_{hash(''.join(audio_files))}.mp3"
    combined.export(combined_filename, format="mp3")
    return combined_filename


def process_slide(slide):
    modified = False  # Initialize a flag to track if we modify the slide

    try:
        notes_slide = slide.notes_slide
        notes_text = notes_slide.notes_text_frame.text
    except AttributeError:
        print("No notes for this slide, skipping...")
        return modified  # Returning False because no modification occurred

    if not notes_text or not notes_text.strip():
        print("No notes text for this slide, skipping...")
        return modified  # Returning False because no modification occurred

    try:
        notes_slide = slide.notes_slide
        # print(f"notes_slide: {notes_slide}")
        notes_text = notes_slide.notes_text_frame.text
        # print(f"notes_text: {notes_text}")
        if notes_text and notes_text.strip():  # Check if notes_text is not empty
            # Correct special characters and validate the SSML
            # print(f"not empty")
            checked_missing_tags = find_missing_tags(notes_text)
            # print(f"checked_missing_tags: {checked_missing_tags}")
            try:
                corrected_ssml = correct_special_characters(
                    checked_missing_tags)
            except Exception as e:
                print(
                    f"Error during SSML correct_special_characters: {str(e)}")
                return
            # print("Corrected SSML: \n", corrected_ssml)

            validation_result = validate_ssml(corrected_ssml, schema_path)
            # print("Validation result: ", validation_result)

            # # Test SSML validation function
            if not validation_result:
                raise ValueError
                # print(" NOT VALIDATE SSML")
            # Process the SSML
            # print("VALIDATE SSML")
            try:
                parsed_ssml = parse_ssml(corrected_ssml)
            except Exception as e:
                print(f"Error during SSML parsing: {str(e)}")
                return
            # print(f"parsed_ssml: {parsed_ssml}")
            # combined_text = ''.join(text for voice_name, text in parsed_ssml)
            # print(f"Combined text: {combined_text}")
            try:
                if len(parsed_ssml) == 1:
                    print("len == 1")
                    for voice_name, text in parsed_ssml:
                        filename = generate_tts(text, voice_name)
                        print(f"filename: {filename}")
                        audio = AudioSegment.from_file(filename, format='mp3')
                        print(f"audio: {audio}")
                        try:
                            # Add the combined audio to the slide
                            left, top, width, height = Inches(
                                1), Inches(2.5), Inches(1), Inches(1)
                            slide.shapes.add_movie(
                                filename, left, top, width, height, mime_type="audio/mp3", poster_frame_image=None)
                        except Exception as e:
                            print(
                                f"Error during audio combining/exporting or adding to slide: {str(e)}")
                            return

                        # Remove the temporary files after using them
                        try:
                            os.remove(filename)
                        except OSError as e:
                            print(f"Error: {e.filename} - {e.strerror}.")
                else:
                    audios = []
                    # Generate an mp3 file for each voice and text
                    for voice_name, text in parsed_ssml:
                        # generate_tts now outputs a file path
                        filename = generate_tts(text, voice_name)
                        print(f"filename: {filename}")
                        audio = AudioSegment.from_mp3(filename)
                        audios.append(audio)
                        audios.append(half_sec_silence)  # 0.5 seconds pause
                        # combined_text += text
                        # print(f"combined_text: {combined_text}")
                        # print(f"audios final: {audios}")
                    # Remove last silence segment
                    audios.pop()
                    # print(f"audios final: {audios}")
                    # Combine all audios into one
                    combined_audio = audios[0]
                    for audio in audios[1:]:
                        combined_audio += audio

                    # Export combined audio to a file
                    combined_filename = f'combined_{uuid.uuid4()}.mp3'
                    combined_audio.export(
                        combined_filename, format="mp3", bitrate="320k")

                    try:
                        # Add the combined audio to the slide
                        left, top, width, height = Inches(
                            1), Inches(2.5), Inches(1), Inches(1)
                        slide.shapes.add_movie(
                            combined_filename, left, top, width, height, mime_type="audio/mp3", poster_frame_image=None)
                    except Exception as e:
                        print(
                            f"Error during audio combining/exporting or adding to slide: {str(e)}")
                        return

                        # Remove the temporary files after using them
                    try:
                        os.remove(combined_filename)
                    except OSError as e:
                        print(f"Error: {e.filename} - {e.strerror}.")
            except Exception as e:
                print(f"Error during audio generation: {str(e)}")
                return  # Skip the slide if there was an error
        modified = True  # Mark the slide as modified
    except Exception as e:
        print(f"Error during SSML correction/validation/parsing: {str(e)}")
    return modified


def add_tts_to_pptx(pptx_file):
    pptx_file.seek(0)
    prs = Presentation(pptx_file)
    modified = False  # Initialize flag
    for slide in prs.slides:
        if process_slide(slide):  # Modify process_slide to return True if modified, else False
            modified = True
    pptx_file.seek(0)
    if modified:  # Only save if changes were made
        prs.save(pptx_file)
    pptx_file.seek(0)
    return modified


def process_pptx(usermail, project, filename):
    print(usermail, project, filename)
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
    except Exception as e:
        print(f"Error during SSML correction/validation: {str(e)}")
        return

    if validation_result:
        try:
            # continue processing if SSML validation passed
            parsed_ssml = parse_ssml(corrected_ssml)
        except Exception as e:
            print(f"Error during SSML parsing: {str(e)}")
            return

        if len(parsed_ssml) == 1:
            # print("len == 1")
            for voice_name, text in parsed_ssml:
                filename = generate_tts(text, voice_name)
                print(f"filename: {filename}")
                audio = AudioSegment.from_file(filename, format='mp3')
                # upload_mp3_to_s3("", "", filename, audio)
                print(f"audio: {audio}")
                return audio

                # Remove the temporary files after using them
                try:
                    os.remove(filename)
                except OSError as e:
                    print(f"Error: {e.filename} - {e.strerror}.")
        else:
            audios = []
            # Generate an mp3 file for each voice and text
            for voice_name, text in parsed_ssml:
                # generate_tts now outputs a file path
                filename = generate_tts(text, voice_name)
                print(f"filename: {filename}")
                audio = AudioSegment.from_mp3(filename)
                audios.append(audio)
                audios.append(half_sec_silence)  # 0.5 seconds pause
                # combined_text += text
                # print(f"combined_text: {combined_text}")
                # print(f"audios final: {audios}")
                # Remove last silence segment
                audios.pop()
                # print(f"audios final: {audios}")
                # Combine all audios into one
                combined_audio = audios[0]
                for audio in audios[1:]:
                    combined_audio += audio

                    # Export combined audio to a file
                    combined_filename = f'combined_{uuid.uuid4()}.mp3'
                    combined_audio.export(
                        combined_filename, format="mp3", bitrate="320k")
                    return combined_audio
                    # Remove the temporary files after using them
                    try:
                        os.remove(combined_filename)
                    except OSError as e:
                        print(f"Error: {e.filename} - {e.strerror}.")
    else:
        print("SSML validation failed, cannot process the preview.")


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
                timeout=60)  # Set timeout to 60 seconds
            print("Standard Output:", stdout.decode())
            print("Standard Error:", stderr.decode())
        except subprocess.TimeoutExpired:
            print("Process timed out. Killing it.")
            process.terminate()

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
    s3 = boto3.resource('s3', aws_access_key_id=aws_access_key_id,
                        aws_secret_access_key=aws_secret_access_key, region_name=region)
    obj = s3.Object(
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
    s3 = boto3.resource('s3', aws_access_key_id=aws_access_key_id,
                        aws_secret_access_key=aws_secret_access_key, region_name=region)
    obj = s3.Object(bucket_name, f'{usermail}/{project}/edited/{filename}')
    file_obj.seek(0)
    obj.upload_fileobj(file_obj)


def generate_tts2(text, voice_id, filename):
    polly_client = boto3.client('polly', aws_access_key_id=aws_access_key_id,
                                aws_secret_access_key=aws_secret_access_key, region_name=region)
    try:
        response = polly_client.synthesize_speech(
            VoiceId=voice_id, OutputFormat='mp3', Text=text, TextType='ssml', Engine='neural')

        with open(filename, 'wb') as out:  # open for [w]riting as [b]inary
            out.write(response['AudioStream'].read())
    except Exception as e:
        print(f"Error during audio generation: {str(e)}")
        return None


def process_pptx_split(usermail, project, filename):
    tts_generated = False
    try:
        # Download the pptx file from S3
        pptx_file = download_pptx_from_s3(usermail, project, filename)

        # Create a temporary folder
        temp_folder = 'temp_folder'
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
                # Extract notes
                notes_slide = slide.notes_slide
                notes_text = notes_slide.notes_text_frame.text

                tts_generated = False

                if not notes_text or not notes_text.strip():
                    print("No notes text for this slide, skipping TTS...")
                else:
                    # Correct special characters and validate the SSML
                    checked_missing_tags = find_missing_tags(notes_text)
                    corrected_ssml = correct_special_characters(
                        checked_missing_tags)

                    # Validate SSML
                    if not validate_ssml(corrected_ssml, schema_path):
                        print("Invalid SSML, skipping...")
                    else:
                        # Parse SSML
                        parsed_ssml = parse_ssml(corrected_ssml)
                        try:
                            if len(parsed_ssml) == 1:
                                for voice_name, text in parsed_ssml:
                                    filename = os.path.join(
                                        temp_folder, f'slide_{i}.mp3')
                                    # Assuming generate_tts saves the mp3 to the given filename
                                    generate_tts2(text, voice_name, filename)
                                    tts_generated = True

                            else:  # For more than one voice tag in the notes
                                audios = []
                                for j, (voice_name, text) in enumerate(parsed_ssml):
                                    filename = os.path.join(
                                        temp_folder, f'multi_voice_{j}.mp3')
                                    # Assuming generate_tts saves the mp3 to the given filename
                                    generate_tts2(text, voice_name, filename)
                                    audio = AudioSegment.from_file(filename)
                                    audios.append(audio)

                                # Combine audio data and save to temp folder
                                combined_audio = sum(audios[1:], audios[0])
                                combined_filename = os.path.join(
                                    temp_folder, f'slide_{i}.mp3')
                                combined_audio.export(
                                    combined_filename, format="mp3", bitrate="320k")
                                tts_generated = True
                        except Exception as e:
                            print(f"Error during audio generation: {str(e)}")
                            return  # Skip the slide if there was an error
                slide_info = {
                    "slide_id": i,
                    "image": f"slide_{i}.jpg",
                    # Set to None if no TTS data
                    "tts": f"slide_{i}.mp3" if tts_generated else None
                }
                slide_data.append(slide_info)

                # Save image and TTS data locally
                image_path = os.path.join(temp_folder, f'slide_{i}.jpg')
                image.save(image_path)

                # # Upload image and TTS to S3
                # with open(image_path, "rb") as f:
                #     upload_to_s3(usermail, project,
                #                  f"split/slide_{i}.jpg", f)
                #     print(
                #         f"Uploaded image to {usermail}/{project}/split/slide_{i}.jpg")

                # if tts_generated:
                #     with open(mp3_path, "rb") as f:
                #         upload_to_s3(usermail, project,
                #                      f"split/slide_{i}.mp3", f)
                #         print(
                #             f"Uploaded TTS to {usermail}/{project}/split/slide_{i}.mp3")

            except Exception as e:
                print(f"An error occurred while processing slide {i}: {e}")

        # # Cleanup temporary files
        # os.remove(pptx_file_path)
        # os.remove(pdf_path)
        # for i in range(len(images)):
        #     os.remove(f"/tmp/slide_{i}.jpg")
        #     if os.path.exists(f"/tmp/slide_{i}.mp3"):
        #         os.remove(f"/tmp/slide_{i}.mp3")

        return json.dumps({"slides": slide_data})

    except Exception as e:
        print(f"An exception occurred in process_pptx_split: {e}")
        return json.dumps({"error": str(e)})
