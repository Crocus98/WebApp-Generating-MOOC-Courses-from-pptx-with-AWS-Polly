import shutil
import base64
import os
import io
from io import BytesIO
import zipfile
from pdf2image import convert_from_bytes, convert_from_path
from pydub import AudioSegment
import tempfile
from pptx.util import Inches
from pptx.oxml.ns import nsdecls
from pptx.oxml import parse_xml
from pptx import Presentation
from ssml_validation import *
from exceptions import *


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


def create_folder(folder_path):
    os.makedirs(folder_path, exist_ok=True)
    return os.path.abspath(folder_path)


def delete_folder(folder):
    try:
        shutil.rmtree(folder)
    except Exception as e:
        raise ElaborationException(
            f"Critical: Exception while deleting temp folder: {str(e)}")


def combine_audios(audios):
    audios.pop()
    combined_audio = audios[0]
    for audio in audios[1:]:
        combined_audio += audio
    return combined_audio


def add_audio_to_slide(slide, audio_path):
    left, top, width, height = Inches(1), Inches(1.5), Inches(1), Inches(1)
    slide.shapes.add_movie(audio_path, left, top, width,
                           height, mime_type="audio/mp3")


def check_correct_validate_parse_text(notes_text):
    try:
        checked_missing_tags = find_missing_tags(notes_text)
        corrected_ssml = correct_special_characters(checked_missing_tags)
        validate_ssml(corrected_ssml)
        return parse_ssml(corrected_ssml)
    except UserParameterException as e:
        raise UserParameterException(e)
    except Exception as e:
        raise ElaborationException(
            f"Exception during SSML correction/validation/parsing: {str(e)}")


def check_slide_have_notes(notes_slide):
    if notes_slide and notes_slide.notes_text_frame:
        notes_text = notes_slide.notes_text_frame.text
        if notes_text and notes_text.strip():
            return notes_text
    return None


def audiosegment_to_stream(audio_segment):
    try:
        stream = io.BytesIO()
        audio_segment.export(stream, format="mp3")
        stream.seek(0)
        return stream
    except Exception as e:
        raise ElaborationException(
            f"Exception while converting audio to stream: {str(e)}")


def get_notes_from_slide(slide, slide_index, queue):
    notes_text = check_slide_have_notes(slide.notes_slide)
    if not notes_text:
        queue.put([None, True, slide_index])
        return None
    return notes_text


def generate_tts(polly, text, voice_id):
    response = polly.polly.synthesize_speech(
        VoiceId=voice_id, OutputFormat='mp3', Text=text, TextType='ssml', Engine='neural')

    if not response['ResponseMetadata']['HTTPStatusCode'] == 200:
        raise AmazonException(
            f"Polly failed to elaborate tts. Response is not 200.")
    audio_data = response['AudioStream'].read()
    return AudioSegment.from_mp3(io.BytesIO(audio_data))
