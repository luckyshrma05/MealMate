
const test = require("node:test");
const assert = require("node:assert/strict");

const PricingService = require("../src/pricing/pricingService");
const CostService = require("../src/costing/costService");
const QuotationService = require("../src/quotations/quotationService");

function setup() {
    const pricing = new PricingService();

    pricing.addPrice("Rice", "kg", 60);
    pricing.addPrice("Sugar", "kg", 45);
    pricing.addPrice("Oil", "litre", 120);

    const costService = new CostService(pricing);

    return {
        pricing,
        quotationService: new QuotationService(costService)
    };
}

test("Should create a quotation with correct total cost", () => {
    const { quotationService } = setup();

    const result = quotationService.createQuotation(1, [
        { ingredient: "Rice", quantity: 5, unit: "kg" },
        { ingredient: "Sugar", quantity: 2, unit: "kg" }
    ]);

    assert.equal(result.totalCost, 390);
    assert.equal(result.eventId, 1);
});

test("Should save individual ingredient costs in quotation", () => {
    const { quotationService } = setup();

    const result = quotationService.createQuotation(1, [
        { ingredient: "Rice", quantity: 3, unit: "kg" }
    ]);

    assert.equal(result.lineItems.length, 1);
    assert.equal(result.lineItems[0].totalCost, 180);
    assert.equal(result.lineItems[0].pricePerUnit, 60);
});

test("Should retrieve quotation by ID", () => {
    const { quotationService } = setup();

    const created = quotationService.createQuotation(1, [
        { ingredient: "Rice", quantity: 2, unit: "kg" }
    ]);

    const result = quotationService.getQuotationById(created.id);

    assert.equal(result.totalCost, 120);
});

test("Should retrieve quotations for an event", () => {
    const { quotationService } = setup();

    quotationService.createQuotation(1, [
        { ingredient: "Rice", quantity: 2, unit: "kg" }
    ]);

    quotationService.createQuotation(2, [
        { ingredient: "Sugar", quantity: 3, unit: "kg" }
    ]);

    const result = quotationService.getQuotationsByEvent(1);

    assert.equal(result.length, 1);
    assert.equal(result[0].eventId, 1);
});

test("Should preserve historical prices after price update", () => {
    const { pricing, quotationService } = setup();

    const created = quotationService.createQuotation(1, [
        { ingredient: "Rice", quantity: 2, unit: "kg" }
    ]);

    pricing.updatePrice(1, 100);

    const result = quotationService.getQuotationById(created.id);

    assert.equal(result.totalCost, 120);
    assert.equal(result.lineItems[0].pricePerUnit, 60);
});

test("Should reject quotation with invalid event ID", () => {
    const { quotationService } = setup();

    assert.throws(
        () => quotationService.createQuotation("", [
            { ingredient: "Rice", quantity: 2, unit: "kg" }
        ]),
        /valid event ID is required/
    );
});

test("Should reject retrieval of nonexistent quotation", () => {
    const { quotationService } = setup();

    assert.throws(
        () => quotationService.getQuotationById(999),
        /Quotation not found/
    );
});

test("Should reject quotation with invalid ingredients", () => {
    const { quotationService } = setup();

    assert.throws(
        () => quotationService.createQuotation(1, []),
        /At least one ingredient is required/
    );
});
