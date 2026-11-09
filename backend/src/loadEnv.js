// Prefer Neon-managed variables at the MealMate root, then local backend secrets.
// No connection strings are stored in source control.
import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(here, "..");
const projectRoot = resolve(backendRoot, "..");

for (const file of [
  resolve(projectRoot, ".env.local"),
  resolve(projectRoot, ".env"),
  resolve(backendRoot, ".env"),
]) {
  if (existsSync(file)) {
    dotenv.config({ path: file, quiet: true });
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is missing. Run neon init/neon deploy at the MealMate project root, or configure backend/.env."
  );
}
