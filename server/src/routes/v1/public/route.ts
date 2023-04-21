import { Router } from "express"
import * as UserController from "@controllers/UserController"
import * as FileController from "@controllers/FileController"
import { auth } from "@authentication"
import multer from "multer"

// Actual path
const path = Router()
const upload = multer({ storage: multer.memoryStorage() });

/** GET */
path.get("/me", auth, UserController.userData)
/** POST */
path.post("/login", UserController.login)
path.post("/register", UserController.register)
path.post("/token", auth, UserController.generateRegistrationToken)
/** DELETE */
/** PUT */
path.put("/upload", auth, upload.single('file'), FileController.uploadFile)
/** PATCH */
path.patch("/grant", auth, UserController.grantAdminPermissions)
path.patch("/revoke", auth, UserController.revokeAdminPermissions)

export default path