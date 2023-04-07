import prisma from "@prisma";
import { User } from "@prisma/client";
import bcrypt from 'bcrypt';

const salt = 12;

export const getUserByMail = async (email: string) => {
    const user = await prisma.PRISMA.user.findUnique({ where: { email } });
    return user;
}

export const checkPassword = async (password: string, sentPassword: string) => {
    const passwordMatch = await bcrypt.compare(password, sentPassword);
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
}