import { Request, Response, NextFunction } from "express"
import * as UserService from "@services/UserService";
import logger from "@logger";
import config from "@config";
import HttpException from "@/exceptions/HttpException";
import jwt from 'jsonwebtoken';
import utils from "@utils";

export const login = async (req: Request, res: Response) => {
  try {
    let { email, password } = req.body;
    //check mail
    email = utils.parseMail(email);
    if (!email) {
      return res.status(400).send("Missing or invalid email");
    }
    //check password
    password = utils.parsePassword(password);
    if (!password) {
      return res.status(400).send("Password too short. Minimum 8 characters");
    }
    //login
    const user = await UserService.login(email, password)
    if (!user) {
      return res.status(400).send("Invalid credentials");
    }
    const token = jwt.sign({ name: user.name, surname: user.surname, email: user.email }, config.JWT_SECRET, {
      expiresIn: '2 days',
    });

    //successful login
    res.status(200).send({ user: { name: user.name, surname: user.surname, email: user.email }, token });
  }
  catch (error) {
    return res.status(500).send(utils.getErrorMessage(error));
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    let { name, surname, email, password, token } = req.body;
    //name
    if (utils.isUndefinedOrEmpty(name)) {
      return res.status(400).send("Name is required");
    }
    //surname
    if (utils.isUndefinedOrEmpty(surname)) {
      return res.status(400).send("Surname is required");
    }
    //email
    email = utils.parseMail(email);
    if (!email) {
      return res.status(400).send("Missing or invalid email");
    }
    //password
    password = utils.parsePassword(password);
    if (!password) {
      return res.status(400).send("Invalid password. Minimum 8 characters");
    }
    //token
    if (utils.isUndefinedOrEmpty(token)) {
      return res.status(400).send("Token is required");
    }
    //create user
    const [user, message] = await UserService.register(name, surname, email, password, token);

    if (!user) {
      return res.status(400).send(message);
    }

    res.status(200).send('Inserted successfully');
  }
  catch (error) {
    return res.status(500).send(utils.getErrorMessage(error));
  }
};

export const generateRegistrationToken = async (req: Request, res: Response) => {
  try {
    let { email, password } = req.body;
    //check mail
    email = utils.parseMail(email);
    if (!email) {
      return res.status(400).send("Missing or invalid email");
    }
    //check password
    password = utils.parsePassword(password);
    if (!password) {
      return res.status(400).send("Password too short. Minimum 8 characters");
    }
    //login
    const [registrationToken, message] = await UserService.generateRegistrationToken(email, password);
    if (!registrationToken) {
      return res.status(400).send(message);
    }
    //successful login
    res.status(200).send({ token: registrationToken });
  }
  catch (error) {
    return res.status(500).send(utils.getErrorMessage(error));
  }
};

export const grantAdminPermissions = async (req: Request, res: Response) => {
  try {
    let { email, password, newAdminMail } = req.body;
    //check mail
    email = utils.parseMail(email);
    if (!email) {
      return res.status(400).send("Missing or invalid email");
    }
    //check password
    password = utils.parsePassword(password);
    if (!password) {
      return res.status(400).send("Password too short. Minimum 8 characters");
    }
    //login
    const [result, message] = await UserService.assignAdminPermissions(email, password, newAdminMail);
    if (!result) {
      return res.status(400).send(message);
    }
    //successful login
    res.status(200).send("Success");
  }
  catch (error) {
    return res.status(500).send(utils.getErrorMessage(error));
  }
};

export const revokeAdminPermissions = async (req: Request, res: Response) => {
  try {
    let { email, password, newAdminMail } = req.body;
    //check mail
    email = utils.parseMail(email);
    if (!email) {
      return res.status(400).send("Missing or invalid email");
    }
    //check password
    password = utils.parsePassword(password);
    if (!password) {
      return res.status(400).send("Password too short. Minimum 8 characters");
    }
    //login
    const [result, message] = await UserService.revokeAdminPermissions(email, password, newAdminMail);
    if (!result) {
      return res.status(400).send(message);
    }
    //successful login
    res.status(200).send("Success");
  }
  catch (error) {
    return res.status(500).send(utils.getErrorMessage(error));
  }
};
