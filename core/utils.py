from exceptions import *
import shutil
import base64
import io

def delete_folder(folder_name):
    try:
        shutil.rmtree(temp_folder)
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