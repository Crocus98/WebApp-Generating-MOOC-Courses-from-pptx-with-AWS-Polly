import { Response } from "express";
export default class HttpException extends Error {
  status: number;
  message: string;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.message = message;
  }

  sendError(res: Response) {
    res.status(this.status || 500).json({
      error: {
        message: this.message
      }
    })
  }
}