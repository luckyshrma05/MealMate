
import express from "express";

import {
  createQuotation,
  getQuotationsByEvent,
  getQuotationById
} from "../../../controllers/backendB/quotations/quotationController.js";

import { authenticate } from "../../../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.post("/", createQuotation);
router.get("/event/:eventId", getQuotationsByEvent);
router.get("/:quotationId", getQuotationById);

export default router;
