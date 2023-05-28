import DatabaseException from "@/exceptions/DatabaseException";
import prisma from "@prisma";
import { User, Project } from "@prisma/client";

export const findProjectByProjectName = async (projectName: string, user: User) => {
    try {
        const project = await prisma.PRISMA.project.findFirst({
            where: {
                name: projectName,
                userId: user.id,
            },
        }) as Project;
        return project;
    } catch (error) {
        throw new DatabaseException("Unexpected error. Could not find project.");
    }
}

export const findProjectsByUser = async (user: User) => {
    try {
        const projects = await prisma.PRISMA.project.findMany({
            where: {
                userId: user.id,
            },
        });
        return projects;
    } catch (error) {
        throw new DatabaseException("Unexpected error. Could not find project.");
    }
}

