"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const MicroserviceException_1 = tslib_1.__importDefault(require("@/exceptions/MicroserviceException"));
const _config_1 = tslib_1.__importDefault(require("@config"));
const _storage_wrapper_1 = tslib_1.__importDefault(require("@storage-wrapper"));
const AwsS3Exception_1 = tslib_1.__importDefault(require("@/exceptions/AwsS3Exception"));
const ParameterException_1 = tslib_1.__importDefault(require("@/exceptions/ParameterException"));
const axios_1 = tslib_1.__importStar(require("axios"));
class ElaborationWrapper {
    constructor() {
        console.log("MICROSERVICE HOST: " +
            _config_1.default.MICROSERVICE_CONFIG.MICROSERVICE_HOST +
            ":" +
            _config_1.default.MICROSERVICE_CONFIG.MICROSERVICE_PORT);
        this.axiosInstance = axios_1.default.create({
            baseURL: "http://" + _config_1.default.MICROSERVICE_CONFIG.MICROSERVICE_HOST + ":" + _config_1.default.MICROSERVICE_CONFIG.MICROSERVICE_PORT,
        });
    }
    elaborateFile(project, email) {
        var _a, _b, _c;
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const filename = yield _storage_wrapper_1.default.getFileNameFromStorageByUserEmailAndProject(email, project.name);
                yield this.axiosInstance.post("/process-pptx", {
                    email: email,
                    projectName: project.name,
                    filename: filename,
                });
            }
            catch (error) {
                if (error instanceof axios_1.AxiosError) {
                    if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) == 400) {
                        throw new ParameterException_1.default((_b = error.response) === null || _b === void 0 ? void 0 : _b.data.message);
                    }
                    throw new MicroserviceException_1.default((_c = error.response) === null || _c === void 0 ? void 0 : _c.data.message);
                }
                else if (error instanceof AwsS3Exception_1.default) {
                    throw new AwsS3Exception_1.default(error.message);
                }
                else {
                    throw new MicroserviceException_1.default("Unexpected error. Microservice could not elaborate file.");
                }
            }
        });
    }
    elaborateAudioPreview(text) {
        var _a, _b;
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.axiosInstance.post("/process-text", { text: text }, { responseType: "stream" });
            }
            catch (error) {
                if (error instanceof axios_1.AxiosError) {
                    let message = yield this.decodeBuffer((_a = error.response) === null || _a === void 0 ? void 0 : _a.data);
                    let errorMessage = JSON.parse(message);
                    if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) == 400) {
                        throw new ParameterException_1.default(errorMessage.message);
                    }
                    throw new MicroserviceException_1.default(errorMessage.message);
                }
                else {
                    throw new MicroserviceException_1.default("Unexpected error. Microservice could not elaborate text to preview.");
                }
            }
        });
    }
    decodeBuffer(data) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let streamString = "";
                data.setEncoding("utf8");
                data.on("data", (utf8Chunk) => {
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
        });
    }
    elaborateSlidesPreview(email, projectName) {
        var _a, _b;
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const filename = yield _storage_wrapper_1.default.getFileNameFromStorageByUserEmailAndProject(email, projectName);
                return yield this.axiosInstance.post("/process-slides", {
                    email: email,
                    projectName: projectName,
                    filename: filename,
                }, { responseType: "stream" });
            }
            catch (error) {
                if (error instanceof axios_1.AxiosError) {
                    let message = yield this.decodeBuffer((_a = error.response) === null || _a === void 0 ? void 0 : _a.data);
                    let errorMessage = JSON.parse(message);
                    if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) == 400) {
                        throw new ParameterException_1.default(errorMessage.message);
                    }
                    throw new MicroserviceException_1.default(errorMessage.message);
                }
                else if (error instanceof AwsS3Exception_1.default) {
                    throw new AwsS3Exception_1.default(error.message);
                }
                else {
                    throw new MicroserviceException_1.default("Unexpected error. Microservice could not elaborate file.");
                }
            }
        });
    }
    static getInstance() {
        if (!this.elaborationWrapper)
            this.elaborationWrapper = new ElaborationWrapper();
        return this.elaborationWrapper;
    }
}
exports.default = ElaborationWrapper.getInstance();
