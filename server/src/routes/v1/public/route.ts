import { Router } from "express"
import * as UserController from "@controllers/UserController"
import { auth } from "@authentication"

// Actual path
const path = Router()

/** GET */
/** POST */
path.post("/login", UserController.login)
path.post("/register", UserController.register)
path.post("/token", auth, UserController.generateRegistrationToken)
path.post("/grant", auth, UserController.grantAdminPermissions)
path.post("/revoke", auth, UserController.revokeAdminPermissions)
/** DELETE */
/** PUT */
export default path