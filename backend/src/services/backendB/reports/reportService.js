
import prisma from "../../../db.js";

class ReportService {
  async getWasteReportByEvent(eventId) {
    const id = Number(eventId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error("A valid event ID is required");
    }

    const records = await prisma.consumptionRecord.findMany({
      where: { eventId: id },
      include: { dish: true }
    });

    const unitBreakdown = {};

    for (const record of records) {
      const unit = record.unit.toLowerCase();

      if (!unitBreakdown[unit]) {
        unitBreakdown[unit] = {
          unit: record.unit,
          prepared: 0,
          consumed: 0,
          waste: 0,
          wastePercentage: 0,
          recordCount: 0
        };
      }

      const summary = unitBreakdown[unit];

      summary.prepared += record.prepared;
      summary.consumed += record.consumed;
      summary.waste += record.calculatedLeftover;
      summary.recordCount += 1;
    }

    for (const summary of Object.values(unitBreakdown)) {
      summary.wastePercentage =
        summary.prepared === 0
          ? 0
          : Number(((summary.waste / summary.prepared) * 100).toFixed(2));

      summary.prepared = Number(summary.prepared.toFixed(2));
      summary.consumed = Number(summary.consumed.toFixed(2));
      summary.waste = Number(summary.waste.toFixed(2));
    }

    return {
      eventId: id,
      totalRecords: records.length,
      unitBreakdown: Object.values(unitBreakdown)
    };
  }

  async getAdminWasteReport() {
    const records = await prisma.consumptionRecord.findMany({
      include: {
        event: true,
        dish: true
      }
    });

    const unitBreakdown = {};

    for (const record of records) {
      const unit = record.unit.toLowerCase();

      if (!unitBreakdown[unit]) {
        unitBreakdown[unit] = {
          unit: record.unit,
          prepared: 0,
          consumed: 0,
          waste: 0,
          wastePercentage: 0,
          recordCount: 0
        };
      }

      const summary = unitBreakdown[unit];

      summary.prepared += record.prepared;
      summary.consumed += record.consumed;
      summary.waste += record.calculatedLeftover;
      summary.recordCount += 1;
    }

    for (const summary of Object.values(unitBreakdown)) {
      summary.wastePercentage =
        summary.prepared === 0
          ? 0
          : Number(((summary.waste / summary.prepared) * 100).toFixed(2));

      summary.prepared = Number(summary.prepared.toFixed(2));
      summary.consumed = Number(summary.consumed.toFixed(2));
      summary.waste = Number(summary.waste.toFixed(2));
    }

    return {
      totalEvents: new Set(records.map(record => record.eventId)).size,
      totalRecords: records.length,
      unitBreakdown: Object.values(unitBreakdown)
    };
  }
}

export default new ReportService();
