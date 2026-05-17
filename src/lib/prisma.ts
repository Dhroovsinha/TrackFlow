import { PrismaClient } from "@prisma/client";
import "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Graceful shutdown — prevent connection pool leaks
if (typeof process !== "undefined") {
  const shutdown = async () => {
    await prisma.$disconnect();
  };
  process.on("beforeExit", shutdown);
}

export default prisma;
