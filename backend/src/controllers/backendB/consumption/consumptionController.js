
import prisma from "../../../db.js";
import consumptionService from "../../../services/backendB/consumption/consumptionService.js";

export const createConsumptionRecord = async (req, res) => {
  try {
    const { eventId } = req.body;
    const id = Number(eventId);

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
        message: "You are not authorized to record consumption for this event"
      });
    }

    const record = await consumptionService.createRecord(req.body);

    return res.status(201).json({
      success: true,
      message: "Consumption record created successfully",
      data: record
    });
  } catch (error) {
    console.error("Consumption creation error:", error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getConsumptionByEvent = async (req, res) => {
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
        message: "You are not authorized to view these records"
      });
    }

    const records = await consumptionService.getRecordsByEvent(id);

    return res.status(200).json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error("Consumption retrieval error:", error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
