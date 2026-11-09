
import prisma from "../../db.js";

class PricingService {
  async getAllPrices() {
    return prisma.ingredientPrice.findMany({
      include: { ingredient: true },
      orderBy: { ingredientId: "asc" }
    });
  }

  async getPriceByIngredient(ingredientId) {
    const id = Number(ingredientId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error("A valid ingredient ID is required");
    }

    return prisma.ingredientPrice.findUnique({
      where: { ingredientId: id },
      include: { ingredient: true }
    });
  }

  async createPrice({ ingredientId, pricePerUnit }) {
    const id = Number(ingredientId);
    const price = Number(pricePerUnit);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error("A valid ingredient ID is required");
    }

    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("Price must be a positive number");
    }

    const ingredient = await prisma.ingredient.findUnique({
      where: { id }
    });

    if (!ingredient || !ingredient.isActive) {
      throw new Error("Ingredient not found or inactive");
    }

    return prisma.ingredientPrice.create({
      data: {
        ingredientId: id,
        pricePerUnit: price
      },
      include: { ingredient: true }
    });
  }

  async updatePrice(ingredientId, pricePerUnit) {
    const id = Number(ingredientId);
    const price = Number(pricePerUnit);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error("A valid ingredient ID is required");
    }

    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("Price must be a positive number");
    }

    return prisma.ingredientPrice.update({
      where: { ingredientId: id },
      data: { pricePerUnit: price },
      include: { ingredient: true }
    });
  }

  async deletePrice(ingredientId) {
    const id = Number(ingredientId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error("A valid ingredient ID is required");
    }

    return prisma.ingredientPrice.delete({
      where: { ingredientId: id }
    });
  }
}

export default new PricingService();
