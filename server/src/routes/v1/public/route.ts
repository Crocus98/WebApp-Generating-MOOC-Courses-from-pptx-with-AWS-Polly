import { Router } from "express"
import * as UserController from "@controllers/UserController"
import * as FileController from "@controllers/FileController"
import { auth } from "@authentication"
import multer from "multer"

// Actual path
const path = Router()
const upload = multer({ storage: multer.memoryStorage() });

//All routes must authenticate except for login and register
/** GET */
path.get("/me", auth, UserController.userData)
path.get("/download", auth, FileController.downloadFile) // parameters: original ((true/false) default: false)
/** POST */
path.post("/login", UserController.login)
path.post("/register", UserController.register)
path.post("/token", auth, UserController.generateRegistrationToken)
path.post("/upload", auth, upload.single('file'), FileController.uploadFile)
/** DELETE */
/** PUT */
path.put("/elaborate", auth, FileController.elaborateFile)
/** PATCH */
path.patch("/grant", auth, UserController.grantAdminPermissions)
path.patch("/revoke", auth, UserController.revokeAdminPermissions)

export default path