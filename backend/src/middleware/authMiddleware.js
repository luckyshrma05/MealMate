import jwt from "jsonwebtoken";
import prisma from "../db.js";

export const authenticate = async (req, res, next) => {
  try {
    // 1. Read Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Authentication token is required",
      });
    }

    // 2. Extract Bearer token
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
      return res.status(401).json({
        message: "Invalid authorization format",
      });
    }

    const token = parts[1];

    // 3. Verify JWT signature and expiry
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"],
      });
    } catch (error) {
      if (
        error.name === "TokenExpiredError" ||
        error.name === "JsonWebTokenError" ||
        error.name === "NotBeforeError"
      ) {
        return res.status(401).json({
          message: "Invalid or expired token",
        });
      }

      throw error;
    }

    // 4. Validate user ID inside token
    const userId = decoded.userId;

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }

    // 5. Retrieve current user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "User account not found",
      });
    }

    // 6. Attach authenticated user to request
    req.user = user;

    // 7. Continue to next middleware/controller
    next();
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(500).json({
      message: "Authentication service error",
    });
  }
};
