import express from "express";

import {
  createQuotation,
  getQuotationsByEvent,
  getQuotationById,
  getAllQuotations // <-- This was missing!
} from "../../../controllers/backendB/quotations/quotationController.js";

import { authenticate } from "../../../middleware/authMiddleware.js";
import { authorizeRoles } from "../../../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.post("/", createQuotation);
router.get("/event/:eventId", getQuotationsByEvent);


router.get("/all", authorizeRoles("ADMIN"), getAllQuotations);

router.get("/:quotationId", getQuotationById);

export default router;