from manipulation import *
from ssml_validation import *

filename1 = 'RandomPresentation-NotesAndTags.zip'
filename2 = 'empty_pptx.zip'
filename3 = '10_slides_with_tags.zip'
filename4 = '10_slides_no_tags.zip'
filename5 = '5_slides_extreme_tags.zip'
filename6 = '50_slides_mixed.zip'
filename7 = '5_slides_no_notes.zip'
filename8 = '12Twe.zip'
filename9 = '1234v2_original.zip'
filename10 = '50_slides_mixedk.zip'


def test_process_pptx_split(usermail, project, filename):
    try:
        result = process_pptx_split(usermail, project, filename)
        print(f"process_pptx_split result:\n{result}")
    except Exception as e:
        print(f"Error during process_pptx_split: {str(e)}")


def test_process_preview(text):
    try:
        result = process_preview(text)
        print(f"process_preview result:\n{result}")
    except Exception as e:
        print(f"Error during process_preview: {str(e)}")


def test_process_pptx(usermail, project, filename):
    try:
        result = process_pptx(usermail, project, filename)
        print(f"process_pptx result:\n{result}")
    except Exception as e:
        print(f"Error during process_pptx: {str(e)}")


usermail = 'giacomo.vinati@mail.polimi.it'
project = 'GigaChad2'


# Run the test functions
# test_process_pptx(usermail, project, filename1)
# test_process_pptx(usermail, project, filename2)
# test_process_pptx(usermail, project, filename3)
# test_process_pptx(usermail, project, filename4)
# test_process_pptx(usermail, project, filename5)
# test_process_pptx(usermail, project, filename6)
# test_process_pptx(usermail, project, filename7)
# test_process_pptx(usermail, project, filename8)
# test_process_pptx(usermail, project, filename9)
test_process_pptx(usermail, project, filename10)


# test_process_pptx_split(usermail, project, filename1)
# test_process_pptx_split(usermail, project, filename2)
# test_process_pptx_split(usermail, project, filename3)
# test_process_pptx_split(usermail, project, filename4)
# test_process_pptx_split(usermail, project, filename5)
# test_process_pptx_split(usermail, project, filename6)
# test_process_pptx_split(usermail, project, filename7)
# test_process_pptx_split(usermail, project, filename8)
# test_process_pptx_split(usermail, project, filename9)
# test_process_pptx_split(usermail, project, filename10)


# test_process_preview(testoporva1)
# test_process_preview(testoporva2)
# test_process_preview(testoporva3)
# test_process_preview(testoporva4)
