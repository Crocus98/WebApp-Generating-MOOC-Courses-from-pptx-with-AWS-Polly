import { Request, Response, NextFunction } from "express";
import utils from "@utils";
import * as FileService from "@services/FileService";
import * as PreviewService from "@services/PreviewService";
import { User } from "@prisma/client";
import FileException from "@/exceptions/FileException";
import StorageException from "@/exceptions/StorageException";
import ElaborationException from "@/exceptions/ElaborationException";
import ParameterException from "@/exceptions/ParameterException";
import DatabaseException from "@/exceptions/DatabaseException";
import * as ProjectService from "@services/ProjectService";
import PreviewException from "@/exceptions/PreviewException";


export const getAudioPreview = async (req: Request, res: Response) => {
    try {
        //const user = res.locals.user as User;
        const text = req.body.text;
        if (!text || text.length === 0) {
            throw new ParameterException("No text for the preview provided.");
        }
        const result = await PreviewService.elaborateAudioPreview(text);
        if (!result) {
            throw new PreviewException("Could not elaborate audio preview.");
        }
        //res.setHeader("Content-Disposition", "attachment; filename=preview.mp3");
        res.setHeader("Content-Type", "audio/mpeg");
        return res.status(200).send(result);
    } catch (error) {
        if (error instanceof PreviewException) {
            return res.status(502).send(utils.getErrorMessage(error));
        }
        else if (error instanceof ParameterException) {
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
        if (!result) {
            throw new PreviewException("Slides preview not empty or not available.");
        }
        res.setHeader("Content-Type", "application/json");
        return res.status(200).json(result);
    } catch (error) {
        if (error instanceof PreviewException) {
            return res.status(502).send(utils.getErrorMessage(error));
        }
        else if (error instanceof ParameterException) {
            return res.status(400).send(utils.getErrorMessage(error));
        }
        return res.status(500).send(utils.getErrorMessage(error));
    }
};