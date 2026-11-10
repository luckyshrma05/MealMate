import express from "express";

import {
  createConsumptionRecord,
  getConsumptionByEvent,
  getAllConsumptionRecords // <-- Ensure this is imported!
} from "../../../controllers/backendB/consumption/consumptionController.js";

import { authenticate } from "../../../middleware/authMiddleware.js";
import { authorizeRoles } from "../../../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.post("/", createConsumptionRecord);
router.get("/event/:eventId", getConsumptionByEvent);


router.get("/all", authorizeRoles("ADMIN"), getAllConsumptionRecords);

export default router;