import { PrismaClient } from '@prisma/client';

const globalPrisma = globalThis;

export const prisma = globalPrisma.__prisma__ || new PrismaClient();
if (!globalPrisma.__prisma__) {
  globalPrisma.__prisma__ = prisma;
}
