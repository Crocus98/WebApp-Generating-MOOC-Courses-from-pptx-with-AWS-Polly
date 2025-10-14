"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
class Prisma {
    constructor() {
        this.PRISMA = this.setPrisma();
    }
    setPrisma() {
        return new client_1.PrismaClient();
    }
    static getInstance() {
        if (!this.instance)
            this.instance = new Prisma();
        return this.instance;
    }
}
exports.default = Prisma.getInstance();
