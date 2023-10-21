"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSlidesPreview = exports.getAudioPreview = void 0;
const tslib_1 = require("tslib");
const _utils_1 = tslib_1.__importDefault(require("@utils"));
const PreviewService = tslib_1.__importStar(require("@services/PreviewService"));
const StorageException_1 = tslib_1.__importDefault(require("@/exceptions/StorageException"));
const ParameterException_1 = tslib_1.__importDefault(require("@/exceptions/ParameterException"));
const DatabaseException_1 = tslib_1.__importDefault(require("@/exceptions/DatabaseException"));
const ProjectService = tslib_1.__importStar(require("@services/ProjectService"));
const PreviewException_1 = tslib_1.__importDefault(require("@/exceptions/PreviewException"));
const stream_1 = require("stream");
const getAudioPreview = (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const text = req.body.text;
        if (!text || text.length === 0) {
            throw new ParameterException_1.default("No text for the preview provided.");
        }
        const result = yield PreviewService.elaborateAudioPreview(text);
        if (result.data instanceof stream_1.Readable) {
            result.data.once("error", () => {
                throw new PreviewException_1.default("Error while reading audio preview file.");
            });
            result.data.pipe(res);
        }
        else {
            throw new PreviewException_1.default("File not readable.");
        }
    }
    catch (error) {
        if (error instanceof PreviewException_1.default) {
            return res.status(502).send(_utils_1.default.getErrorMessage(error));
        }
        else if (error instanceof ParameterException_1.default) {
            return res.status(400).send(_utils_1.default.getErrorMessage(error));
        }
        return res.status(500).send(_utils_1.default.getErrorMessage(error));
    }
});
exports.getAudioPreview = getAudioPreview;
const getSlidesPreview = (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = res.locals.user;
        const projectName = req.params.projectName;
        if (!projectName || projectName.length === 0) {
            throw new ParameterException_1.default("No project name provided.");
        }
        if (!ProjectService.findProjectByProjectName(projectName, user)) {
            throw new DatabaseException_1.default("Project name does not correspond to any existing project.");
        }
        const result = yield PreviewService.elaborateSlidesPreview(user.email, projectName);
        if (result.data instanceof stream_1.Readable) {
            result.data.once("error", () => {
                throw new StorageException_1.default("Error while piping core elaboration");
            });
            result.data.pipe(res);
        }
        else {
            throw new StorageException_1.default("Can't read elaborated slides");
        }
    }
    catch (error) {
        if (error instanceof PreviewException_1.default) {
            return res.status(502).send(_utils_1.default.getErrorMessage(error));
        }
        else if (error instanceof ParameterException_1.default) {
            return res.status(400).send(_utils_1.default.getErrorMessage(error));
        }
        else if (error instanceof StorageException_1.default) {
            return res.status(502).send(_utils_1.default.getErrorMessage(error));
        }
        return res.status(500).send(_utils_1.default.getErrorMessage(error));
    }
});
exports.getSlidesPreview = getSlidesPreview;
