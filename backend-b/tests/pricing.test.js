const test = require("node:test");
const assert = require("node:assert/strict");

const PricingService = require("../src/pricing/pricingService");

// Test 1: Add a new ingredient
test("Should add a new ingredient price", () => {
    const service = new PricingService();

    const result = service.addPrice("Rice", "kg", 60);

    assert.equal(result.ingredient, "Rice");
    assert.equal(result.unit, "kg");
    assert.equal(result.pricePerUnit, 60);
});

// Test 2: Reject empty ingredient name
test("Should reject an empty ingredient name", () => {
    const service = new PricingService();

    assert.throws(
        () => service.addPrice("", "kg", 60),
        /Ingredient name is required/
    );
});

// Test 3: Reject negative prices
test("Should reject a negative price", () => {
    const service = new PricingService();

    assert.throws(
        () => service.addPrice("Rice", "kg", -10),
        /Price must be a positive number/
    );
});

// Test 4: Reject duplicate ingredients with same unit
test("Should reject duplicate ingredient prices", () => {
    const service = new PricingService();

    service.addPrice("Rice", "kg", 60);

    assert.throws(
        () => service.addPrice("rice", "KG", 65),
        /already exists/
    );
});

// Test 5: Retrieve all prices
test("Should retrieve all ingredient prices", () => {
    const service = new PricingService();

    service.addPrice("Rice", "kg", 60);
    service.addPrice("Sugar", "kg", 45);

    assert.equal(service.getAllPrices().length, 2);
});

// Test 6: Retrieve price by ingredient
test("Should retrieve price by ingredient name", () => {
    const service = new PricingService();

    service.addPrice("Rice", "kg", 60);

    const result = service.getPriceByIngredient("rice");

    assert.equal(result.length, 1);
    assert.equal(result[0].pricePerUnit, 60);
});

// Test 7: Update ingredient price
test("Should update an existing ingredient price", () => {
    const service = new PricingService();

    const item = service.addPrice("Rice", "kg", 60);
    const updated = service.updatePrice(item.id, 70);

    assert.equal(updated.pricePerUnit, 70);
});

// Test 8: Reject nonexistent price update
test("Should reject updating a nonexistent price", () => {
    const service = new PricingService();

    assert.throws(
        () => service.updatePrice(99, 70),
        /Ingredient price not found/
    );
});