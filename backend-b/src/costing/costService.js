class CostService {
    constructor(pricingService) {
        this.pricingService = pricingService;
    }

    calculateCost(ingredients) {
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

            const prices = this.pricingService.getPriceByIngredient(
                item.ingredient
            );

            const matchingPrice = prices.find(
                price => price.unit.toLowerCase() === item.unit.toLowerCase()
            );

            if (!matchingPrice) {
                throw new Error(
                    `Price not found for ${item.ingredient} (${item.unit})`
                );
            }

            const ingredientCost = item.quantity * matchingPrice.pricePerUnit;

            totalCost += ingredientCost;

            breakdown.push({
                ingredient: item.ingredient,
                quantity: item.quantity,
                unit: item.unit,
                pricePerUnit: matchingPrice.pricePerUnit,
                totalCost: ingredientCost
            });
        }

        return {
            breakdown,
            totalCost: Number(totalCost.toFixed(2))
        };
    }
}

module.exports = CostService;