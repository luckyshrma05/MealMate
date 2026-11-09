import "./loadEnv.js";
import { PrismaClient } from "@prisma/client";

// Reuse a single Prisma client in the long-running Express Node process.
const prisma = new PrismaClient();
export default prisma;
