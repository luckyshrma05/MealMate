
import prisma from "../../../db.js";
import costService from "../costing/costService.js";

class QuotationService {
  async createQuotation(eventId, ingredients) {
    const id = Number(eventId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error("A valid event ID is required");
    }

    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      throw new Error("Event not found");
    }

    const costResult = await costService.calculateCost(ingredients);

    return prisma.quotation.create({
      data: {
        eventId: id,
        totalCost: costResult.totalCost,
        items: {
          create: costResult.breakdown.map(item => ({
            ingredientName: item.ingredient,
            quantity: item.quantity,
            unit: item.unit,
            pricePerUnit: item.pricePerUnit,
            lineTotal: item.totalCost
          }))
        }
      },
      include: { items: true }
    });
  }

  async getQuotationsByEvent(eventId) {
    const id = Number(eventId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error("A valid event ID is required");
    }

    return prisma.quotation.findMany({
      where: { eventId: id },
      include: { items: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async getQuotationById(quotationId) {
    const id = Number(quotationId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error("A valid quotation ID is required");
    }

    return prisma.quotation.findUnique({
      where: { id },
      include: { items: true, event: true }
    });
  }
}

export default new QuotationService();
