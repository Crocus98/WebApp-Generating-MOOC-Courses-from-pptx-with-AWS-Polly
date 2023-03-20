import { Router } from "express"
import * as controller from "./controller"

// Actual path

const path = Router()
/** GET */
path.get("/hello", controller.hello)
/** POST */
/** DELETE */
/** PUT */
export default path