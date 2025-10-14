"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.createProject = exports.findProjectsNamesByUser = exports.findProjectsByUser = exports.findProjectByProjectName = void 0;
const tslib_1 = require("tslib");
const DatabaseException_1 = tslib_1.__importDefault(require("@/exceptions/DatabaseException"));
const _prisma_1 = tslib_1.__importDefault(require("@prisma"));
const findProjectByProjectName = (projectName, user) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = yield _prisma_1.default.PRISMA.project.findFirst({
            where: {
                name: projectName,
                userId: user.id,
            },
        });
        return project;
    }
    catch (error) {
        throw new DatabaseException_1.default("Unexpected error. Could not find project.");
    }
});
exports.findProjectByProjectName = findProjectByProjectName;
const findProjectsByUser = (user) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const projects = yield _prisma_1.default.PRISMA.project.findMany({
            where: {
                userId: user.id,
            },
        });
        return projects;
    }
    catch (error) {
        throw new DatabaseException_1.default("Unexpected error. Could not find projects.");
    }
});
exports.findProjectsByUser = findProjectsByUser;
const findProjectsNamesByUser = (user) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const projects = yield _prisma_1.default.PRISMA.project.findMany({
            where: {
                userId: user.id,
            },
            select: {
                name: true,
            },
        });
        return projects.map((project) => project.name);
    }
    catch (error) {
        throw new DatabaseException_1.default("Unexpected error. Could not find project names.");
    }
});
exports.findProjectsNamesByUser = findProjectsNamesByUser;
const createProject = (projectName, user) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = yield _prisma_1.default.PRISMA.project.create({
            data: {
                name: projectName,
                userId: user.id
            }
        });
        return project;
    }
    catch (error) {
        throw new DatabaseException_1.default("Unexpected error. Could not create project.");
    }
});
exports.createProject = createProject;
const deleteProject = (project) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        yield _prisma_1.default.PRISMA.project.delete({
            where: {
                id: project.id,
            },
        });
    }
    catch (error) {
        throw new DatabaseException_1.default("Unexpected error. Could not delete project.");
    }
});
exports.deleteProject = deleteProject;
