"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.createProject = exports.listProjects = void 0;
const tslib_1 = require("tslib");
const ProjectService = tslib_1.__importStar(require("@services/ProjectService"));
const FileService = tslib_1.__importStar(require("@services/FileService"));
const _utils_1 = tslib_1.__importDefault(require("@utils"));
const DatabaseException_1 = tslib_1.__importDefault(require("@/exceptions/DatabaseException"));
const ParameterException_1 = tslib_1.__importDefault(require("@/exceptions/ParameterException"));
const StorageException_1 = tslib_1.__importDefault(require("@/exceptions/StorageException"));
const listProjects = (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = res.locals.user;
        const projectsNames = yield ProjectService.findProjectsNamesByUser(user);
        return res.status(200).send(projectsNames);
    }
    catch (error) {
        if (error instanceof DatabaseException_1.default) {
            return res.status(500).send(_utils_1.default.getErrorMessage(error));
        }
        return res.status(500).send(_utils_1.default.getErrorMessage(error));
    }
});
exports.listProjects = listProjects;
const createProject = (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = res.locals.user;
        const projectName = req.body.projectName;
        if (!projectName) {
            throw new ParameterException_1.default("No project name provided.");
        }
        const project = yield ProjectService.createProject(projectName, user);
        return res.status(200).send(project);
    }
    catch (error) {
        if (error instanceof DatabaseException_1.default) {
            return res.status(500).send(_utils_1.default.getErrorMessage(error));
        }
        else if (error instanceof ParameterException_1.default) {
            return res.status(400).send(_utils_1.default.getErrorMessage(error));
        }
        return res.status(500).send(_utils_1.default.getErrorMessage(error));
    }
});
exports.createProject = createProject;
const deleteProject = (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = res.locals.user;
        const projectName = req.params.projectName;
        if (!projectName) {
            throw new ParameterException_1.default("No project name provided.");
        }
        const project = yield ProjectService.findProjectByProjectName(projectName, user);
        if (!project) {
            throw new ParameterException_1.default("Project not found.");
        }
        yield FileService.deleteFilesByProjectName(projectName, user.email);
        yield ProjectService.deleteProject(project);
        return res.status(200).send("Project deleted successfully.");
    }
    catch (error) {
        if (error instanceof DatabaseException_1.default) {
            return res.status(500).send(_utils_1.default.getErrorMessage(error));
        }
        else if (error instanceof ParameterException_1.default) {
            return res.status(400).send(_utils_1.default.getErrorMessage(error));
        }
        else if (error instanceof StorageException_1.default) {
            return res.status(500).send(_utils_1.default.getErrorMessage(error));
        }
        return res.status(500).send(_utils_1.default.getErrorMessage(error));
    }
});
exports.deleteProject = deleteProject;
