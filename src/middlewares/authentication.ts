import jwt, { JwtPayload, JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import config from '@config';

export interface CustomRequest extends Request {
    token: string | JwtPayload;
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            throw new Error();
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);
        (req as CustomRequest).token = decoded;

        next();
    } catch (err) {
        if (err instanceof JsonWebTokenError) {
            res.status(401).send('Invalid token');
        } else if (err instanceof TokenExpiredError) {
            res.status(401).send('Token expired');
        } else {
            res.status(401).send('Please authenticate');
        }
    }
};





