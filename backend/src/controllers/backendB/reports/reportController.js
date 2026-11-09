
import prisma from "../../../db.js";
import reportService from "../../../services/backendB/reports/reportService.js";

export const getEventWasteReport = async (req, res) => {
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
        message: "You are not authorized to view this report"
      });
    }

    const report = await reportService.getWasteReportByEvent(id);

    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error("Event waste report error:", error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getAdminWasteReport = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }

    const report = await reportService.getAdminWasteReport();

    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error("Admin waste report error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate admin waste report"
    });
  }
};
