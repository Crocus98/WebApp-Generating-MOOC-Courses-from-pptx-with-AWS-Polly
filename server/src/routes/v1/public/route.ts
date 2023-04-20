import { Router } from "express"
import * as UserController from "@controllers/UserController"
import { auth } from "@authentication"

// Actual path
const path = Router()

/** GET */
/** POST */
path.post("/login", UserController.login)
path.post("/register", UserController.register)
path.post("/token", auth, UserController.generateRegistrationToken) //consider requiring authentication with jwt token too
path.post("/admin", auth, UserController.assignAdminPermissions) //consider requiring authentication with jwt token too
/** DELETE */
/** PUT */
export default path