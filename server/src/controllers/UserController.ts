import { Request, Response, NextFunction } from "express";
import * as UserService from "@services/UserService";
import config from "@config";
import UserException from "@/exceptions/UserException";
import jwt from "jsonwebtoken";
import utils from "@utils";
import { User } from "@prisma/client";
import * as ProjectService from "@services/ProjectService";

export const login = async (req: Request, res: Response) => {
  try {
    let { email, password } = req.body;
    //check mail
    email = utils.parseMail(email);
    if (!email) {
      throw new UserException("Missing or invalid email");
    }
    //check password
    password = utils.parsePassword(password);
    if (!password) {
      throw new UserException("Password too short. Minimum 8 characters");
    }
    //login
    const user = await UserService.login(email, password);
    if (!user) {
      throw new UserException("Invalid credentials");
    }
    const token = jwt.sign({ email: user.email }, config.JWT_SECRET, {
      expiresIn: "6h",
    });

    //successful login
    res
      .status(200)
      .send({ email, name: user.name, surname: user.surname, token });
  } catch (error) {
    if (error instanceof UserException) {
      return res.status(400).send(utils.getErrorMessage(error));
    }
    return res.status(500).send(utils.getErrorMessage(error));
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    let { name, surname, email, password, token } = req.body;
    //name
    if (utils.isUndefinedOrEmpty(name)) {
      throw new UserException("Name is required");
    }
    //surname
    if (utils.isUndefinedOrEmpty(surname)) {
      throw new UserException("Surname is required");
    }
    //email
    email = utils.parseMail(email);
    if (!email) {
      throw new UserException("Missing or invalid email");
    }
    //password
    password = utils.parsePassword(password);
    if (!password) {
      throw new UserException("Password too short. Minimum 8 characters");
    }
    //token
    if (utils.isUndefinedOrEmpty(token)) {
      throw new UserException("Token is required");
    }
    //create user
    const [user, message] = await UserService.register(
      name,
      surname,
      email,
      password,
      token
    );

    if (!user) {
      throw new UserException(message as string);
    }

    /*
    if (typeof user === "object")
      await ProjectService.createProject("default", user);
    */

    res.status(200).send("Inserted successfully");
  } catch (error) {
    if (error instanceof UserException) {
      return res.status(400).send(utils.getErrorMessage(error));
    }
    return res.status(500).send(utils.getErrorMessage(error));
  }
};

export const generateRegistrationToken = async (
  req: Request,
  res: Response
) => {
  try {
    const user = res.locals.user as User;
    if (!user.admin) {
      throw new UserException("You are not authorized to perform this action");
    }
    const registrationToken = await UserService.generateRegistrationToken();
    if (!registrationToken) {
      throw new UserException("Error generating token");
    }
    //successful login
    res.status(200).send({ token: registrationToken });
  } catch (error) {
    if (error instanceof UserException) {
      return res.status(401).send(utils.getErrorMessage(error));
    }
    return res.status(500).send(utils.getErrorMessage(error));
  }
};

export const grantAdminPermissions = async (req: Request, res: Response) => {
  try {
    let { handledUserMail } = req.body;
    const user = res.locals.user as User;
    //check admin
    if (!user.admin) {
      throw new UserException("You are not authorized to perform this action");
    }

    const [result, message] = await UserService.handleAdminPermissions(
      user,
      handledUserMail,
      true
    );
    if (!result) {
      throw new UserException(message as string);
    }
    //successful login
    res.status(200).send("Success");
  } catch (error) {
    if (error instanceof UserException) {
      return res.status(401).send(utils.getErrorMessage(error));
    }
    return res.status(500).send(utils.getErrorMessage(error));
  }
};

export const revokeAdminPermissions = async (req: Request, res: Response) => {
  try {
    let { handledUserMail } = req.body;
    const user = res.locals.user as User;
    //check admin
    if (!user.admin) {
      throw new UserException("You are not authorized to perform this action");
    }

    const [result, message] = await UserService.handleAdminPermissions(
      user,
      handledUserMail,
      false
    );
    if (!result) {
      throw new UserException(message as string);
    }
    //successful login
    res.status(200).send("Success");
  } catch (error) {
    if (error instanceof UserException) {
      return res.status(401).send(utils.getErrorMessage(error));
    }
    return res.status(500).send(utils.getErrorMessage(error));
  }
};

export const userData = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user as User;
    res.status(200).send({
      user: {
        name: user.name,
        surname: user.surname,
        email: user.email,
        admin: user.admin,
      },
    });
  } catch (error) {
    return res.status(500).send(utils.getErrorMessage(error));
  }
};
