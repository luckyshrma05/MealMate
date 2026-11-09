
import express from "express";

import {
  createConsumptionRecord,
  getConsumptionByEvent
} from "../../../controllers/backendB/consumption/consumptionController.js";

import { authenticate } from "../../../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.post("/", createConsumptionRecord);
router.get("/event/:eventId", getConsumptionByEvent);

export default router;
