import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./db.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to MealMate API",
  });
});

// Express health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "MealMate backend is running",
  });
});

// PostgreSQL database health check
app.get("/api/db-health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "success",
      message: "PostgreSQL database connected successfully",
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      status: "error",
      message: "Database connection failed",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`MealMate server running on port ${PORT}`);
});
