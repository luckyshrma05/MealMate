class PricingService {
    constructor() {
        this.prices = [];
        this.nextId = 1;
    }

    addPrice(ingredient, unit, pricePerUnit) {
        if (typeof ingredient !== "string" || !ingredient.trim()) {
            throw new Error("Ingredient name is required");
        }

        if (typeof unit !== "string" || !unit.trim()) {
            throw new Error("Ingredient unit is required");
        }

        if (typeof pricePerUnit !== "number" ||
            !Number.isFinite(pricePerUnit) ||
            pricePerUnit <= 0) {
            throw new Error("Price must be a positive number");
        }

        const exists = this.prices.some(
            item => item.ingredient.toLowerCase() === ingredient.toLowerCase() &&
                    item.unit.toLowerCase() === unit.toLowerCase()
        );

        if (exists) {
            throw new Error("Ingredient price already exists");
        }

        const item = {
            id: this.nextId++,
            ingredient,
            unit,
            pricePerUnit
        };

        this.prices.push(item);
        return { ...item };
    }

    getAllPrices() {
        return this.prices.map(item => ({ ...item }));
    }

    getPriceByIngredient(ingredient) {
        return this.prices
            .filter(item =>
                item.ingredient.toLowerCase() === ingredient.toLowerCase()
            )
            .map(item => ({ ...item }));
    }

    updatePrice(id, pricePerUnit) {
        const item = this.prices.find(item => item.id === id);

        if (!item) {
            throw new Error("Ingredient price not found");
        }

        if (typeof pricePerUnit !== "number" ||
            !Number.isFinite(pricePerUnit) ||
            pricePerUnit <= 0) {
            throw new Error("Price must be a positive number");
        }

        item.pricePerUnit = pricePerUnit;
        return { ...item };
    }
}

module.exports = PricingService;