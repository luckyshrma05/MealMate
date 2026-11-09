
const test = require("node:test");
const assert = require("node:assert/strict");

const ConsumptionService = require("../src/consumption/consumptionService");
const ReportService = require("../src/reports/reportService");

function setup() {
    const consumption = new ConsumptionService();
    const reports = new ReportService(consumption);

    return { consumption, reports };
}

test("Should generate aggregate waste report across events", () => {
    const { consumption, reports } = setup();

    consumption.recordConsumption(1, 101, 100, 70, 30, "kg");
    consumption.recordConsumption(2, 102, 50, 40, 10, "kg");

    const report = reports.getAggregateWasteReport();

    assert.equal(report.totalEvents, 2);
    assert.equal(report.totalRecords, 2);
    assert.equal(report.unitBreakdown[0].totalPrepared, 150);
    assert.equal(report.unitBreakdown[0].totalConsumed, 110);
    assert.equal(report.unitBreakdown[0].totalWaste, 40);
    assert.equal(report.unitBreakdown[0].wastePercentage, 26.67);
});

test("Should keep different measurement units separate", () => {
    const { consumption, reports } = setup();

    consumption.recordConsumption(1, 101, 100, 70, 30, "kg");
    consumption.recordConsumption(2, 102, 50, 40, 10, "litre");

    const report = reports.getAggregateWasteReport();

    assert.equal(report.unitBreakdown.length, 2);
});

test("Should return an empty report when no records exist", () => {
    const { reports } = setup();

    const report = reports.getAggregateWasteReport();

    assert.equal(report.totalEvents, 0);
    assert.equal(report.totalRecords, 0);
    assert.equal(report.unitBreakdown.length, 0);
});

test("Should handle zero prepared quantity in aggregate report", () => {
    const { consumption, reports } = setup();

    consumption.recordConsumption(1, 101, 0, 0, 0, "kg");

    const report = reports.getAggregateWasteReport();

    assert.equal(report.unitBreakdown[0].wastePercentage, 0);
});
