import { PrismaClient } from "@prisma/client";

class Prisma {
  private static instance?: Prisma;

  public readonly PRISMA: PrismaClient;

  constructor() {
    this.PRISMA = this.setPrisma();
    this.PRISMA.$on("beforeExit", async () => {
      console.log("beforeExit hook");
    });
    this.checkConnection()
      .then(() => {
        console.log("Successful prisma health check");
      })
      .catch((err) => {
        console.log("Failed prisma health check");
      });
  }

  setPrisma(): PrismaClient {
    return new PrismaClient();
  }

  static getInstance(): Prisma {
    if (!this.instance) this.instance = new Prisma();
    return this.instance;
  }

  private checkConnection = async () => {
    return this.PRISMA.user.findFirst();
  };
}
export default Prisma.getInstance();
