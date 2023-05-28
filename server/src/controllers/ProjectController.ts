import { Request, Response, NextFunction } from "express";
import * as ProjectService from "@services/ProjectService";
import utils from "@utils";
import { User } from "@prisma/client";
import DatabaseException from "@/exceptions/DatabaseException";

export const listProjects = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user as User;
    const projects = await ProjectService.findProjectsByUser(user);
    return res.status(200).send(projects);
  } catch (error) {
    if (error instanceof DatabaseException) {
      res.status(500).send(utils.getErrorMessage(error));
    }
    return res.status(500).send(utils.getErrorMessage(error));
  }
};


