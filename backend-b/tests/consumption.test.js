
const test = require("node:test");
const assert = require("node:assert/strict");

const ConsumptionService = require("../src/consumption/consumptionService");

function setup() {
    return new ConsumptionService();
}

test("Should record consumption with correct leftover and waste percentage", () => {
    const service = setup();

    const result = service.recordConsumption(
        1, 101, 100, 70, 30, "kg"
    );

    assert.equal(result.calculatedLeftover, 30);
    assert.equal(result.wastePercentage, 30);
    assert.equal(result.leftoverMismatch, false);
});

test("Should flag mismatch in entered leftover quantity", () => {
    const service = setup();

    const result = service.recordConsumption(
        1, 101, 100, 70, 20, "kg"
    );

    assert.equal(result.calculatedLeftover, 30);
    assert.equal(result.leftoverMismatch, true);
    assert.ok(result.mismatchMessage);
});

test("Should reject negative prepared quantity", () => {
    const service = setup();

    assert.throws(
        () => service.recordConsumption(1, 101, -10, 5, 5, "kg"),
        /non-negative finite numbers/
    );
});

test("Should reject negative consumed quantity", () => {
    const service = setup();

    assert.throws(
        () => service.recordConsumption(1, 101, 10, -5, 15, "kg"),
        /non-negative finite numbers/
    );
});

test("Should reject consumed quantity greater than prepared", () => {
    const service = setup();

    assert.throws(
        () => service.recordConsumption(1, 101, 10, 15, 0, "kg"),
        /Consumed quantity cannot exceed prepared quantity/
    );
});

test("Should handle zero prepared quantity without division by zero", () => {
    const service = setup();

    const result = service.recordConsumption(
        1, 101, 0, 0, 0, "kg"
    );

    assert.equal(result.wastePercentage, 0);
    assert.equal(result.calculatedLeftover, 0);
});

test("Should retrieve consumption records for an event", () => {
    const service = setup();

    service.recordConsumption(1, 101, 100, 70, 30, "kg");
    service.recordConsumption(2, 102, 50, 40, 10, "kg");

    const result = service.getRecordsByEvent(1);

    assert.equal(result.length, 1);
    assert.equal(result[0].eventId, 1);
});

test("Should calculate event-wise waste report", () => {
    const service = setup();

    service.recordConsumption(1, 101, 100, 70, 30, "kg");
    service.recordConsumption(1, 102, 50, 40, 10, "kg");

    const report = service.getWasteReportByEvent(1);

    assert.equal(report.totalPrepared, 150);
    assert.equal(report.totalConsumed, 110);
    assert.equal(report.totalWaste, 40);
    assert.equal(report.wastePercentage, 26.67);
    assert.equal(report.recordCount, 2);
});

test("Should return zero values when no records exist for an event", () => {
    const service = setup();

    const report = service.getWasteReportByEvent(999);

    assert.equal(report.totalWaste, 0);
    assert.equal(report.wastePercentage, 0);
    assert.equal(report.recordCount, 0);
});

test("Should reject invalid event ID", () => {
    const service = setup();

    assert.throws(
        () => service.recordConsumption("", 101, 10, 5, 5, "kg"),
        /valid event ID is required/
    );
});
