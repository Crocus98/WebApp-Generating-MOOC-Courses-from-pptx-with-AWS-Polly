import {Request, Response, NextFunction} from "express"
import logger from "@logger";
import HttpException from "@/exceptions/HttpException";

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Logic

export async function hello(req: Request, res: Response, next: NextFunction) {
  try {
    //throw new HttpException("Prova", 500)
    let users = await testPrisma();
    res.status(200).json(users);
  } catch (error) {
    logger.error(error)
    next(error)
  }
}

async function testPrisma() {
  try {
    const users = await prisma.user.findMany();
    return users;
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}