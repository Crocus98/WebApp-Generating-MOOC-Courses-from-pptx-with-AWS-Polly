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
            throw new PreviewException("Could not elaborate preview.");
        }
        res.setHeader("Content-Disposition", "attachment; filename=preview.mp3");
        res.setHeader("Content-Type", "audio/mpeg");
        return res.status(200).send(result);
    } catch (error) {
        if (error instanceof PreviewException) {
            return res.status(502).send(utils.getErrorMessage(error));
        }
        return res.status(500).send(utils.getErrorMessage(error));
    }
};