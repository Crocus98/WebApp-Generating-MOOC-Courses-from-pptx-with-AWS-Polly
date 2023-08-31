import prisma from "@prisma";
import bcrypt from "bcrypt";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { User } from "@prisma/client";

export const getUserByMail = async (email: string) => {
  const user = await prisma.PRISMA.user.findUnique({ where: { email } });
  return user;
};

const checkPassword = async (sentPassword: string, password: string) => {
  const passwordMatch = await bcrypt.compare(sentPassword, password);
  return passwordMatch;
};

//must be called inside a transaction
const checkToken = async (token: string) => {
  const existToken = await prisma.PRISMA.token.findUnique({ where: { token } });
  if (!existToken) {
    return false; //token doesn't exist
  }
  const usedToken = await prisma.PRISMA.user.findUnique({
    where: { tokenValue: token },
  });
  if (usedToken) {
    return false; //a user with this token already exists
  }
  return true; //token exists and not used
};

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
};

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
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
      return [null, "User already exists with this email"];
    }
    //usually it is the case of people trying to register with the same email or with the same token
    return [null, "An unexpected error occurred while registering the user."];
  }
};

export const generateRegistrationToken = async () => {
  try {
    const token = await prisma.PRISMA.token.create({
      data: {},
    });
    return token;
  } catch (error) {
    return null;
  }
};

export const handleAdminPermissions = async (user: User, handledUserMail: string, setAdmin: boolean) => {
  try {
    const result = await prisma.PRISMA.$transaction(async () => {
      const handledUser = await getUserByMail(handledUserMail);
      if (!handledUser) {
        return [false, "The user you are trying to assign admin permissions doesn't exist"];
      }
      const updatedUser = await prisma.PRISMA.user.update({
        where: { id: handledUser.id },
        data: { admin: setAdmin },
      });
      return [true, ""];
    });
    return result;
  } catch (error) {
    return [false, "An unexpected error occurred while assigning admin permissions."];
  }
};

export const populateRegistrationPool = async () => {
  try {
    const availableTokens = await prisma.PRISMA.token.findMany({
      where: {
        user: { is: null },
      },
      take: 5,
    });
    const tokensToGenerate = 5 - availableTokens.length;
    for (let i = 0; i < tokensToGenerate; i++) {
      const token = await generateRegistrationToken();
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
  } catch (error) {
    console.log("Errors while populating registration pool: ", (error as Error).message);
  }
};
