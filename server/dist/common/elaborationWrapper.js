"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const LambdaException_1 = tslib_1.__importDefault(require("@/exceptions/LambdaException"));
const client_lambda_1 = require("@aws-sdk/client-lambda");
const client_lambda_2 = require("@aws-sdk/client-lambda");
const _config_1 = tslib_1.__importDefault(require("@config"));
const _storage_wrapper_1 = tslib_1.__importDefault(require("@storage-wrapper"));
const AwsS3Exception_1 = tslib_1.__importDefault(require("@/exceptions/AwsS3Exception"));
class ElaborationWrapper {
    constructor() {
        this.lambdaClient = new client_lambda_1.LambdaClient({
            region: _config_1.default.AWS_CONFIG.S3_BUCKET_REGION,
        });
    }

    elaborateFile(project, email) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const filename = _storage_wrapper_1.default.getFileNameFromStorageByUserEmailAndProjectForLambda(email, project.name);
                const funcName = "lambda_handler";
                const payload = {
                    function_to_invoke: "process_pptx",
                    param1: filename,
                    param2: email,
                };
                const { logs, result } = yield this.invoke(funcName, payload);
                const parsedResult = JSON.parse(result);
                if (parsedResult.statusCode !== 200) {
                    throw new LambdaException_1.default("Lambda could not elaborate file.");
                }
            }
            catch (error) {
                if (error instanceof LambdaException_1.default) {
                    throw new LambdaException_1.default(error.message);
                }
                else if (error instanceof AwsS3Exception_1.default) {
                    throw new AwsS3Exception_1.default(error.message);
                }
                throw new LambdaException_1.default("Unexpected error. Lambda could not elaborate file.");
            }
        });
    }

    invoke(funcName, payload) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const encoder = new TextEncoder();
            const command = new client_lambda_1.InvokeCommand({
                FunctionName: funcName,
                Payload: encoder.encode(JSON.stringify(payload)),
                LogType: client_lambda_2.LogType.Tail,
            });
            const { Payload, LogResult } = yield this.lambdaClient.send(command);
            const decoder = new TextDecoder();
            const result = decoder.decode(Payload);
            const logs = LogResult ? Buffer.from(LogResult, "base64").toString() : "";
            return { logs, result };
        });
    }

    static getInstance() {
        if (!this.elaborationWrapper)
            this.elaborationWrapper = new ElaborationWrapper();
        return this.elaborationWrapper;
    }
}
exports.default = ElaborationWrapper.getInstance();
