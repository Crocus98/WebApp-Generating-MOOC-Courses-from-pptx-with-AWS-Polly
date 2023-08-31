import { PrismaClient } from "@prisma/client";

class Prisma {
  private static instance?: Prisma;

  public readonly PRISMA: PrismaClient;

  constructor() {
    this.PRISMA = this.setPrisma();
  }

  setPrisma(): PrismaClient {
    return new PrismaClient();
  }

  static getInstance(): Prisma {
    if (!this.instance) this.instance = new Prisma();
    return this.instance;
  }
}
export default Prisma.getInstance();
