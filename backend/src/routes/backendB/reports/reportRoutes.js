
import express from "express";

import {
  getEventWasteReport,
  getAdminWasteReport
} from "../../../controllers/backendB/reports/reportController.js";

import { authenticate } from "../../../middleware/authMiddleware.js";
import { authorizeRoles } from "../../../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/admin", authorizeRoles("ADMIN"), getAdminWasteReport);
router.get("/event/:eventId", getEventWasteReport);

export default router;
