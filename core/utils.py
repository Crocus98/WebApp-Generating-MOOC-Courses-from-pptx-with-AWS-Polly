from exceptions import *
import shutil

def delete_folder(folder_name):
    try:
        shutil.rmtree(temp_folder)
    except Exception as e:
        raise ElaborationException(
            f"Critical: Exception while deleting temp folder: {str(e)}")