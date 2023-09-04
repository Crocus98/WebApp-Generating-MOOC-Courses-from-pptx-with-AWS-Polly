import xml.etree.ElementTree as ET
from collections import deque
from lxml import etree
from xml.etree.ElementTree import ParseError
import re
import html
import os

schema_path = os.getenv('schema_path')


def correct_special_characters(ssml_text):
    escape_chars = {
        '&': '&amp;',
        # '\'': '&apos;',
        '\"': '&quot;',
        '<': '&lt;',
        '>': '&gt;'
    }
    # Remove leading white spaces
    ssml_text = ssml_text.lstrip()  
    # Parse the XML document
    root = ET.fromstring(ssml_text)
    # Walk through all elements in the document
    for element in root.iter():
        # If the element has a text content, replace the special characters
        if element.text:
            element.text = ''.join(escape_chars.get(c, c)
                                    for c in element.text)
        # Also check the tail text
        if element.tail:
            element.tail = ''.join(escape_chars.get(c, c)
                                    for c in element.tail)

    # Write the corrected document back to a string
    corrected_ssml = ET.tostring(root, encoding='unicode')
    return corrected_ssml



def validate_ssml(ssml_text, schema_path):
    ssml_text = ssml_text.lstrip()
    ssml_text = re.sub(r'\s+', ' ', ssml_text).strip()
    try:
        with open(schema_path, 'r') as schema_file:
            schema_root = etree.parse(schema_file)
            schema = etree.XMLSchema(schema_root)
    except Exception:
        raise Exception(f"Schema file for validation not found at path: {schema_path}")

    # Correct and parse SSML document
    ssml_text = correct_special_characters(ssml_text)
    ssml = etree.fromstring(ssml_text)

    # Validate SSML document against schema
    if not schema.validate(ssml):
        return False

    # Additional validation
    text_tags = ['p', 's']
    for tag in text_tags:
        for element in ssml.iter(tag):
            if not re.search('\S', element.text):
                return False
    return True


def escape_ssml_chars(text):
    escape_chars = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;'
    }
    return ''.join(escape_chars.get(c, c) for c in text)


def parse_ssml(ssml_text):
    ssml_text = ssml_text.lstrip()  # Remove leading white spaces
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
                # Replace the non-breaking space characters with regular spaces
                # Also replace newline and tab characters with spaces
                speak_ssml += voice_element.text.strip().replace('\xa0', ' ').replace('\n',
                                                                                      ' ').replace('\t', ' ').replace("\\'", "'")

            # Add all child elements of the 'voice' tag to the 'speak' SSML string
            for child in voice_element:
                # Replace the non-breaking space characters with regular spaces
                # Also replace newline and tab characters with spaces
                child_ssml = ET.tostring(child, encoding='unicode').replace('\xa0', ' ').replace('\n',
                                                                                                 ' ').replace('\t', ' ').replace("\\'", "'")
                speak_ssml += child_ssml

            speak_ssml += "</speak>"
            lines.append((voice_name, speak_ssml))

    return lines


def find_missing_tags(ssml_text):
    voice_name = 'Brian'

    # Case 1: Both '<speak>' and '<voice>' tags are not present
    if '<speak>' not in ssml_text and '<voice voice_name' not in ssml_text:
        speak_ssml = f'<speak><voice voice_name="{voice_name}">{ssml_text.strip()}</voice></speak>'

    # Case 2: '<speak>' tag is present but '<voice>' tag is not
    elif '<speak>' in ssml_text and '<voice voice_name' not in ssml_text:
        speak_ssml = ssml_text.replace('<speak>', f'<speak><voice voice_name="{voice_name}">').replace(
            '</speak>', f'</voice></speak>')

    # Case 3: '<voice>' tag is present but '<speak>' tag is not
    elif '<voice voice_name' in ssml_text and '<speak>' not in ssml_text:
        speak_ssml = f'<speak>{ssml_text}</speak>'
        
    # Case 4: Both '<speak>' and '<voice>' tags are present
    else:
        speak_ssml = ssml_text

    return speak_ssml


def test_functions():
    ssml_text = ''' <speak>
<voice voice_name="Joanna">
    Here's a phoneme: <phoneme alphabet="ipa" ph="pɪˈkɑːn" />.        
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
    <lang xml:lang="en-US">
      This part is in American English.
    </lang>
    <prosody volume="+6dB">
      Hello, I am speaking slowly and loudly.
    </prosody>
  </voice>
</speak>'''

    print("Original SSML: \n", ssml_text)

    checked_missing_tags = find_missing_tags(ssml_text)
    print("Checked missing tags: \n", checked_missing_tags)

    # # Test special character correction function
    corrected_ssml = correct_special_characters(checked_missing_tags)
    print("Corrected SSML: \n", corrected_ssml)

    # # Test SSML validation function
    validation_result = validate_ssml(corrected_ssml, schema_path)
    print("Validation result: ", validation_result)

    # # Test SSML parsing function
    parsed_ssml = parse_ssml(corrected_ssml)
    print("plain: ", parsed_ssml)
    print("lenght: ", len(parsed_ssml))

    total_speak_count = 0

    for voice_name, text in parsed_ssml:
        #     # Parse the XML document
        root = ET.fromstring(text)

    #     # Count all 'speak' elements
        speak_count = len(root.findall('.//speak'))

    #     # Add the count to the total
        total_speak_count += speak_count

    print("speak counts: ", total_speak_count)

    print("Parsed SSML: ")

    # # while parsed_ssml:
    # #     voice_name, text = parsed_ssml.popleft()
    # #     print(f"{voice_name}: {text}")

    for voice_name, text in parsed_ssml:
        print(f"{voice_name}: {text}")


if __name__ == "__main__":
    test_functions()
