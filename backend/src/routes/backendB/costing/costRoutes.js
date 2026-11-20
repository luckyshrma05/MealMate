
import express from "express";
import { calculateCost } from "../../../controllers/backendB/costing/costController.js";
import { authenticate } from "../../../middleware/authMiddleware.js";
import { authorizeRoles } from "../../../middleware/roleMiddleware.js";
const router = express.Router();

router.use(authenticate, authorizeRoles("ADMIN"));

router.post("/", calculateCost);

export default router;
