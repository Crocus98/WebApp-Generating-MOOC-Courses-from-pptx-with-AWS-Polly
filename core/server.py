from flask import Flask, request, jsonify
from manipulation2 import *
import os

ENVIROMENT = "DEV" # DEV, PROD
HOST = "0.0.0.0"
PORT = 5001

app = Flask(__name__)

@app.post('/process-pptx')
def process_pptx_request():
    data = request.get_json()

    print(data)

    if not all(key in data for key in ('email', 'projectName', 'filename')):
        return jsonify({"message": "Missing parameters"}), 400

    try:
        usermail = data['email']
        project = data['projectName']
        filename = data['filename']

        print(usermail, project, filename)

        result = process_pptx(usermail, project, filename)
        
        return jsonify({"message": result}), 200
    #except SomeLibrarySpecificError as e:  # replace with a specific exception type
        #return jsonify({"message": str(e)}), 400
    except Exception as e:
        print(f"An error occurred: {str(e)}")  # this should be replaced with proper logging
        return jsonify({"message": "Internal Server Error"}), 500


@app.post('/process-text')
def process_text_request():
    data = request.get_json()

    if 'text' not in data:
        return jsonify({"message": "Missing parameters"}), 400

    try:
        text = data['text']
        
        print(text)

        result = process_preview(text) 
        
        return jsonify({"message": result}), 200
    except SomeLibrarySpecificError as e:  # replace with a specific exception type
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        print(f"An error occurred: {str(e)}")  # this should be replaced with proper logging
        return jsonify({"message": "Internal Server Error"}), 500


@app.post('/process-slides')
def process_slides_request():
    data = request.get_json()

    if not all(key in data for key in ('email', 'projectName', 'filename')):
        return jsonify({"message": "Missing parameters"}), 400

    try:
        usermail = data['email']
        project = data['projectName']
        filename = data['filename']

        print(usermail, project, filename)

        result = process_pptx_split(usermail, project, filename)
        
        return jsonify({"message": result}), 200
    except SomeLibrarySpecificError as e: # replace with a specific exception type
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        print(f"An error occurred: {str(e)}") # this should be replaced with proper logging
        return jsonify({"message": "Internal Server Error"}), 500


    
if __name__ == "__main__":
    if ENVIROMENT == "PROD": 
        from waitress import serve
        serve(app, host=HOST, port=PORT)
    elif ENVIROMENT == "DEV":
        app.run(debug=True, host=HOST, port=PORT)
    else:
        raise Exception("Invalid Enviroment")