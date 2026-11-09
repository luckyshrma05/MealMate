
import prisma from "../../../db.js";

class ConsumptionService {
  async createRecord(data) {
    const {
      eventId,
      dishId,
      unit,
      prepared,
      consumed,
      enteredLeftover
    } = data;

    const id = Number(eventId);
    const dId = Number(dishId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error("A valid event ID is required");
    }

    if (!Number.isSafeInteger(dId) || dId <= 0) {
      throw new Error("A valid dish ID is required");
    }

    if (!unit || typeof unit !== "string") {
      throw new Error("A valid unit is required");
    }

    if (
      typeof prepared !== "number" ||
      !Number.isFinite(prepared) ||
      prepared < 0
    ) {
      throw new Error("Prepared quantity must be non-negative");
    }

    if (
      typeof consumed !== "number" ||
      !Number.isFinite(consumed) ||
      consumed < 0
    ) {
      throw new Error("Consumed quantity must be non-negative");
    }

    if (consumed > prepared) {
      throw new Error("Consumed quantity cannot exceed prepared quantity");
    }

    if (
      enteredLeftover !== undefined &&
      enteredLeftover !== null &&
      (
        typeof enteredLeftover !== "number" ||
        !Number.isFinite(enteredLeftover) ||
        enteredLeftover < 0
      )
    ) {
      throw new Error("Entered leftover must be non-negative");
    }

    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) throw new Error("Event not found");

    const dish = await prisma.dish.findUnique({
      where: { id: dId }
    });

    if (!dish || !dish.isActive) {
      throw new Error("Dish not found or inactive");
    }

    const calculatedLeftover = prepared - consumed;

    const wastePercentage =
      prepared === 0
        ? 0
        : Number(((calculatedLeftover / prepared) * 100).toFixed(2));

    const leftoverMismatch =
      enteredLeftover !== undefined &&
      enteredLeftover !== null &&
      Math.abs(enteredLeftover - calculatedLeftover) > 0.000001;

    return prisma.consumptionRecord.create({
      data: {
        eventId: id,
        dishId: dId,
        unit: unit.trim(),
        prepared,
        consumed,
        enteredLeftover: enteredLeftover ?? null,
        calculatedLeftover,
        wastePercentage,
        leftoverMismatch
      },
      include: {
        event: true,
        dish: true
      }
    });
  }

  async getRecordsByEvent(eventId) {
    const id = Number(eventId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error("A valid event ID is required");
    }

    return prisma.consumptionRecord.findMany({
      where: { eventId: id },
      include: { dish: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async getAllRecords() {
    return prisma.consumptionRecord.findMany({
      include: {
        event: true,
        dish: true
      },
      orderBy: { createdAt: "desc" }
    });
  }
}

export default new ConsumptionService();
