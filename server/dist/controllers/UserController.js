"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userData = exports.revokeAdminPermissions = exports.grantAdminPermissions = exports.generateRegistrationToken = exports.register = exports.login = void 0;
const tslib_1 = require("tslib");
const UserService = tslib_1.__importStar(require("@services/UserService"));
const _config_1 = tslib_1.__importDefault(require("@config"));
const UserException_1 = tslib_1.__importDefault(require("@/exceptions/UserException"));
const jsonwebtoken_1 = tslib_1.__importDefault(require("jsonwebtoken"));
const _utils_1 = tslib_1.__importDefault(require("@utils"));
const login = (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        let { email, password } = req.body;
        email = _utils_1.default.parseMail(email);
        if (!email) {
            throw new UserException_1.default("Missing or invalid email");
        }
        password = _utils_1.default.parsePassword(password);
        if (!password) {
            throw new UserException_1.default("Password too short. Minimum 8 characters");
        }
        const user = yield UserService.login(email, password);
        if (!user) {
            throw new UserException_1.default("Invalid credentials");
        }
        const token = jsonwebtoken_1.default.sign({ email: user.email }, _config_1.default.JWT_SECRET, {
            expiresIn: "6h",
        });
        res
            .status(200)
            .send({ email, name: user.name, surname: user.surname, token });
    }
    catch (error) {
        if (error instanceof UserException_1.default) {
            return res.status(400).send(_utils_1.default.getErrorMessage(error));
        }
        return res.status(500).send(_utils_1.default.getErrorMessage(error));
    }
});
exports.login = login;
const register = (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        let { name, surname, email, password, token } = req.body;
        if (_utils_1.default.isUndefinedOrEmpty(name)) {
            throw new UserException_1.default("Name is required");
        }
        if (_utils_1.default.isUndefinedOrEmpty(surname)) {
            throw new UserException_1.default("Surname is required");
        }
        email = _utils_1.default.parseMail(email);
        if (!email) {
            throw new UserException_1.default("Missing or invalid email");
        }
        password = _utils_1.default.parsePassword(password);
        if (!password) {
            throw new UserException_1.default("Password too short. Minimum 8 characters");
        }
        if (_utils_1.default.isUndefinedOrEmpty(token)) {
            throw new UserException_1.default("Token is required");
        }
        const [user, message] = yield UserService.register(name, surname, email, password, token);
        if (!user) {
            throw new UserException_1.default(message);
        }
        res.status(200).send("Inserted successfully");
    }
    catch (error) {
        if (error instanceof UserException_1.default) {
            return res.status(400).send(_utils_1.default.getErrorMessage(error));
        }
        return res.status(500).send(_utils_1.default.getErrorMessage(error));
    }
});
exports.register = register;
const generateRegistrationToken = (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = res.locals.user;
        if (!user.admin) {
            throw new UserException_1.default("You are not authorized to perform this action");
        }
        const registrationToken = yield UserService.generateRegistrationToken();
        if (!registrationToken) {
            throw new UserException_1.default("Error generating token");
        }
        res.status(200).send({ token: registrationToken });
    }
    catch (error) {
        if (error instanceof UserException_1.default) {
            return res.status(401).send(_utils_1.default.getErrorMessage(error));
        }
        return res.status(500).send(_utils_1.default.getErrorMessage(error));
    }
});
exports.generateRegistrationToken = generateRegistrationToken;
const grantAdminPermissions = (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        let { handledUserMail } = req.body;
        const user = res.locals.user;
        if (!user.admin) {
            throw new UserException_1.default("You are not authorized to perform this action");
        }
        const [result, message] = yield UserService.handleAdminPermissions(user, handledUserMail, true);
        if (!result) {
            throw new UserException_1.default(message);
        }
        res.status(200).send("Success");
    }
    catch (error) {
        if (error instanceof UserException_1.default) {
            return res.status(401).send(_utils_1.default.getErrorMessage(error));
        }
        return res.status(500).send(_utils_1.default.getErrorMessage(error));
    }
});
exports.grantAdminPermissions = grantAdminPermissions;
const revokeAdminPermissions = (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        let { handledUserMail } = req.body;
        const user = res.locals.user;
        if (!user.admin) {
            throw new UserException_1.default("You are not authorized to perform this action");
        }
        const [result, message] = yield UserService.handleAdminPermissions(user, handledUserMail, false);
        if (!result) {
            throw new UserException_1.default(message);
        }
        res.status(200).send("Success");
    }
    catch (error) {
        if (error instanceof UserException_1.default) {
            return res.status(401).send(_utils_1.default.getErrorMessage(error));
        }
        return res.status(500).send(_utils_1.default.getErrorMessage(error));
    }
});
exports.revokeAdminPermissions = revokeAdminPermissions;
const userData = (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = res.locals.user;
        res.status(200).send({
            user: {
                name: user.name,
                surname: user.surname,
                email: user.email,
                admin: user.admin,
            },
        });
    }
    catch (error) {
        return res.status(500).send(_utils_1.default.getErrorMessage(error));
    }
});
exports.userData = userData;
