import prisma from "../src/db.js";

try {
  // Tests the actual Neon connection and Prisma's generated User model.
  const [result, count] = await Promise.all([
    prisma.$queryRaw`SELECT current_database() AS database_name, current_user AS db_user`,
    prisma.user.count(),
  ]);
  console.log("Connected PostgreSQL database:", result[0].database_name);
  console.log("Database role:", result[0].db_user);
  console.log("User model query succeeded, existing users:", count);
  console.log("PASS: Prisma can query the configured PostgreSQL database.");
} catch (error) {
  console.error("FAIL: Prisma database smoke test:", error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
