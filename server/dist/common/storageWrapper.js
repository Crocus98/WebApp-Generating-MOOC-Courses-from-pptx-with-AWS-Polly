"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const _config_1 = tslib_1.__importDefault(require("@config"));
const client_s3_1 = require("@aws-sdk/client-s3");
const AwsS3Exception_1 = tslib_1.__importDefault(require("@/exceptions/AwsS3Exception"));
class StorageWrapper {
    constructor() {
        if (!this.s3client) {
            this.s3client = new client_s3_1.S3Client({
                region: _config_1.default.AWS_CONFIG.S3_BUCKET_REGION,
                credentials: {
                    accessKeyId: _config_1.default.AWS_CONFIG.ACCESS_KEY_ID,
                    secretAccessKey: _config_1.default.AWS_CONFIG.SECRET_ACCESS_KEY,
                },
            });
        }
    }
    uploadFileToStorageAndDeleteOldOnes(file, projectName, email) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                yield this.deleteFilesFromStorageByUserEmailAndProjectName(email, projectName);
                yield this.uploadFileToStorage(file, email, projectName);
            }
            catch (error) {
                if (error instanceof AwsS3Exception_1.default) {
                    throw new AwsS3Exception_1.default(error.message);
                }
                throw new AwsS3Exception_1.default("Unexpected error. Could not upload file to S3");
            }
        });
    }
    uploadFileToStorage(file, email, projectName) {
        var _a;
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const command = new client_s3_1.PutObjectCommand({
                    Bucket: _config_1.default.AWS_CONFIG.S3_BUCKET_NAME,
                    Key: `${email}/${projectName}/${file.originalname}`,
                    Body: file.buffer,
                });
                const result = yield ((_a = this.s3client) === null || _a === void 0 ? void 0 : _a.send(command));
                if ((result === null || result === void 0 ? void 0 : result.$metadata.httpStatusCode) !== 200) {
                    throw new AwsS3Exception_1.default("Could not upload file to S3");
                }
            }
            catch (error) {
                if (error instanceof AwsS3Exception_1.default) {
                    throw new AwsS3Exception_1.default(error.message);
                }
                throw new AwsS3Exception_1.default("Unexpected error. Could not upload file to S3");
            }
        });
    }
    getFileNamesFromStorageByUserEmailAndProject(email, projectName) {
        var _a, _b;
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const prefix = projectName ? `${email}/${projectName}/` : `${email}/`;
                const listCommand = new client_s3_1.ListObjectsCommand({
                    Bucket: _config_1.default.AWS_CONFIG.S3_BUCKET_NAME,
                    Prefix: prefix,
                });
                const result = yield ((_a = this.s3client) === null || _a === void 0 ? void 0 : _a.send(listCommand));
                if ((result === null || result === void 0 ? void 0 : result.$metadata.httpStatusCode) !== 200) {
                    throw new AwsS3Exception_1.default("Could not get file names from S3.");
                }
                const objectKeys = (_b = result === null || result === void 0 ? void 0 : result.Contents) === null || _b === void 0 ? void 0 : _b.map((obj) => ({ Key: obj.Key }));
                return objectKeys;
            }
            catch (error) {
                if (error instanceof AwsS3Exception_1.default) {
                    throw new AwsS3Exception_1.default(error.message);
                }
                throw new AwsS3Exception_1.default("Unexpected error. Could not get file names from S3.");
            }
        });
    }
    getFileNameFromStorageByUserEmailAndProject(email, projectName) {
        var _a;
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const objectKeys = yield this.getFileNamesFromStorageByUserEmailAndProject(email, projectName);
                const fileName = (_a = objectKeys === null || objectKeys === void 0 ? void 0 : objectKeys.find((obj) => { var _a; return !((_a = obj.Key) === null || _a === void 0 ? void 0 : _a.includes("/edited/")); })) === null || _a === void 0 ? void 0 : _a.Key;
                if (!fileName) {
                    throw new AwsS3Exception_1.default("Could not get file name from S3.");
                }
                return fileName.substring(fileName.lastIndexOf("/") + 1);
            }
            catch (error) {
                if (error instanceof AwsS3Exception_1.default) {
                    throw new AwsS3Exception_1.default(error.message);
                }
                throw new AwsS3Exception_1.default("Unexpected error. Could not get file name from S3.");
            }
        });
    }
    deleteFilesFromStorageByUserEmailAndProjectName(email, projectName) {
        var _a;
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const objectKeys = yield this.getFileNamesFromStorageByUserEmailAndProject(email, projectName);
                if (!objectKeys || objectKeys.length === 0) {
                    return;
                }
                const command = new client_s3_1.DeleteObjectsCommand({
                    Bucket: _config_1.default.AWS_CONFIG.S3_BUCKET_NAME,
                    Delete: { Objects: objectKeys },
                });
                const result = yield ((_a = this.s3client) === null || _a === void 0 ? void 0 : _a.send(command));
                if ((result === null || result === void 0 ? void 0 : result.$metadata.httpStatusCode) !== 200) {
                    throw new AwsS3Exception_1.default("Could not delete files from storage");
                }
            }
            catch (error) {
                if (error instanceof AwsS3Exception_1.default) {
                    throw new AwsS3Exception_1.default(error.message);
                }
                throw new AwsS3Exception_1.default("Unexpected error. Could not delete files from storage");
            }
        });
    }
    getFileFromStorage(email, projectName, original = false) {
        var _a, _b, _c;
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const objectKeys = yield this.getFileNamesFromStorageByUserEmailAndProject(email, projectName);
                const fileName = original
                    ? (_a = objectKeys === null || objectKeys === void 0 ? void 0 : objectKeys.find((obj) => { var _a, _b; return !((_a = obj.Key) === null || _a === void 0 ? void 0 : _a.includes("/edited/")) && ((_b = obj.Key) === null || _b === void 0 ? void 0 : _b.includes(".zip")); })) === null || _a === void 0 ? void 0 : _a.Key
                    : (_b = objectKeys === null || objectKeys === void 0 ? void 0 : objectKeys.find((obj) => { var _a, _b; return ((_a = obj.Key) === null || _a === void 0 ? void 0 : _a.includes("/edited/")) && ((_b = obj.Key) === null || _b === void 0 ? void 0 : _b.includes(".zip")); })) === null || _b === void 0 ? void 0 : _b.Key;
                if (!fileName) {
                    throw new AwsS3Exception_1.default("The file is not present in S3.");
                }
                const getCommand = new client_s3_1.GetObjectCommand({
                    Bucket: _config_1.default.AWS_CONFIG.S3_BUCKET_NAME,
                    Key: fileName,
                });
                const result = yield ((_c = this.s3client) === null || _c === void 0 ? void 0 : _c.send(getCommand));
                if ((result === null || result === void 0 ? void 0 : result.$metadata.httpStatusCode) !== 200 || !result.Body) {
                    throw new AwsS3Exception_1.default("Could not get the specified file from S3. No file found.");
                }
                return result.Body;
            }
            catch (error) {
                if (error instanceof AwsS3Exception_1.default) {
                    throw new AwsS3Exception_1.default(error.message);
                }
                throw new AwsS3Exception_1.default("Unexpected error. Could not get file from S3");
            }
        });
    }
    static getInstance() {
        if (!this.storageWrapper)
            this.storageWrapper = new StorageWrapper();
        return this.storageWrapper;
    }
}
exports.default = StorageWrapper.getInstance();
