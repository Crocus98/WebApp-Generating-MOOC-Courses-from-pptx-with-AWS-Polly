import xml.etree.ElementTree as ET
import re

def correct_special_characters(xml_text):
    escape_chars = {
        '&': '&amp;',
        '\'': '&apos;',
        '\"': '&quot;',
        '<': '&lt;',
        '>': '&gt;'
    }

    # Parse the XML document
    root = ET.fromstring(xml_text)

    # Walk through all elements in the document
    for element in root.iter():
        # If the element has a text content, replace the special characters
        if element.text:
            element.text = ''.join(escape_chars.get(c, c) for c in element.text)
        # Also check the tail text
        if element.tail:
            element.tail = ''.join(escape_chars.get(c, c) for c in element.tail)

    # Write the corrected document back to a string
    corrected_xml = ET.tostring(root, encoding='unicode')

    return corrected_xml

def validate_ssml(ssml_text, schema_path):
    # Load schema
    with open(schema_path, 'r') as schema_file:
        schema_root = etree.XML(schema_file.read())
        schema = etree.XMLSchema(schema_root)

    # Correct and parse SSML document
    ssml_text = correct_special_characters(ssml_text)
    ssml = etree.fromstring(ssml_text)

    # Validate SSML document against schema
    if not schema.validate(ssml):
        print('SSML validation failed')
        print(schema.error_log)
        return False

    # Additional validation
    text_tags = ['speak', 'p', 's']
    for tag in text_tags:
        for element in ssml.iter(tag):
            if not re.search('\S', element.text):
                print(f'Text validation failed for tag: {tag}')
                return False

    print('SSML validation passed')
    return True

def parse_ssml(ssml): # saves different actors and their lines in a dictionary and then removes the voice tags
    # Parse the SSML
    root = ET.fromstring(ssml)

    # Initialize the dictionary to store the voices and their texts
    voices = {}

    # Find all the voice tags
    for voice in root.findall('.//voice'):
        # Get the voice name
        voice_name = voice.get('voice_name')
        # Get the text inside the voice tag
        voice_text = "".join(voice.itertext())
        # If this voice is already in the dictionary, append the new text
        if voice_name in voices:
            voices[voice_name].append(voice_text)
        # Otherwise, initialize a new list with this text
        else:
            voices[voice_name] = [voice_text]
        # Remove the voice tag from the root element
        root.remove(voice)
    
    # After all voice tags are removed, we convert the XML back to string
    new_ssml = ET.tostring(root, encoding='unicode')

    return voices, new_ssml

# Test the function with an example SSML
ssml = '''
<speak>
    <voice voice_name="Matthew">
        Hello, my name is Matthew.
    </voice>
    <voice voice_name="Joanna">
        Hi, I am Joanna.
    </voice>
    <voice voice_name="Matthew">
        Nice to meet you, Joanna.
    </voice>
</speak>
'''

voices, new_ssml = parse_ssml(ssml)
for voice_name, texts in voices.items():
    print(f'Voice name: {voice_name}')
    for i, text in enumerate(texts):
        print(f'Text {i+1}: {text}')
        
print(f'\nNew SSML without voice tags:\n{new_ssml}')

