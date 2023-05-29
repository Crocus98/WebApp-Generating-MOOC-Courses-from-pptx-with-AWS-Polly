"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const tslib_1 = require("tslib");
const jsonwebtoken_1 = tslib_1.__importStar(require("jsonwebtoken"));
const _config_1 = tslib_1.__importDefault(require("@config"));
const UserService = tslib_1.__importStar(require("@services/UserService"));
const JwtExceptions_1 = tslib_1.__importDefault(require("@/exceptions/JwtExceptions"));
const auth = (req, res, next) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
        if (!token) {
            throw new JwtExceptions_1.default("Missing token");
        }
        const decoded = jsonwebtoken_1.default.verify(token, _config_1.default.JWT_SECRET);
        const email = decoded.email;
        if (!email) {
            throw new JwtExceptions_1.default("Wrong Jwt Payload: email is missing");
        }
        const user = yield UserService.getUserByMail(email);
        if (!user) {
            new JwtExceptions_1.default("Wrong Jwt Payload: user not found");
        }
        res.locals.user = user;
        return next();
    }
    catch (error) {
        let message = "";
        if (error instanceof jsonwebtoken_1.JsonWebTokenError) {
            message = "Invalid token";
        }
        else if (error instanceof jsonwebtoken_1.TokenExpiredError) {
            message = "Token expired";
        }
        else if (error instanceof JwtExceptions_1.default) {
            message = error.message ? error.message : "Wrong payload";
        }
        else {
            message = "Please authenticate";
        }
        return res.status(401).send(message);
    }
});
exports.auth = auth;
