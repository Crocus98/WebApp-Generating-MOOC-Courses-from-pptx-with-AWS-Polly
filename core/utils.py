from pdf2image import convert_from_path
from pydub import AudioSegment
from pptx.util import Inches
from ssml_validation import *
from exceptions import *
import shutil
import base64
import os
import io


def delete_folder(folder):
    try:
        shutil.rmtree(folder)
    except Exception as e:
        raise ElaborationException(
            f"Critical: Exception while deleting temp folder: {str(e)}")


def audiosegment_to_base64(audio_segment):
    try:
        buffer = io.BytesIO()
        audio_segment.export(buffer, format="mp3")
        return base64.b64encode(buffer.getvalue()).decode('utf-8')
    except Exception as e:
        raise ElaborationException(
            f"Exception while converting audio to base64: {str(e)}")


def image_to_base64(image):
    try:
        image_bytes = io.BytesIO()
        image.save(image_bytes, format='JPEG')
        return base64.b64encode(image_bytes.getvalue()).decode('utf-8')
    except Exception as e:
        raise ElaborationException(
            f"Exception while converting image to base64: {str(e)}")


def split_input_path(input_path):
    usermail, filename = input_path.split('/', 1)
    return usermail, filename


def combine_audio_files(audio_files):
    try:
        combined = AudioSegment.empty()
        for audio_file in audio_files:
            audio = AudioSegment.from_mp3(audio_file)
            combined += audio
        combined_filename = f"/tmp/combined_{hash(''.join(audio_files))}.mp3"
        combined.export(combined_filename, format="mp3")
        return combined_filename
    except Exception as e:
        raise Exception(
            f"Error during audio combining/exporting: {str(e)}")


def create_folder(folder_path):
    os.makedirs(folder_path, exist_ok=True)
    return folder_path


def pdf_to_images(pdf_path):
    try:
        return convert_from_path(pdf_path)
    except Exception as e:
        raise ElaborationException(
            f"Exception while converting PDF to images: {str(e)}")


def is_pptx_file(file_path):
    _, file_extension = os.path.splitext(file_path)
    return file_extension.lower() == ".pptx"


def file_ispptx_exists_readpermission(file_path):
    return is_pptx_file and os.path.exists(file_path) and os.access(file_path, os.R_OK)


def check_slide_have_notes(notes_slide):
    if notes_slide and notes_slide.notes_text_frame:
        notes_text = notes_slide.notes_text_frame.text
        if notes_text and notes_text.strip():
            return notes_text, True
    return None, False


def check_correct_validate_parse_text(notes_text):
    checked_missing_tags = find_missing_tags(notes_text)
    corrected_ssml = correct_special_characters(checked_missing_tags)
    validate_ssml(corrected_ssml, schema_path)
    return parse_ssml(corrected_ssml)


def slide_split_data(index, image_base64, audio_base64):
    return {
        "slide_id": index,
        "image": {
            "data": image_base64,
            "filename": f"slide_{index}.jpg"
        },
        "tts": {
            "data": audio_base64,
            "filename": f"slide_{index}.mp3"
        } if audio_base64 is not None else None
    }


def extract_image_from_slide(index, folder, image):
    image_path = os.path.join(folder, f'slide_{index}.jpg')
    image.save(image_path)
    return image_to_base64(image)


def add_audio_to_slide(slide, filename):
    left, top, width, height = Inches(1), Inches(2.5), Inches(1), Inches(1)
    slide.shapes.add_movie(
        filename, left, top, width, height, mime_type="audio/mp3", poster_frame_image=None)
