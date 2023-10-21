"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Utils {
    static getErrorMessage(error) {
        if (error instanceof Error)
            return error.message;
        return String(error);
    }
    static parseMail(email) {
        if (this.isUndefinedOrEmpty(email))
            return null;
        email = email.trim().toLowerCase();
        const regex = /^\S+@\S+\.\S+$/;
        return regex.test(email) ? email : null;
    }
    static parsePassword(password) {
        if (this.isUndefinedOrEmpty(password) || password.length < 8)
            return null;
        return password;
    }
    static isUndefinedOrEmpty(value) {
        return value === undefined || value.trim().length === 0;
    }
}
exports.default = Utils;
