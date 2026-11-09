import express from "express";
import {
  getPrices,
  getPrice,
  createPrice,
  updatePrice,
  deletePrice,
} from "../../controllers/backendB/pricingController.js";

import { authenticate } from "../../middleware/authMiddleware.js";
import { authorizeRoles } from "../../middleware/roleMiddleware.js";

const router = express.Router();

// All pricing routes require authentication
router.use(authenticate);

// Any authenticated user can view prices
router.get("/", getPrices);
router.get("/:ingredientId", getPrice);

// Only admins can modify prices
router.post("/", authorizeRoles("ADMIN"), createPrice);
router.put("/:ingredientId", authorizeRoles("ADMIN"), updatePrice);
router.delete("/:ingredientId", authorizeRoles("ADMIN"), deletePrice);

export default router;