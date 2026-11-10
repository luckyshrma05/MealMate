import { calculatePlan } from "../../../services/calculationService.js";

import prisma from "../../../db.js";
import quotationService from "../../../services/backendB/quotations/quotationService.js";

export const createQuotation = async (req, res) => {
  const { eventId } = req.body ?? {};

  if (!Number.isSafeInteger(eventId) || eventId <= 0) {
    return res.status(400).json({
      success: false,
      message: "A valid numeric eventId is required"
    });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eventDishes: {
          include: {
            dish: {
              include: {
                recipeIngredients: {
                  include: { ingredient: true }
                }
              }
            }
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    if (req.user.role !== "ADMIN" &&
        event.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    if (event.eventDishes.length === 0) {
      return res.status(422).json({
        success: false,
        message: "Select dishes before creating quotation"
      });
    }

    // Calculate ingredients from the stored event menu.
    const plan = calculatePlan(event);

    const ingredients = plan.ingredients.map(item => ({
      ingredient: item.name,
      quantity: item.quantity,
      unit: item.unit
    }));

    // Save a quotation with historical price snapshots.
    const quotation = await quotationService.createQuotation(
      eventId,
      ingredients
    );

    return res.status(201).json({
      success: true,
      message: "Quotation created successfully",
      data: quotation
    });

  } catch (error) {
    console.error("Create quotation error:", error);

    if (error.message?.includes("has no recipe") ||
        error.message?.includes("Invalid recipe") ||
        error.message?.includes("Price not found") ||
        error.message?.includes("Unit mismatch")) {
      return res.status(422).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: "Quotation creation failed"
    });
  }
};

export const getQuotationsByEvent = async (req, res) => {
  try {
    const id = Number(req.params.eventId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid event ID is required"
      });
    }

    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    if (req.user.role !== "ADMIN" && event.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view quotations for this event"
      });
    }

    const quotations = await quotationService.getQuotationsByEvent(id);

    return res.status(200).json({
      success: true,
      data: quotations
    });
  } catch (error) {
    console.error("Get quotations error:", error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getQuotationById = async (req, res) => {
  try {
    const quotation = await quotationService.getQuotationById(
      req.params.quotationId
    );

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found"
      });
    }

    if (
      req.user.role !== "ADMIN" &&
      quotation.event.userId !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this quotation"
      });
    }

    return res.status(200).json({
      success: true,
      data: quotation
    });
  } catch (error) {
    console.error("Get quotation error:", error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getAllQuotations = async (req, res) => {
  try {
    const quotations = await quotationService.getAllQuotations();
    return res.status(200).json({ success: true, data: quotations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
