"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const MicroserviceException_1 = tslib_1.__importDefault(require("@/exceptions/MicroserviceException"));
const _config_1 = tslib_1.__importDefault(require("@config"));
const _storage_wrapper_1 = tslib_1.__importDefault(require("@storage-wrapper"));
const AwsS3Exception_1 = tslib_1.__importDefault(require("@/exceptions/AwsS3Exception"));
const axios_1 = tslib_1.__importDefault(require("axios"));
class ElaborationWrapper {
    constructor() {
        this.axiosInstance = axios_1.default.create({
            baseURL: "https://" + _config_1.default.MICROSERVICE_CONFIG.MICROSERVICE_HOST + ":" + _config_1.default.MICROSERVICE_CONFIG.MICROSERVICE_PORT
        });
    }
    elaborateFile(project, email) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const filename = yield _storage_wrapper_1.default.getFileNameFromStorageByUserEmailAndProjectForLambda(email, project.name);
                const result = yield this.axiosInstance.post("/process-pptx", {
                    email: email,
                    projectName: project.name,
                    filename: filename,
                });
                if (result.status !== 200) {
                    throw new MicroserviceException_1.default(result.data);
                }
            }
            catch (error) {
                if (error instanceof MicroserviceException_1.default) {
                    throw new MicroserviceException_1.default(error.message);
                }
                else if (error instanceof AwsS3Exception_1.default) {
                    throw new AwsS3Exception_1.default(error.message);
                }
                throw new MicroserviceException_1.default("Unexpected error. Microservice could not elaborate file.");
            }
        });
    }
    elaborateAudioPreview(text) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.axiosInstance.post("/process-text", {
                    text: text
                });
                if (result.status !== 200) {
                    throw new MicroserviceException_1.default(result.data);
                }
                return result.data;
            }
            catch (error) {
                if (error instanceof MicroserviceException_1.default) {
                    throw new MicroserviceException_1.default(error.message);
                }
                throw new MicroserviceException_1.default("Unexpected error. Microservice could not elaborate text to preview.");
            }
        });
    }
    elaborateSlidesPreview(email, projectName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const filename = yield _storage_wrapper_1.default.getFileNameFromStorageByUserEmailAndProjectForLambda(email, projectName);
                const result = yield this.axiosInstance.post("/process-slides", {
                    email: email,
                    projectName: projectName,
                    filename: filename
                });
                if (result.status !== 200) {
                    throw new MicroserviceException_1.default(result.data);
                }
                return result.data;
            }
            catch (error) {
                if (error instanceof MicroserviceException_1.default) {
                    throw new MicroserviceException_1.default(error.message);
                }
                throw new MicroserviceException_1.default("Unexpected error. Microservice could not elaborate slides to preview.");
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
