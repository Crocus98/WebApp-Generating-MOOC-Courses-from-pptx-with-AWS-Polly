import { Router } from "express"
import publicDir from "./public"
const router = Router()
router.use("/public", publicDir)
export default router

