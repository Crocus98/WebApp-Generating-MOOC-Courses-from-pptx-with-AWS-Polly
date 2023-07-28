from manipulation2 import *
from ssml_validation import *


filename1 = 'RandomPresentation-NotesAndTags.pptx'
filename2 = 'RandomPresentation-RandomNotes.pptx'
filename3 = 'RandomPresentation-NoNotes'
testoporva1 = '''<speak>
  <voice voice_name="Joanna">
    Here's a phoneme: <phoneme alphabet="ipa" ph="pɪˈkɑːn"/>. 
    And here's a date: <say-as interpret-as="date" format="ymd">2023-07-26</say-as>.
  </voice>
   <voice voice_name="Matthew">
        Nice to meet you, Joanna.
     </voice>
     <voice voice_name="Amy">
    The word <sub alias="kilogram">kg</sub> is an abbreviation for kilogram.
  </voice>
   <voice voice_name="Matthew">
    <prosody rate="x-slow">
      Hello, I am speaking slowly and loudly.
    </prosody>
    <lang lang="en-US">
      This part is in American English.
    </lang>
    <prosody volume="+6dB">
      Hello, I am speaking slowly and loudly.
    </prosody>
  </voice>
</speak>'''

testoporva2 = ''' CIaociao ciao ciao '''
testoporva3 = '''<speak>
    Here's a phoneme: <phoneme alphabet="ipa" ph="pɪˈkɑːn"/>. 
    And here's a date: <say-as interpret-as="date" format="ymd">2023-07-26</say-as>.
</speak>'''
testoporva4 = '''<voice voice_name="Matthew">
    <prosody rate="x-slow">
      Hello, I am speaking slowly and loudly.
    </prosody>
    <lang lang="en-US">
      This part is in American English.
    </lang>
    <prosody volume="+6dB">
      Hello, I am speaking slowly and loudly.
    </prosody>
  </voice>'''


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
project = 'Progetto'


# Run the test functions
test_process_pptx(usermail, project, filename1)
# test_process_pptx(usermail, project, filename2)
# test_process_pptx(usermail, project, filename3)
# test_process_pptx_split(usermail, project, filename1)
# test_process_pptx_split(usermail, project, filename2)
# test_process_pptx_split(usermail, project, filename3)

# test_process_preview(testoporva1)
# test_process_preview(testoporva2)
# test_process_preview(testoporva3)
# test_process_preview(testoporva4)
