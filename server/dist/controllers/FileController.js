"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elaborateFile = exports.downloadFile = exports.uploadFile = void 0;
const tslib_1 = require("tslib");
const _utils_1 = tslib_1.__importDefault(require("@utils"));
const FileService = tslib_1.__importStar(require("@services/FileService"));
const FileException_1 = tslib_1.__importDefault(require("@/exceptions/FileException"));
const StorageException_1 = tslib_1.__importDefault(require("@/exceptions/StorageException"));
const ElaborationException_1 = tslib_1.__importDefault(require("@/exceptions/ElaborationException"));
const ParameterException_1 = tslib_1.__importDefault(require("@/exceptions/ParameterException"));
const DatabaseException_1 = tslib_1.__importDefault(require("@/exceptions/DatabaseException"));
const ProjectService = tslib_1.__importStar(require("@services/ProjectService"));
const stream_1 = require("stream");
const NotFoundException_1 = tslib_1.__importDefault(require("@/exceptions/NotFoundException"));
const uploadFile = (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const file = req.file;
        const projectName = req.body.projectName;
        const user = res.locals.user;
        if (!projectName) {
            throw new ParameterException_1.default("No project name provided.");
        }
        if (!file) {
            throw new FileException_1.default("No file uploaded.");
        }
        if (!file.originalname.endsWith(".zip")) {
            throw new FileException_1.default("File must be a PowerPoint zipped (.zip) file.");
        }
        if (!(yield ProjectService.findProjectByProjectName(projectName, user))) {
            throw new ParameterException_1.default("Project name not valid.");
        }
        yield FileService.uploadFileToStorage(file, projectName, user.email);
        return res.status(200).send(`File ${file.originalname} uploaded to S3.`);
    }
    catch (error) {
        if (error instanceof FileException_1.default) {
            return res.status(400).send(_utils_1.default.getErrorMessage(error));
        }
        else if (error instanceof StorageException_1.default) {
            return res.status(502).send(_utils_1.default.getErrorMessage(error));
        }
        else if (error instanceof DatabaseException_1.default) {
            return res.status(500).send(_utils_1.default.getErrorMessage(error));
        }
        else if (error instanceof ParameterException_1.default) {
            return res.status(400).send(_utils_1.default.getErrorMessage(error));
        }
        return res.status(500).send(_utils_1.default.getErrorMessage(error));
    }
});
exports.uploadFile = uploadFile;
const downloadFile = (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = res.locals.user;
        const parameter = req.query.original;
        const projectName = req.params.projectName;
        if (!projectName) {
            throw new ParameterException_1.default("No project name provided.");
        }
        if (!(yield ProjectService.findProjectByProjectName(projectName, user))) {
            throw new NotFoundException_1.default("Project name not valid.");
        }
        let original = false;
        if (parameter && parameter === "true") {
            original = true;
        }
        const file = yield FileService.downloadFileFromStorage(user.email, projectName, original);
        if (file instanceof stream_1.Readable) {
            file.once("error", () => {
                throw new StorageException_1.default("Error while reading file.");
            });
            file.pipe(res);
        }
        else {
            throw new StorageException_1.default("File not readable.");
        }
    }
    catch (error) {
        console.log(error);
        if (error instanceof StorageException_1.default) {
            return res.status(502).send(_utils_1.default.getErrorMessage(error));
        }
        else if (error instanceof ParameterException_1.default) {
            return res.status(400).send(_utils_1.default.getErrorMessage(error));
        }
        else if (error instanceof DatabaseException_1.default) {
            return res.status(500).send(_utils_1.default.getErrorMessage(error));
        }
        else if (error instanceof NotFoundException_1.default) {
            return res.status(404).send(_utils_1.default.getErrorMessage(error));
        }
        return res.status(500).send(_utils_1.default.getErrorMessage(error));
    }
});
exports.downloadFile = downloadFile;
const elaborateFile = (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = res.locals.user;
        const projectName = req.body.projectName;
        if (!projectName) {
            throw new ParameterException_1.default("No project name provided.");
        }
        const project = yield ProjectService.findProjectByProjectName(projectName, user);
        if (!project) {
            throw new ParameterException_1.default("Project name not valid.");
        }
        yield FileService.elaborateFile(project, user.email);
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
        else if (error instanceof ParameterException_1.default) {
            return res.status(400).send(_utils_1.default.getErrorMessage(error));
        }
        return res.status(500).send(_utils_1.default.getErrorMessage(error));
    }
});
exports.elaborateFile = elaborateFile;
