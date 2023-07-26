import { Request, Response, NextFunction } from "express";
import utils from "@utils";
import * as FileService from "@services/FileService";
import { User } from "@prisma/client";
import FileException from "@/exceptions/FileException";
import StorageException from "@/exceptions/StorageException";
import ElaborationException from "@/exceptions/ElaborationException";
import ParameterException from "@/exceptions/ParameterException";
import DatabaseException from "@/exceptions/DatabaseException";
import * as ProjectService from "@services/ProjectService";
import { Readable } from "stream";
import NotFound from "@/exceptions/NotFoundException";

export const uploadFile = async (req: Request, res: Response) => {
  try {
    const file = req.file;

    console.log(file);

    const projectName = req.body.projectName;
    const user = res.locals.user as User;
    if (!projectName) {
      throw new ParameterException("No project name provided.");
    }
    if (!file) {
      throw new FileException("No file uploaded.");
    }
    if (!file.originalname.endsWith(".pptx")) {
      throw new FileException("File must be a PowerPoint (.pptx) file.");
    }
    if (!(await ProjectService.findProjectByProjectName(projectName, user))) {
      throw new ParameterException("Project name not valid.");
    }

    console.log("Uploading file to storage...");
    await FileService.uploadFileToStorage(file, projectName, user.email);

    return res.status(200).send(`File ${file.originalname} uploaded to S3.`);
  } catch (error) {
    console.log(error);

    if (error instanceof FileException) {
      return res.status(400).send(utils.getErrorMessage(error));
    } else if (error instanceof StorageException) {
      return res.status(502).send(utils.getErrorMessage(error));
    } else if (error instanceof DatabaseException) {
      return res.status(500).send(utils.getErrorMessage(error));
    } else if (error instanceof ParameterException) {
      return res.status(400).send(utils.getErrorMessage(error));
    }
    return res.status(500).send(utils.getErrorMessage(error));
  }
};

export const downloadFile = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user as User;
    const parameter = req.query.original;
    const projectName = req.params.projectName;
    if (!projectName) {
      throw new ParameterException("No project name provided.");
    }
    if (!(await ProjectService.findProjectByProjectName(projectName, user))) {
      throw new NotFound("Project name not valid.");
    }
    let original = false;
    if (parameter && parameter === "true") {
      original = true;
    }
    const file = await FileService.downloadFileFromStorage(
      user.email,
      projectName,
      original
    );

    if (file instanceof Readable) {
      file.once("error", () => {
        throw new StorageException("Error while reading file.");
      });
      file.pipe(res);
    } else {
      throw new StorageException("File not readable.");
    }
  } catch (error) {
    console.log(error);
    if (error instanceof StorageException) {
      return res.status(502).send(utils.getErrorMessage(error));
    } else if (error instanceof ParameterException) {
      return res.status(400).send(utils.getErrorMessage(error));
    } else if (error instanceof DatabaseException) {
      return res.status(500).send(utils.getErrorMessage(error));
    } else if (error instanceof NotFound) {
      return res.status(404).send(utils.getErrorMessage(error));
    }
    return res.status(500).send(utils.getErrorMessage(error));
  }
};

export const elaborateFile = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user as User;
    const projectName = req.body.projectName;
    if (!projectName) {
      throw new ParameterException("No project name provided.");
    }
    const project = await ProjectService.findProjectByProjectName(
      projectName,
      user
    );
    if (!project) {
      throw new ParameterException("Project name not valid.");
    }
    await FileService.elaborateFile(project, user.email);
    return res.status(200).send("File elaboration performed successfully");
  } catch (error) {
    if (error instanceof FileException) {
      return res.status(400).send(utils.getErrorMessage(error));
    } else if (error instanceof StorageException) {
      return res.status(502).send(utils.getErrorMessage(error));
    } else if (error instanceof ElaborationException) {
      return res.status(502).send(utils.getErrorMessage(error));
    }
    return res.status(500).send(utils.getErrorMessage(error));
  }
};
