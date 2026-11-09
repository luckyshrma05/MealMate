
import prisma from "../../../db.js";
import costService from "../../../services/backendB/costing/costService.js";

export const calculateCost = async (req, res) => {
  try {
    const { eventId, ingredients } = req.body;

    if (!Number.isSafeInteger(Number(eventId)) || Number(eventId) <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid event ID is required"
      });
    }

    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    if (
      req.user.role !== "ADMIN" &&
      event.userId !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to calculate costs for this event"
      });
    }

    const result = await costService.calculateCost(ingredients);

    return res.status(200).json({
      success: true,
      eventId: event.id,
      data: result
    });
  } catch (error) {
    console.error("Cost calculation error:", error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
