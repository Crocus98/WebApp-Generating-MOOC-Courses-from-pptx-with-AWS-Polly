import LambdaException from "@/exceptions/LambdaException";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { LogType } from "@aws-sdk/client-lambda";
import config from "@config";
import { Project } from "aws-sdk/clients/kendra";

class ElaborationWrapper {
    private static elaborationWrapper?: ElaborationWrapper;
    private lambdaClient: LambdaClient;

    constructor() {
        this.lambdaClient = new LambdaClient({ region: config.AWS_CONFIG.S3_BUCKET_REGION });
    }

    async elaborateFile(project: Project, email: string) {
        try {
            
            const funcName = "lambda_handler";  // replace with your actual Lambda function name
            const payload = {
                function_to_invoke: "process_pptx",  // replace with the function you want to invoke
                param1: project,  // replace with the actual value
                param2: email,  // replace with the actual value
            };
    
            const { logs, result } = await this.invoke(funcName, payload);
            const resultObj = JSON.parse(result);
            if (resultObj.statusCode !== 200) {
                throw new LambdaException(`Lambda could not elaborate file.`);
            }
        } catch (error) {
            if (error instanceof LambdaException) {
                throw new LambdaException(error.message);
            }
            throw new LambdaException("Unexpected error. Lambda could not elaborate file.");
        }
    }

    public async invoke (funcName:string, payload:string): Promise<{logs: string, result: string }>{
        const encoder = new TextEncoder();
        const command = new InvokeCommand({
          FunctionName: funcName,
          Payload: encoder.encode(JSON.stringify(payload)),,
          LogType: LogType.Tail,
        });

        const { Payload, LogResult } = await this.lambdaClient.send(command);
        const decoder = new TextDecoder();
        const result = decoder.decode(Payload);
        const logs = LogResult ? Buffer.from(LogResult, "base64").toString() : '';
        return { logs, result };
    };


    static getInstance(): ElaborationWrapper {
        if (!this.elaborationWrapper) this.elaborationWrapper = new ElaborationWrapper();
        return this.elaborationWrapper;
    }
}

export default ElaborationWrapper.getInstance();