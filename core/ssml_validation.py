import xml.etree.ElementTree as ET
import re
import html
import os
from collections import deque
from lxml import etree
from dotenv import load_dotenv
from xml.etree.ElementTree import ParseError


load_dotenv()

schema_path = os.getenv('schema_path')


def correct_special_characters(ssml_text):
    escape_chars = {
        '&': '&amp;',
        # '\'': '&apos;',
        '\"': '&quot;',
        '<': '&lt;',
        '>': '&gt;'
    }

    try:
        ssml_text = ssml_text.lstrip()  # Remove leading white spaces
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
    except ParseError as e:
        print(f"Error parsing SSML text: {ssml_text}")
        raise e  # re-raise the error after logging


def validate_ssml(ssml_text, schema_path):
    # Load schema
    ssml_text = ssml_text.lstrip()  # Remove leading white spaces
    ssml_text = re.sub(r'\s+', ' ', ssml_text).strip()
    # print(f"Schema path: {schema_path}")
    # print(f"SSML text: {ssml_text}")
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
