import { Router } from "express";
import * as UserController from "@controllers/UserController";
import * as FileController from "@controllers/FileController";
import * as ProjectController from "@controllers/ProjectController";
import * as PreviewController from "@controllers/PreviewController";
import { auth } from "@authentication";
import multer from "multer";

// Actual path
const path = Router();
const upload = multer({ storage: multer.memoryStorage() });

//All routes must authenticate except for login and register
/** GET */
path.get("/me", auth, UserController.userData);
path.get("/download/:projectName", auth, FileController.downloadFile); // parameter: original ((true/false) default: false)
path.get("/list", auth, ProjectController.listProjects);
//path.get("/project/:projectName", auth, ProjectController.getSettings); //TODO or TODELETE
path.get("/slides/:projectName", auth, PreviewController.getSlidesPreview);
/** POST */
path.post("/login", UserController.login);
path.post("/register", UserController.register);
path.post("/token", auth, UserController.generateRegistrationToken);
path.post("/upload", auth, upload.single("file"), FileController.uploadFile);
path.post("/project", auth, ProjectController.createProject);
path.post("/preview", auth, PreviewController.getAudioPreview);
path.post("/elaborate", auth, FileController.elaborateFile);
/** DELETE */
path.delete("/delete/:projectName", auth, ProjectController.deleteProject);
/** PUT */
//path.put("/settings/:projectName", auth, ProjectController.updateSettings); //TODO or TODELETE
/** PATCH */
path.patch("/grant", auth, UserController.grantAdminPermissions);
path.patch("/revoke", auth, UserController.revokeAdminPermissions);

export default path;
