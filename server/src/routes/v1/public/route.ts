import { Router } from "express"
import * as UserController from "@controllers/UserController"
import * as FileController from "@controllers/FileController"
import * as ProjectController from "@controllers/ProjectController"
import { auth } from "@authentication"
import multer from "multer"

// Actual path
const path = Router()
const upload = multer({ storage: multer.memoryStorage() });

//All routes must authenticate except for login and register
/** GET */
path.get("/me", auth, UserController.userData)
path.get("/download/:projectName", auth, FileController.downloadFile) // parameter: original ((true/false) default: false)
path.get("/list", auth, ProjectController.listProjects) // parameter: projectName"
//path.get("/project/:projectName", auth, ProjectController.getSettings) // parameter: projectName
/** POST */
path.post("/login", UserController.login)
path.post("/register", UserController.register)
path.post("/token", auth, UserController.generateRegistrationToken)
path.post("/upload", auth, upload.single('file'), FileController.uploadFile)
//path.post("/project", auth, ProjectController.createProject") TODO parameter projectName
/** DELETE */
/** PUT */
path.put("/elaborate", auth, FileController.elaborateFile) // TODO add parameter projectName (REMOVE this API maybe?)
//path.put("/settings", auth, ProjectController.updateSettings) // parameter: projectName
/** PATCH */
path.patch("/grant", auth, UserController.grantAdminPermissions)
path.patch("/revoke", auth, UserController.revokeAdminPermissions)

export default path