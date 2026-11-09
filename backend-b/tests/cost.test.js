const test = require("node:test");
const assert = require("node:assert/strict");

const PricingService = require("../src/pricing/pricingService");
const CostService = require("../src/costing/costService");

function setup() {
    const pricing = new PricingService();

    pricing.addPrice("Rice", "kg", 60);
    pricing.addPrice("Sugar", "kg", 45);
    pricing.addPrice("Oil", "litre", 120);

    return new CostService(pricing);
}

test("Should calculate cost of one ingredient", () => {
    const service = setup();
    const result = service.calculateCost([
        { ingredient: "Rice", quantity: 5, unit: "kg" }
    ]);
    assert.equal(result.totalCost, 300);
});

test("Should calculate total cost of multiple ingredients", () => {
    const service = setup();
    const result = service.calculateCost([
        { ingredient: "Rice", quantity: 5, unit: "kg" },
        { ingredient: "Sugar", quantity: 2, unit: "kg" },
        { ingredient: "Oil", quantity: 1, unit: "litre" }
    ]);
    assert.equal(result.totalCost, 510);
});

test("Should reject an empty ingredient list", () => {
    const service = setup();
    assert.throws(
        () => service.calculateCost([]),
        /At least one ingredient is required/
    );
});

test("Should reject negative ingredient quantity", () => {
    const service = setup();
    assert.throws(
        () => service.calculateCost([
            { ingredient: "Rice", quantity: -2, unit: "kg" }
        ]),
        /quantity must be positive/
    );
});

test("Should reject zero ingredient quantity", () => {
    const service = setup();
    assert.throws(
        () => service.calculateCost([
            { ingredient: "Rice", quantity: 0, unit: "kg" }
        ]),
        /quantity must be positive/
    );
});

test("Should reject an ingredient with no registered price", () => {
    const service = setup();
    assert.throws(
        () => service.calculateCost([
            { ingredient: "Salt", quantity: 2, unit: "kg" }
        ]),
        /Price not found/
    );
});

test("Should reject an incorrect ingredient unit", () => {
    const service = setup();
    assert.throws(
        () => service.calculateCost([
            { ingredient: "Rice", quantity: 2, unit: "litre" }
        ]),
        /Price not found/
    );
});

test("Should return individual ingredient costs", () => {
    const service = setup();
    const result = service.calculateCost([
        { ingredient: "Rice", quantity: 3, unit: "kg" }
    ]);
    assert.equal(result.breakdown[0].totalCost, 180);
});