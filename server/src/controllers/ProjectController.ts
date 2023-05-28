import { Request, Response, NextFunction } from "express";
import * as ProjectService from "@services/ProjectService";
import * as FileService from "@services/FileService";
import utils from "@utils";
import { User } from "@prisma/client";
import DatabaseException from "@/exceptions/DatabaseException";
import ParameterException from "@/exceptions/ParameterException";
import StorageException from "@/exceptions/StorageException";

export const listProjects = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user as User;
    const projectsNames = await ProjectService.findProjectsNamesByUser(user);
    return res.status(200).send(projectsNames);
  } catch (error) {
    if (error instanceof DatabaseException) {
      res.status(500).send(utils.getErrorMessage(error));
    }
    return res.status(500).send(utils.getErrorMessage(error));
  }
};

export const getSettings = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user as User;
    const projectName = req.params.projectName;
    if (!projectName) {
      throw new ParameterException("No project name provided.");
    }
    const project = await ProjectService.findProjectByProjectName(projectName, user);
    if (!project) {
      throw new ParameterException("Project not found.");
    }
    return res.status(200).send(project);
  } catch (error) {
    if (error instanceof DatabaseException) {
      res.status(500).send(utils.getErrorMessage(error));
    }
    else if (error instanceof ParameterException) {
      res.status(400).send(utils.getErrorMessage(error));
    }
    return res.status(500).send(utils.getErrorMessage(error));
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user as User;
    const projectName = req.body.projectName;
    if (!projectName) {
      throw new ParameterException("No project name provided.");
    }
    const project = await ProjectService.createProject(projectName, user);
    return res.status(200).send(project);
  } catch (error) {
    if (error instanceof DatabaseException) {
      res.status(500).send(utils.getErrorMessage(error));
    }
    else if (error instanceof ParameterException) {
      res.status(400).send(utils.getErrorMessage(error));
    }
    return res.status(500).send(utils.getErrorMessage(error));
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user as User;
    const projectName = req.body.projectName;
    if (!projectName) {
      throw new ParameterException("No project name provided.");
    }
    const project = await ProjectService.findProjectByProjectName(projectName, user);
    if (!project) {
      throw new ParameterException("Project not found.");
    }
    await FileService.deleteFilesByProjectName(projectName, user.email);
    await ProjectService.deleteProject(project);
    return res.status(200).send("Project deleted successfully.");
  } catch (error) {
    if (error instanceof DatabaseException) {
      res.status(500).send(utils.getErrorMessage(error));
    }
    else if (error instanceof ParameterException) {
      res.status(400).send(utils.getErrorMessage(error));
    }
    else if (error instanceof StorageException) {
      res.status(500).send(utils.getErrorMessage(error));
    }
    return res.status(500).send(utils.getErrorMessage(error));
  }
};


