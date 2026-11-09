// This is for Prisma 6.19.3 migrations / CLI. App runtime loads its env
// through src/loadEnv.js. Neon environment variables live at the project root.
import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, env } from "prisma/config";

// Called from backend/. Values already set in the shell take precedence.
for (const file of ["../.env.local", "../.env", ".env"]) {
  const path = resolve(process.cwd(), file);
  if (existsSync(path)) dotenv.config({ path, quiet: true });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  engine: "classic",
  datasource: { url: env("DATABASE_URL") },
});
