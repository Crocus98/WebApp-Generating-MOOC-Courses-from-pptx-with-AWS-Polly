from flask import Flask, request, jsonify
from dotenv import load_dotenv
from manipulation import *
from flask import Response
from exceptions import *
import os

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
        # print(f"An error occurred: {str(e)}")
        return jsonify({"message": f"Error: {str(e)}"}), 500
    except AmazonException as e:
        # print(f"An error occurred: {str(e)}")
        return jsonify({"message": f"Error: {str(e)}"}), 502
    except Exception as e:
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
        byte_io = io.BytesIO()
        result.export(byte_io, format="mp3")
        byte_io.seek(0)
        return Response(byte_io, content_type="audio/mp3"), 200
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
        return jsonify({"message": f"Error: {str(e)}"}), 500


@app.post('/process-slides')
def process_slides_request():
    data = request.get_json()

    if not all(key in data for key in ('email', 'projectName', 'filename')):
        return jsonify({"message": "Missing parameters"}), 400

    try:
        usermail = data['email']
        project = data['projectName']
        filename = data['filename']
        result = process_pptx_split(usermail, project, filename)
        return jsonify({"message": result}), 200
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
        return jsonify({"message": f"Error: {str(e)}"}), 500


if __name__ == "__main__":
    if ENVIRONMENT == "PROD":
        from waitress import serve
        serve(app, host=HOST, port=PORT)
    elif ENVIRONMENT == "DEV":
        app.run(debug=True, host=HOST, port=PORT)
    else:
        raise Exception("Invalid Enviroment")
