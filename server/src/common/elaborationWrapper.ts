//import LambdaException from "@/exceptions/LambdaException"; LAMBDA DISMISSED IN FAVOR OF MICROSERVICE
import MicroserviceException from "@/exceptions/MicroserviceException";
//import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda"; LAMBDA DISMISSED IN FAVOR OF MICROSERVICE
//import { LogType } from "@aws-sdk/client-lambda"; LAMBDA DISMISSED IN FAVOR OF MICROSERVICE
import config from "@config";
import { Project } from "@prisma/client";
import storageWrapper from "@storage-wrapper";
import AwsS3Exception from "@/exceptions/AwsS3Exception";
import ParameterException from "@/exceptions/ParameterException";
import axios, { Axios, AxiosError, AxiosInstance } from "axios";
import { error } from "console";

class ElaborationWrapper {
  private static elaborationWrapper?: ElaborationWrapper;
  //private lambdaClient: LambdaClient; LAMBDA DISMISSED IN FAVOR OF MICROSERVICE
  private axiosInstance: AxiosInstance;

  constructor() {
    /* LAMBDA DISMISSED IN FAVOR OF MICROSERVICE
    this.lambdaClient = new LambdaClient({
      region: config.AWS_CONFIG.S3_BUCKET_REGION,
    });
    */
    console.log(
      "MICROSERVICE HOST: " +
        config.MICROSERVICE_CONFIG.MICROSERVICE_HOST +
        ":" +
        config.MICROSERVICE_CONFIG.MICROSERVICE_PORT
    );
    this.axiosInstance = axios.create({
      baseURL:
        "http://" + config.MICROSERVICE_CONFIG.MICROSERVICE_HOST + ":" + config.MICROSERVICE_CONFIG.MICROSERVICE_PORT,
    });
  }

  public async elaborateFile(project: Project, email: string) {
    try {
      const filename = await storageWrapper.getFileNameFromStorageByUserEmailAndProject(email, project.name);

      /* LAMBDA DISMISSED IN FAVOR OF MICROSERVICE
      const funcName = "lambda_handler";
      const payload = {
        usermail: email,
        project: project.name,
        filename: filename,
        function_to_invoke: "process_pptx",
      };
      const { logs, result } = await this.invoke(funcName, payload);
      const parsedResult = JSON.parse(result);
      if (parsedResult.statusCode !== 200) {
        throw new LambdaException("Lambda could not elaborate file.");
      }
      */
      await this.axiosInstance.post("/process-pptx", {
        email: email,
        projectName: project.name,
        filename: filename,
      });
      //.catch((error) => {});
      /* 
      if (result.status !== 200) {
        throw new MicroserviceException(result.data);
      }
      */
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status == 400) {
          throw new ParameterException(error.response?.data.message);
        }
        throw new MicroserviceException(error.response?.data.message);
      } else if (error instanceof AwsS3Exception) {
        throw new AwsS3Exception(error.message);
      } else {
        throw new MicroserviceException("Unexpected error. Microservice could not elaborate file.");
      }
    }
  }

  public async elaborateAudioPreview(text: string) {
    try {
      /*LAMBDA DISMISSED IN FAVOR OF MICROSERVICE
      const funcName = "lambda_handler";
      const payload = {
        text: text,
        function_to_invoke: "process_audio",
      };

      const { logs, result } = await this.invoke(funcName, payload);
      const parsedResult = JSON.parse(result);
      if (parsedResult.statusCode !== 200) {
        throw new LambdaException("Microservice could not elaborate text to preview");
      }
      return parsedResult.body;
      */

      return await this.axiosInstance.post("/process-text", { text: text }, { responseType: "stream" });
      /*.catch((error) => {
          
        });*/

      /*if (result.status !== 200) {
        throw new MicroserviceException(result.data);
      }
      return result.data;*/
    } catch (error) {
      if (error instanceof AxiosError) {
        let message = await this.decodeBuffer(error.response?.data);
        let errorMessage = JSON.parse(message);
        if (error.response?.status == 400) {
          throw new ParameterException(errorMessage.message);
        }
        throw new MicroserviceException(errorMessage.message);
      } else {
        throw new MicroserviceException("Unexpected error. Microservice could not elaborate text to preview.");
      }
    }
  }

  public async decodeBuffer(data: any) {
    return new Promise<string>((resolve, reject) => {
      let streamString = "";
      data.setEncoding("utf8");
      data.on("data", (utf8Chunk: string) => {
        streamString += utf8Chunk;
      });
      let errorMessage;
      data.on("end", () => {
        errorMessage = streamString;
        resolve(errorMessage);
      });
      data.on("error", () => {
        reject("Impossible parse stream containing error message from python server.");
      });
    });
  }

  public async elaborateSlidesPreview(email: string, projectName: string) {
    try {
      const filename = await storageWrapper.getFileNameFromStorageByUserEmailAndProject(email, projectName);
      return await this.axiosInstance.post(
        "/process-slides",
        {
          email: email,
          projectName: projectName,
          filename: filename,
        },
        { responseType: "stream" }
      );
    } catch (error) {
      if (error instanceof AxiosError) {
        let message = await this.decodeBuffer(error.response?.data);
        let errorMessage = JSON.parse(message);
        if (error.response?.status == 400) {
          throw new ParameterException(errorMessage.message);
        }
        throw new MicroserviceException(errorMessage.message);
      } else if (error instanceof AwsS3Exception) {
        throw new AwsS3Exception(error.message);
      } else {
        throw new MicroserviceException("Unexpected error. Microservice could not elaborate file.");
      }
    }
  }

  /* Used to invoke Lambda functions -- DISMISSED IN FAVOR OF MICROSERVICE
  public async invoke(
    funcName: string,
    payload: object
  ): Promise<{ logs: string; result: string }> {
    const encoder = new TextEncoder();
    const command = new InvokeCommand({
      FunctionName: funcName,
      Payload: encoder.encode(JSON.stringify(payload)),
      LogType: LogType.Tail,
    });

    const { Payload, LogResult } = await this.lambdaClient.send(command);
    const decoder = new TextDecoder();
    const result = decoder.decode(Payload);
    const logs = LogResult ? Buffer.from(LogResult, "base64").toString() : "";
    return { logs, result };
  }*/

  static getInstance(): ElaborationWrapper {
    if (!this.elaborationWrapper) this.elaborationWrapper = new ElaborationWrapper();
    return this.elaborationWrapper;
  }
}

export default ElaborationWrapper.getInstance();
