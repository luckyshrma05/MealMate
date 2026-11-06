import bcrypt from "bcrypt";
import prisma from "../db.js";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {};

    // 1. Validate input types and required values
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim()
    ) {
      return res.status(400).json({
        message: "Valid name, email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (
      name.trim().length > 100 ||
      normalizedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return res.status(400).json({
        message: "Invalid name or email",
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        message: "Password must be between 8 and 72 characters",
      });
    }

    // 2. Check whether the email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    // 3. Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. Create the user in PostgreSQL
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "USER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // 5. Return the new user without the password
    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    // Handle simultaneous registrations with the same email
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    // Validate inputs
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find registered user
    const user = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
    });

    // Generic error prevents revealing which emails exist
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Compare submitted password with stored bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    // Generate token
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
        algorithm: "HS256",
      },
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getCurrentUser = (req, res) => {
  return res.status(200).json({
    message: "Authenticated user retrieved successfully",
    user: req.user,
  });
};

export const adminCheck = (req, res) => {
  return res.status(200).json({
    message: "Admin access granted",
    user: {
      id: req.user.id,
      name: req.user.name,
      role: req.user.role,
    },
  });
};
