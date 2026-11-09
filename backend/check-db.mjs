import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const tables = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  console.log("EXISTING DATABASE TABLES:");
  console.log(tables);
} catch (error) {
  console.error(error.message);
} finally {
  await prisma.$disconnect();
}
