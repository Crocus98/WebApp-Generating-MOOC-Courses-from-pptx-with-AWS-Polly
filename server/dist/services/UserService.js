"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateRegistrationPool = exports.handleAdminPermissions = exports.generateRegistrationToken = exports.register = exports.login = exports.getUserByMail = void 0;
const tslib_1 = require("tslib");
const _prisma_1 = tslib_1.__importDefault(require("@prisma"));
const bcrypt_1 = tslib_1.__importDefault(require("bcrypt"));
const library_1 = require("@prisma/client/runtime/library");
const getUserByMail = (email) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const user = yield _prisma_1.default.PRISMA.user.findUnique({ where: { email } });
    return user;
});
exports.getUserByMail = getUserByMail;
const checkPassword = (sentPassword, password) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const passwordMatch = yield bcrypt_1.default.compare(sentPassword, password);
    return passwordMatch;
});
const checkToken = (token) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const existToken = yield _prisma_1.default.PRISMA.token.findUnique({ where: { token } });
    if (!existToken) {
        return false;
    }
    const usedToken = yield _prisma_1.default.PRISMA.user.findUnique({
        where: { tokenValue: token },
    });
    if (usedToken) {
        return false;
    }
    return true;
});
const login = (email, password) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const user = yield (0, exports.getUserByMail)(email);
    if (!user) {
        return null;
    }
    const passwordMatch = yield checkPassword(password, user.password);
    if (!passwordMatch) {
        return null;
    }
    return user;
});
exports.login = login;
const register = (name, surname, email, password, tokenValue) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const salt = yield bcrypt_1.default.genSalt(12);
        password = yield bcrypt_1.default.hash(password, salt);
        const result = yield _prisma_1.default.PRISMA.$transaction(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const accepted = yield checkToken(tokenValue);
            if (!accepted) {
                return [null, "Invalid token"];
            }
            const user = yield _prisma_1.default.PRISMA.user.create({
                data: {
                    name,
                    surname,
                    email,
                    password,
                    tokenValue,
                },
            });
            return [user, ""];
        }));
        return result;
    }
    catch (error) {
        if (error instanceof library_1.PrismaClientKnownRequestError &&
            error.code === "P2002") {
            return [null, "User already exists with this email"];
        }
        return [null, "An unexpected error occurred while registering the user."];
    }
});
exports.register = register;
const generateRegistrationToken = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = yield _prisma_1.default.PRISMA.token.create({
            data: {},
        });
        return token;
    }
    catch (error) {
        return null;
    }
});
exports.generateRegistrationToken = generateRegistrationToken;
const handleAdminPermissions = (user, handledUserMail, setAdmin) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield _prisma_1.default.PRISMA.$transaction(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const handledUser = yield (0, exports.getUserByMail)(handledUserMail);
            if (!handledUser) {
                return [
                    false,
                    "The user you are trying to assign admin permissions doesn't exist",
                ];
            }
            const updatedUser = yield _prisma_1.default.PRISMA.user.update({
                where: { id: handledUser.id },
                data: { admin: setAdmin },
            });
            return [true, ""];
        }));
        return result;
    }
    catch (error) {
        return [
            false,
            "An unexpected error occurred while assigning admin permissions.",
        ];
    }
});
exports.handleAdminPermissions = handleAdminPermissions;
const populateRegistrationPool = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const availableTokens = yield _prisma_1.default.PRISMA.token.findMany({
            where: {
                user: { is: null },
            },
            take: 5,
        });
        const tokensToGenerate = 5 - availableTokens.length;
        for (let i = 0; i < tokensToGenerate; i++) {
            const token = yield (0, exports.generateRegistrationToken)();
            if (!token) {
                throw new Error("Error while generating registration token");
            }
            availableTokens.push(token);
        }
        console.log("Available tokens: ");
        for (let i = 0; i < availableTokens.length; i++) {
            console.log(availableTokens[i].token);
        }
        console.log("------------------\n");
    }
    catch (error) {
        console.log("Errors while populating registration pool: ", error.message);
    }
});
exports.populateRegistrationPool = populateRegistrationPool;
