from flask import Flask, request
from manipulation2 import *
import os

ENVIROMENT = "PROD" # DEV, PROD
HOST = "0.0.0.0"
PORT = 5001

app = Flask(__name__)

@app.get('/process-pptx')
def processPPTX():
    usermail = request.args.get('user')
    project = request.args.get('project')
    filename = request.args.get('filename')

    print(usermail, project, filename)

    result = process_pptx(usermail, project, filename) 

    response = app.response_class(
        response=json.dumps({"message": result}),
        status=200,
        mimetype='application/json'
    )
    return response

    
if __name__ == "__main__":
    if ENVIROMENT == "PROD": 
        from waitress import serve
        serve(app, host=HOST, port=PORT)
    elif ENVIROMENT == "DEV":
        app.run(debug=True, host=HOST, port=PORT)
    else:
        raise Exception("Invalid Enviroment")