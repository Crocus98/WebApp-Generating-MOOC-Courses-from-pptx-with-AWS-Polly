"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elaborateFile = exports.downloadFileFromStorage = exports.uploadFileToStorage = void 0;
const tslib_1 = require("tslib");
const AwsS3Exception_1 = tslib_1.__importDefault(require("@/exceptions/AwsS3Exception"));
const StorageException_1 = tslib_1.__importDefault(require("@/exceptions/StorageException"));
const LambdaException_1 = tslib_1.__importDefault(require("@/exceptions/LambdaException"));
const ElaborationException_1 = tslib_1.__importDefault(require("@/exceptions/ElaborationException"));
const _storage_wrapper_1 = tslib_1.__importDefault(require("@storage-wrapper"));
const uploadFileToStorage = (file, email) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        yield _storage_wrapper_1.default.uploadFileToStorageAndDeleteOldOnes(file, email);
    }
    catch (error) {
        if (error instanceof AwsS3Exception_1.default) {
            throw new StorageException_1.default(error.message);
        }
        throw new StorageException_1.default("Unexpected error. Could not upload file to storage");
    }
});
exports.uploadFileToStorage = uploadFileToStorage;
const downloadFileFromStorage = (email, original = false) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const file = yield _storage_wrapper_1.default.getFileFromStorage(email, original);
        return file;
    }
    catch (error) {
        if (error instanceof AwsS3Exception_1.default) {
            throw new StorageException_1.default(error.message);
        }
        throw new StorageException_1.default("Unexpected error. Could not download file from storage");
    }
});
exports.downloadFileFromStorage = downloadFileFromStorage;
const elaborateFile = (email) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
    }
    catch (error) {
        if (error instanceof AwsS3Exception_1.default) {
            throw new StorageException_1.default(error.message);
        }
        else if (error instanceof LambdaException_1.default) {
            throw new ElaborationException_1.default(error.message);
        }
        throw new ElaborationException_1.default("Unexpected error. Could not elaborate file.");
    }
});
exports.elaborateFile = elaborateFile;
