import express from "express";

import {
  registerUser,
  loginUser,
  getCurrentUser,
  adminCheck,
} from "../controllers/authController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected route: both USER and ADMIN
router.get("/me", authenticate, getCurrentUser);

// Admin-only test route
router.get("/admin-check", authenticate, authorizeRoles("ADMIN"), adminCheck);

export default router;
