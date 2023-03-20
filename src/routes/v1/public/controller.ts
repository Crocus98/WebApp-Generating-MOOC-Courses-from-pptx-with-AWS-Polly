import {Request, Response, NextFunction} from "express"
import logger from "@logger";
import HttpException from "@/exceptions/HttpException";

// Logic

export async function hello(req: Request, res: Response, next: NextFunction) {
  try {
    //throw new HttpException("Prova", 500)
    res.json({
      text: "Hello World"
    })
  } catch (error) {
    logger.error(error)
    next(error)
  }
}