import { Request, Response, NextFunction } from "express";
import utils from "@utils";
import * as PreviewService from "@services/PreviewService";
import { User } from "@prisma/client";
import StorageException from "@/exceptions/StorageException";
import ParameterException from "@/exceptions/ParameterException";
import DatabaseException from "@/exceptions/DatabaseException";
import * as ProjectService from "@services/ProjectService";
import PreviewException from "@/exceptions/PreviewException";
import { Readable } from "stream";

export const getAudioPreview = async (req: Request, res: Response) => {
  try {
    //const user = res.locals.user as User;
    const text = req.body.text;
    if (!text || text.length === 0) {
      throw new ParameterException("No text for the preview provided.");
    }
    const result = await PreviewService.elaborateAudioPreview(text);
    if (result.data instanceof Readable) {
      result.data.once("error", () => {
        throw new PreviewException("Error while reading audio preview file.");
      });
      result.data.pipe(res);
    } else {
      throw new PreviewException("File not readable.");
    }
  } catch (error) {
    if (error instanceof PreviewException) {
      return res.status(502).send(utils.getErrorMessage(error));
    } else if (error instanceof ParameterException) {
      return res.status(400).send(utils.getErrorMessage(error));
    }
    return res.status(500).send(utils.getErrorMessage(error));
  }
};

export const getSlidesPreview = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user as User;
    const projectName = req.params.projectName;
    if (!projectName || projectName.length === 0) {
      throw new ParameterException("No project name provided.");
    }
    if (!ProjectService.findProjectByProjectName(projectName, user)) {
      throw new DatabaseException("Project name does not correspond to any existing project.");
    }
    const result = await PreviewService.elaborateSlidesPreview(user.email, projectName);
    if (result.data instanceof Readable) {
      result.data.once("error", () => {
        throw new StorageException("Error while piping core elaboration");
      });
      result.data.pipe(res);
    } else {
      throw new StorageException("Can't read elaborated slides");
    }
  } catch (error) {
    if (error instanceof PreviewException) {
      return res.status(502).send(utils.getErrorMessage(error));
    } else if (error instanceof ParameterException) {
      return res.status(400).send(utils.getErrorMessage(error));
    } else if (error instanceof StorageException) {
      return res.status(502).send(utils.getErrorMessage(error));
    }
    return res.status(500).send(utils.getErrorMessage(error));
  }
};
