import prisma from "../../../db.js";
import { calculatePlan } from "../../../services/calculationService.js";
import costService from "../../../services/backendB/costing/costService.js";

export const calculateCost = async (req, res) => {
  const { eventId } = req.body ?? {};

  if (!Number.isSafeInteger(eventId) || eventId <= 0) {
    return res.status(400).json({
      success: false,
      message: "A valid numeric eventId is required"
    });
  }

  try {
    // 1. Retrieve event and its recipes from the database.
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

    // 2. Enforce event ownership.
    if (req.user.role !== "ADMIN" && event.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    // 3. Calculate required ingredients using Lucky's engine.
    if (event.eventDishes.length === 0) {
      return res.status(422).json({
        success: false,
        message: "Select dishes before calculating cost"
      });
    }

    const plan = calculatePlan(event);

    // 4. Adapt Lucky's output to Mitali's input format.
    const ingredients = plan.ingredients.map(item => ({
      ingredient: item.name,
      quantity: item.quantity,
      unit: item.unit
    }));

    // 5. Calculate cost using prices stored in PostgreSQL.
    const result = await costService.calculateCost(ingredients);

    return res.status(200).json({
      success: true,
      eventId,
      guestCount: event.guestCount,
      bufferPercent: event.bufferPercent,
      data: result
    });

  } catch (error) {
    console.error("Cost calculation error:", error);

    if (error.message?.includes("has no recipe") ||
        error.message?.includes("Invalid recipe") ||
        error.message?.includes("Price not found")) {
      return res.status(422).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: "Cost calculation failed"
    });
  }
};
