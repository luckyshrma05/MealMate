
import prisma from "../../../db.js";;

class CostService {
  async calculateCost(ingredients) {
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      throw new Error("At least one ingredient is required");
    }

    let totalCost = 0;
    const breakdown = [];

    for (const item of ingredients) {
      if (!item.ingredient || typeof item.ingredient !== "string") {
        throw new Error("Valid ingredient name is required");
      }

      if (!item.unit || typeof item.unit !== "string") {
        throw new Error("Valid ingredient unit is required");
      }

      if (
        typeof item.quantity !== "number" ||
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0
      ) {
        throw new Error("Ingredient quantity must be positive");
      }

      const ingredient = await prisma.ingredient.findFirst({
        where: {
          name: {
            equals: item.ingredient,
            mode: "insensitive"
          }
        },
        include: {
          price: true
        }
      });

      if (!ingredient || !ingredient.isActive) {
        throw new Error(`Ingredient not found: ${item.ingredient}`);
      }

      if (ingredient.unit.toLowerCase() !== item.unit.toLowerCase()) {
        throw new Error(
          `Unit mismatch for ${item.ingredient}. Expected ${ingredient.unit}`
        );
      }

      if (!ingredient.price) {
        throw new Error(
          `Price not found for ${item.ingredient} (${item.unit})`
        );
      }

      const ingredientCost =
        item.quantity * ingredient.price.pricePerUnit;

      totalCost += ingredientCost;

      breakdown.push({
        ingredient: ingredient.name,
        quantity: item.quantity,
        unit: ingredient.unit,
        pricePerUnit: ingredient.price.pricePerUnit,
        totalCost: Number(ingredientCost.toFixed(2))
      });
    }

    return {
      breakdown,
      totalCost: Number(totalCost.toFixed(2))
    };
  }
}

export default new CostService();
