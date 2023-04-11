import prisma from "@prisma";
import { User } from "@prisma/client";
import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client'
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";

export const getUserByMail = async (email: string) => {
    const user = await prisma.PRISMA.user.findUnique({ where: { email } });
    return user;
}

const checkPassword = async (sentPassword: string, password: string) => {
    const passwordMatch = await bcrypt.compare(sentPassword, password);
    return passwordMatch;
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

export const register = async (name: string, surname: string, email: string, password: string, token: string) => {
    try {
        const salt = await bcrypt.genSalt(12);
        password = await bcrypt.hash(password, salt);
        const user = await prisma.PRISMA.user.create({
            //note that token is not the jwt token but the access token for the user
            data: {
                name,
                surname,
                email,
                password,
                token
            },
        });
        return user;
    } catch (error) {
        //usually it is the case of people trying to register with the same email
        return null;
    }
}