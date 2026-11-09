
class ReportService {
    constructor(consumptionService) {
        this.consumptionService = consumptionService;
    }

    getAggregateWasteReport() {
        const records = this.consumptionService.getAllRecords();

        const unitGroups = {};

        for (const record of records) {
            const unit = record.unit;

            if (!unitGroups[unit]) {
                unitGroups[unit] = {
                    unit,
                    totalPrepared: 0,
                    totalConsumed: 0,
                    totalWaste: 0,
                    wastePercentage: 0,
                    recordCount: 0
                };
            }

            unitGroups[unit].totalPrepared += record.prepared;
            unitGroups[unit].totalConsumed += record.consumed;
            unitGroups[unit].totalWaste += record.calculatedLeftover;
            unitGroups[unit].recordCount++;
        }

        const unitBreakdown = Object.values(unitGroups).map(group => {
            group.wastePercentage = group.totalPrepared > 0
                ? Number(
                    ((group.totalWaste / group.totalPrepared) * 100).toFixed(2)
                )
                : 0;

            return group;
        });

        const eventIds = new Set(records.map(record => record.eventId));

        return {
            totalEvents: eventIds.size,
            totalRecords: records.length,
            unitBreakdown
        };
    }
}

module.exports = ReportService;
