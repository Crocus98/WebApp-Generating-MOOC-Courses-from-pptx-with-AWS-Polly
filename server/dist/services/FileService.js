"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFilesByProjectName = exports.elaborateFile = exports.downloadFileFromStorage = exports.uploadFileToStorage = void 0;
const tslib_1 = require("tslib");
const AwsS3Exception_1 = tslib_1.__importDefault(require("@/exceptions/AwsS3Exception"));
const StorageException_1 = tslib_1.__importDefault(require("@/exceptions/StorageException"));
const ElaborationException_1 = tslib_1.__importDefault(require("@/exceptions/ElaborationException"));
const _storage_wrapper_1 = tslib_1.__importDefault(require("@storage-wrapper"));
const _elaboration_wrapper_1 = tslib_1.__importDefault(require("@elaboration-wrapper"));
const MicroserviceException_1 = tslib_1.__importDefault(require("@/exceptions/MicroserviceException"));
const ParameterException_1 = tslib_1.__importDefault(require("@/exceptions/ParameterException"));
const uploadFileToStorage = (file, projectName, email) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        yield _storage_wrapper_1.default.uploadFileToStorageAndDeleteOldOnes(file, projectName, email);
    }
    catch (error) {
        if (error instanceof AwsS3Exception_1.default) {
            throw new StorageException_1.default(error.message);
        }
        throw new StorageException_1.default("Unexpected error. Could not upload file to storage");
    }
});
exports.uploadFileToStorage = uploadFileToStorage;
const downloadFileFromStorage = (email, projectName, original = false) => {
    try {
        const file = _storage_wrapper_1.default.getFileFromStorage(email, projectName, original);
        return file;
    }
    catch (error) {
        if (error instanceof AwsS3Exception_1.default) {
            throw new StorageException_1.default(error.message);
        }
        throw new StorageException_1.default("Unexpected error. Could not download file from storage");
    }
};
exports.downloadFileFromStorage = downloadFileFromStorage;
const elaborateFile = (project, email) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        yield _elaboration_wrapper_1.default.elaborateFile(project, email);
    }
    catch (error) {
        if (error instanceof AwsS3Exception_1.default) {
            throw new StorageException_1.default(error.message);
        }
        else if (error instanceof MicroserviceException_1.default) {
            throw new ElaborationException_1.default(error.message);
        }
        else if (error instanceof ParameterException_1.default) {
            throw new ParameterException_1.default(error.message);
        }
        throw new ElaborationException_1.default("Unexpected error. Could not elaborate file.");
    }
});
exports.elaborateFile = elaborateFile;
const deleteFilesByProjectName = (email, projectName) => {
    try {
        _storage_wrapper_1.default.deleteFilesFromStorageByUserEmailAndProjectName(email, projectName);
    }
    catch (error) {
        if (error instanceof AwsS3Exception_1.default) {
            throw new StorageException_1.default(error.message);
        }
        throw new StorageException_1.default("Unexpected error. Could not delete file.");
    }
};
exports.deleteFilesByProjectName = deleteFilesByProjectName;
