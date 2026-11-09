
import express from "express";
import { calculateCost } from "../../../controllers/backendB/costing/costController.js";
import { authenticate } from "../../../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.post("/", calculateCost);

export default router;
