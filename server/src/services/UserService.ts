import prisma from "@prisma";
import bcrypt from 'bcrypt';
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export const getUserByMail = async (email: string) => {
    const user = await prisma.PRISMA.user.findUnique({ where: { email } });
    return user;
}

const checkPassword = async (sentPassword: string, password: string) => {
    const passwordMatch = await bcrypt.compare(sentPassword, password);
    return passwordMatch;
}

//must be called inside a transaction
const checkToken = async (token: string) => {
    const existToken = await prisma.PRISMA.token.findUnique({ where: { token } });
    if (!existToken) {
        return false; //token doesn't exist
    }
    const usedToken = await prisma.PRISMA.user.findUnique({ where: { tokenValue: token } });
    if (usedToken) {
        return false; //a user with this token already exists
    }
    return true; //token exists and not used
}

export const login = async (email: string, password: string) => {
    const user = await getUserByMail(email);
    if (!user) {
        return null;
    }
    const passwordMatch = await checkPassword(password, user.password);
    if (!passwordMatch) {
        return null;
    }
    return user;
}

export const register = async (name: string, surname: string, email: string, password: string, tokenValue: string) => {
    try {
        const salt = await bcrypt.genSalt(12);
        password = await bcrypt.hash(password, salt);
        const result = await prisma.PRISMA.$transaction(async () => {
            const accepted = await checkToken(tokenValue);
            if (!accepted) {
                return [null, "Invalid token"];
            }
            const user = await prisma.PRISMA.user.create({
                //note that token is not the jwt token but the access token for the user
                data: {
                    name,
                    surname,
                    email,
                    password,
                    tokenValue,
                },
            });
            return [user, ""];
        });
        return result;
    } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
            return [null, "User already exists with this email"];
        }
        //usually it is the case of people trying to register with the same email or with the same token
        return [null, "An unexpected error occurred while registering the user."];
    }
}

export const generateRegistrationToken = async (email: string, password: string) => {
    try {
        const result = await prisma.PRISMA.$transaction(async () => {
            const user = await login(email, password);
            if (!user) {
                return [null, "Invalid credentials"];
            }
            if (user.admin == false) {
                return [null, "You must be an admin to generate a token"];
            }
            const token = await prisma.PRISMA.token.create({
                data: {}
            });
            return [token, ""]; //token exists and not used
        });
        return result;
    } catch (error) {
        return [null, "An unexpected error occurred while generating a registration token."];
    }
}

export const assignAdminPermissions = async (email: any, password: any, newAdminMail: any) => {
    try {
        const result = await prisma.PRISMA.$transaction(async () => {
            const user = await login(email, password);
            if (!user) {
                return [false, "Invalid credentials"];
            }
            if (user.admin == false) {
                return [false, "You must be an admin to assign admin permissions"];
            }
            const newAdmin = await getUserByMail(newAdminMail);
            if (!newAdmin) {
                return [false, "The user you are trying to assign admin permissions doesn't exist"];
            }
            const updatedUser = await prisma.PRISMA.user.update({ where: { id: newAdmin.id }, data: { admin: true } });
            return [true, ""];
        })
        return result;
    } catch (error) {
        return [false, "An unexpected error occurred while assigning admin permissions."];
    }
}

export const revokeAdminPermissions = async (email: any, password: any, newAdminMail: any) => {
    try {
        const result = await prisma.PRISMA.$transaction(async () => {
            const user = await login(email, password);
            if (!user) {
                return [false, "Invalid credentials"];
            }
            if (user.admin == false) {
                return [false, "You must be an admin to revoke admin permissions"];
            }
            const newNormalUser = await getUserByMail(newAdminMail);
            if (!newNormalUser) {
                return [false, "The user you are trying to revoke admin permissions from doesn't exist"];
            }
            const updatedUser = await prisma.PRISMA.user.update({ where: { id: newNormalUser.id }, data: { admin: false } });
            return [true, ""];
        })
        return result;
    } catch (error) {
        return [false, "An unexpected error occurred while revoking admin permissions."];
    }
}
