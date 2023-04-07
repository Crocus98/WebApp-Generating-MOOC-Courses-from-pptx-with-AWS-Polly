import { Router } from "express"
import * as UserController from "@controllers/UserController"
import { auth } from "@authentication"

// Actual path
const path = Router()

/** GET */
path.get("/hello", auth, UserController.hello)
/** POST */
path.post("/login", UserController.login)
path.post("/register", UserController.register)
/** DELETE */
/** PUT */
export default path