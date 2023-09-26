import DatabaseException from "@/exceptions/DatabaseException";
import prisma from "@prisma";
import { User, Project } from "@prisma/client";

export const findProjectByProjectName = async (projectName: string, user: User) => {
  try {
    const project = (await prisma.PRISMA.project.findFirst({
      where: {
        name: projectName,
        userId: user.id,
      },
    })) as Project;
    return project;
  } catch (error) {
    throw new DatabaseException("Unexpected error. Could not find project by project name.");
  }
};

export const findProjectsByUser = async (user: User) => {
  try {
    const projects = await prisma.PRISMA.project.findMany({
      where: {
        userId: user.id,
      },
    });
    return projects;
  } catch (error) {
    throw new DatabaseException("Unexpected error. Could not find projects by user.");
  }
};

export const findProjectsNamesByUser = async (user: User) => {
  try {
    const projects = await prisma.PRISMA.project.findMany({
      where: {
        userId: user.id,
      },
      select: {
        name: true,
      },
    });
    return projects.map((project) => project.name);
  } catch (error) {
    throw new DatabaseException("Unexpected error. Could not find project names by user.");
  }
};

export const createProject = async (projectName: string, user: User) => {
  try {
    const project = await prisma.PRISMA.project.create({
      data: {
        name: projectName,
        userId: user.id,
      },
    });
    return project;
  } catch (error) {
    throw new DatabaseException("Unexpected error. Could not create project.");
  }
};

export const deleteProject = async (project: Project) => {
  try {
    await prisma.PRISMA.project.delete({
      where: {
        id: project.id,
      },
    });
  } catch (error) {
    throw new DatabaseException("Unexpected error. Could not delete project.");
  }
};
