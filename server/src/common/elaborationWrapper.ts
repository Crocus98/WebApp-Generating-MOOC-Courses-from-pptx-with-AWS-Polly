import LambdaException from "@/exceptions/LambdaException";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { LogType } from "@aws-sdk/client-lambda";
import config from "@config";
import { Project } from "@prisma/client";
import storageWrapper from "@storage-wrapper";
import AwsS3Exception from "@/exceptions/AwsS3Exception";

class ElaborationWrapper {
  private static elaborationWrapper?: ElaborationWrapper;
  private lambdaClient: LambdaClient;

  constructor() {
    this.lambdaClient = new LambdaClient({
      region: config.AWS_CONFIG.S3_BUCKET_REGION,
    });
  }

  public async elaborateFile(project: Project, email: string) {
    try {
      const filename =
        storageWrapper.getFileNameFromStorageByUserEmailAndProjectForLambda(
          email,
          project.name
        );
      const funcName = "lambda_handler";
      const payload = {
        function_to_invoke: "process_pptx",
        param1: filename,
        param2: email,
      };

      const { logs, result } = await this.invoke(funcName, payload);
      const parsedResult = JSON.parse(result);
      if (parsedResult.statusCode !== 200) {
        throw new LambdaException("Lambda could not elaborate file.");
      }
    } catch (error) {
      if (error instanceof LambdaException) {
        throw new LambdaException(error.message);
      } else if (error instanceof AwsS3Exception) {
        throw new AwsS3Exception(error.message);
      }
      throw new LambdaException(
        "Unexpected error. Lambda could not elaborate file."
      );
    }
  }

  public async elaborateAudioPreview(text: string) {
    try {
      const funcName = "lambda_handler";
      const payload = {
        function_to_invoke: "process_preview",
        param1: text
      };

      const { logs, result } = await this.invoke(funcName, payload);
      const parsedResult = JSON.parse(result);
      if (parsedResult.statusCode !== 200) {
        throw new LambdaException("Lambda could not elaborate preview");
      }
      return parsedResult.body;
    } catch (error) {
      if (error instanceof LambdaException) {
        throw new LambdaException(error.message);
      }
      throw new LambdaException("Unexpected error. Lambda could not elaborate data to preview.");
    }
  }

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
  }

  static getInstance(): ElaborationWrapper {
    if (!this.elaborationWrapper)
      this.elaborationWrapper = new ElaborationWrapper();
    return this.elaborationWrapper;
  }
}

export default ElaborationWrapper.getInstance();
