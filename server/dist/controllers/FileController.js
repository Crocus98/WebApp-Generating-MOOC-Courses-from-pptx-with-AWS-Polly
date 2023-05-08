"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elaborateFile = exports.downloadFile = exports.uploadFile = void 0;
const tslib_1 = require("tslib");
const _utils_1 = tslib_1.__importDefault(require("@utils"));
const FileService = tslib_1.__importStar(require("@services/FileService"));
const FileException_1 = tslib_1.__importDefault(require("@/exceptions/FileException"));
const StorageException_1 = tslib_1.__importDefault(require("@/exceptions/StorageException"));
const ElaborationException_1 = tslib_1.__importDefault(require("@/exceptions/ElaborationException"));
const uploadFile = (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const file = req.file;
        const user = res.locals.user;
        if (!file) {
            throw new FileException_1.default('No file uploaded.');
        }
        if (!file.originalname.endsWith('.pptx')) {
            throw new FileException_1.default('File must be a PowerPoint (.pptx) file.');
        }
        yield FileService.uploadFileToStorage(file, user.email);
        return res.status(200).send(`File ${file.originalname} uploaded to S3.`);
    }
    catch (error) {
        if (error instanceof FileException_1.default) {
            return res.status(400).send(_utils_1.default.getErrorMessage(error));
        }
        else if (error instanceof StorageException_1.default) {
            return res.status(502).send(_utils_1.default.getErrorMessage(error));
        }
        return res.status(500).send(_utils_1.default.getErrorMessage(error));
    }
});
exports.uploadFile = uploadFile;
const downloadFile = (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = res.locals.user;
        const parameter = req.query.original;
        let original = false;
        if (parameter && parameter === 'true') {
            original = true;
        }
        const file = yield FileService.downloadFileFromStorage(user.email, original);
        return res.status(200).send(file);
    }
    catch (error) {
        if (error instanceof StorageException_1.default) {
            return res.status(502).send(_utils_1.default.getErrorMessage(error));
        }
        return res.status(500).send(_utils_1.default.getErrorMessage(error));
    }
});
exports.downloadFile = downloadFile;
const elaborateFile = (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = res.locals.user;
        yield FileService.elaborateFile(user.email);
        return res.status(200).send("File elaboration performed successfully");
    }
    catch (error) {
        if (error instanceof FileException_1.default) {
            return res.status(400).send(_utils_1.default.getErrorMessage(error));
        }
        else if (error instanceof StorageException_1.default) {
            return res.status(502).send(_utils_1.default.getErrorMessage(error));
        }
        else if (error instanceof ElaborationException_1.default) {
            return res.status(502).send(_utils_1.default.getErrorMessage(error));
        }
        return res.status(500).send(_utils_1.default.getErrorMessage(error));
    }
});
exports.elaborateFile = elaborateFile;
