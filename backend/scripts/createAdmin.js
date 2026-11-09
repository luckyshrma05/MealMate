import "dotenv/config";
import bcrypt from "bcrypt";
import prisma from "../src/db.js";

async function createAdmin() {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error("Admin credentials are not configured");
  }

  if (
    name.length > 100 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254
  ) {
    throw new Error("Invalid admin name or email");
  }

  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("Invalid admin password length");
  }

  // Only bootstrap when no admin exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (existingAdmin) {
    console.log("An admin account already exists.");
    return;
  }

  // Never overwrite or promote an existing account
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error(
      "This email is already registered. Use another admin email.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      role: "ADMIN",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  console.log("Admin account created:", admin);
}

try {
  await createAdmin();
} catch (error) {
  console.error("Admin setup failed:", error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
