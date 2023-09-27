from flask import Flask, request, jsonify, send_file
from dotenv import load_dotenv
from manipulation import *
from flask import Response
from exceptions import *
from zipfile import ZipFile
import io
import os
import json


load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT")
HOST = os.getenv("HOST")
PORT = os.getenv("PORT")

app = Flask(__name__)


@app.post('/process-pptx')
def process_pptx_request():
    data = request.get_json()

    if not all(key in data for key in ('email', 'projectName', 'filename')):
        return jsonify({"message": "Missing parameters"}), 400

    try:
        usermail = data['email']
        project = data['projectName']
        filename = data['filename']
        result = process_pptx(usermail, project, filename)
        return jsonify({"message": result}), 200
    except UserParameterException as e:
        # print(f"An error occurred: {str(e)}")
        return jsonify({"message": f"Error: {str(e)}"}), 400
    except ElaborationException as e:
        print(e)
        # print(f"An error occurred: {str(e)}")
        return jsonify({"message": f"Error: {str(e)}"}), 500
    except AmazonException as e:
        # print(f"An error occurred: {str(e)}")
        return jsonify({"message": f"Error: {str(e)}"}), 502
    except Exception as e:
        print(e)
        # print(f"An error occurred: {str(e)}")
        return jsonify({"message": f"Error: {str(e)}"}), 500


@app.post('/process-text')
def process_text_request():
    data = request.get_json()

    if 'text' not in data:
        return jsonify({"message": "Missing parameters"}), 400

    try:
        text = data['text']
        result = process_preview(text)
        return send_file(result, download_name="preview.mp3", as_attachment=True), 200
    except UserParameterException as e:
        # print(f"An error occurred: {str(e)}")
        return jsonify({"message": f"Error: {str(e)}"}), 400
    except ElaborationException as e:
        # print(f"An error occurred: {str(e)}")
        return jsonify({"message": f"Error: {str(e)}"}), 500
    except AmazonException as e:
        # print(f"An error occurred: {str(e)}")
        return jsonify({"message": f"Error: {str(e)}"}), 502
    except Exception as e:
        # print(f"An error occurred: {str(e)}")
        traceback.print_exc()
        return jsonify({"message": f"Error: {str(e)}"}), 500


@app.post('/process-slides')
def process_slides_request():
    data = request.get_json()

    if not all(key in data for key in ('email', 'projectName', 'filename')):
        return jsonify({"message": "Missing parameters"}), 400

    #print(data["filename"])

    try:
        usermail = data['email']
        project = data['projectName']
        filename = data['filename']
        
        '''
        stream = io.BytesIO()
        with ZipFile(stream, 'w') as zip:
            result = process_pptx_split(usermail, project, filename)
            zip.writestr('preview.json', json.dumps(result))
        stream.seek(0)
        return send_file(stream, download_name="preview.zip", as_attachment=True), 200
        '''
        result = process_pptx_split(usermail, project, filename)
        return send_file(result, download_name="archive.zip", as_attachment=True), 200
    except UserParameterException as e:
        # print(f"An error occurred: {str(e)}")
        return jsonify({"message": f"Error: {str(e)}"}), 400
    except ElaborationException as e:
        # print(f"An error occurred: {str(e)}")
        return jsonify({"message": f"Error: {str(e)}"}), 500
    except AmazonException as e:
        # print(f"An error occurred: {str(e)}")
        return jsonify({"message": f"Error: {str(e)}"}), 502
    except Exception as e:
        traceback.print_exc()
        # print(f"An error occurred: {str(e)}")
        return jsonify({"message": f"Error: {str(e)}"}), 500


if __name__ == "__main__":
    if ENVIRONMENT == "PROD":
        from waitress import serve
        serve(app, host=HOST, port=PORT)
    elif ENVIRONMENT == "DEV":
        app.run(debug=True, host=HOST, port=PORT)
    else:
        raise Exception("Invalid Enviroment")
