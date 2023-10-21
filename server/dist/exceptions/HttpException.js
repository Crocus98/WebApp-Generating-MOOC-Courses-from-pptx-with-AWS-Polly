"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HttpException extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
        this.message = message;
    }
    sendError(res) {
        res.status(this.status || 500).json({
            error: {
                message: this.message,
            },
        });
    }
}
exports.default = HttpException;
