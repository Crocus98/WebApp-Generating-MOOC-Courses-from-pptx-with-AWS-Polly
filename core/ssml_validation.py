import xml.etree.ElementTree as ET
import re
import html

from collections import deque
from lxml import etree

schema_path = 'WebApp\core\ssml.xsd'

def correct_special_characters(ssml_text):
    escape_chars = {
        '&': '&amp;',
        # '\'': '&apos;',
        '\"': '&quot;',
        '<': '&lt;',
        '>': '&gt;'
    }

    # Parse the XML document
    root = ET.fromstring(ssml_text)

    # Walk through all elements in the document
    for element in root.iter():
        # If the element has a text content, replace the special characters
        if element.text:
            element.text = ''.join(escape_chars.get(c, c) for c in element.text)
        # Also check the tail text
        if element.tail:
            element.tail = ''.join(escape_chars.get(c, c) for c in element.tail)

    # Write the corrected document back to a string
    corrected_ssml = ET.tostring(root, encoding='unicode')

    return corrected_ssml

def validate_ssml(ssml_text, schema_path):
    # Load schema
    try:
        with open(schema_path, 'r') as schema_file:
            schema_root = etree.parse(schema_file)
            schema = etree.XMLSchema(schema_root)
    except FileNotFoundError:
        print(f"Schema file not found: {schema_path}")
        return False  # Indicate an error with a False return value

    # Correct and parse SSML document
    ssml_text = correct_special_characters(ssml_text)
    ssml = etree.fromstring(ssml_text)

    # Validate SSML document against schema
    if not schema.validate(ssml):
        print('SSML validation failed')
        print(schema.error_log)
        return False

    # Additional validation
    text_tags = ['p', 's']
    for tag in text_tags:
        for element in ssml.iter(tag):
            if not re.search('\S', element.text):
                print(f'Text validation failed for tag: {tag}')
                return False

    print('SSML validation passed')
    return True

def escape_ssml_chars(text):
    escape_chars = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;'
    }
    return ''.join(escape_chars.get(c, c) for c in text)


def parse_ssml(ssml_text):
    lines = deque()

    # Parse the XML document
    root = ET.fromstring(ssml_text)

    # Find all 'voice' elements
    voice_elements = root.findall('.//voice')

    # If no voice elements are present, create a default one
    if not voice_elements:
        lines.append(('Brian', ssml_text))
    else:
        for voice_element in voice_elements:
            voice_name = voice_element.attrib.get('voice_name')

            # Start constructing a new 'speak' SSML string
            speak_ssml = "<speak>"

            # If the 'voice' tag contains text, add it to the 'speak' SSML string
            if voice_element.text and voice_element.text.strip():
                speak_ssml += escape_ssml_chars(voice_element.text.strip())

            # Add all child elements of the 'voice' tag to the 'speak' SSML string
            for child in voice_element:
                speak_ssml += ET.tostring(child, encoding='unicode')

            speak_ssml += "</speak>"
            lines.append((voice_name, speak_ssml))

    return lines



def test_functions():
    ssml_text = '''
<speak>
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
</speak>
    '''
    
    # Test special character correction function
    corrected_ssml = correct_special_characters(ssml_text)
    print("Corrected SSML: \n", corrected_ssml)

    # Test SSML validation function
    validation_result = validate_ssml(corrected_ssml, schema_path)
    print("Validation result: ", validation_result)

    # Test SSML parsing function
    parsed_ssml = parse_ssml(ssml_text)
    print ("plain: ", parsed_ssml)
    print ("lenght: " , len(parsed_ssml))
    print ("Parsed SSML: ")
    while parsed_ssml:
        voice_name, text = parsed_ssml.popleft()
        print(f"{voice_name}: {text}")


    # for voice_name, text in parsed_ssml:
    #     print(f"{voice_name}: {text}")

if __name__ == "__main__":
    test_functions()
