import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { LogType } from "@aws-sdk/client-lambda";
import config from "@config";

class ElaborationWrapper {
    private static elaborationWrapper?: ElaborationWrapper;
    private lambdaClient: LambdaClient;

    constructor() {
        this.lambdaClient = new LambdaClient({ region: config.AWS_CONFIG.S3_BUCKET_REGION });
    }

    async elaborateFile(email: string) {
        // TODO
    }

    public async invoke(funcName: string, payload: string): Promise<{ logs: string, result: string }> {
        const encoder = new TextEncoder();
        const command = new InvokeCommand({
            FunctionName: funcName,
            Payload: encoder.encode(JSON.stringify(payload)),
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