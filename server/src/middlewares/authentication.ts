import jwt, { JwtPayload, JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import config from "@config";
import * as UserService from "@services/UserService";
import JwtException from "@/exceptions/JwtExceptions";

export interface CustomRequest extends Request {
  token: string | JwtPayload;
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new JwtException("Missing token");
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const email = (decoded as JwtPayload).email;
    if (!email) {
      throw new JwtException("Wrong Jwt Payload: email is missing");
    }

    const user = await UserService.getUserByMail(email);
    if (!user) {
      new JwtException("Wrong Jwt Payload: user not found");
    }
    res.locals.user = user;

    return next();
  } catch (error) {
    let message = "";
    if (error instanceof JsonWebTokenError) {
      message = "Invalid token";
    } else if (error instanceof TokenExpiredError) {
      message = "Token expired";
    } else if (error instanceof JwtException) {
      message = error.message ? error.message : "Wrong payload";
    } else {
      message = "Please authenticate";
    }
    return res.status(401).send(message);
  }
};
