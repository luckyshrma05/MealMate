
class ConsumptionService {
    constructor() {
        this.records = [];
        this.nextId = 1;
    }

    recordConsumption(eventId, dishId, prepared, consumed, enteredLeftover, unit) {
        // Validate event ID
        if (
            (typeof eventId !== "string" || !eventId.trim()) &&
            (!Number.isInteger(eventId) || eventId <= 0)
        ) {
            throw new Error("A valid event ID is required");
        }

        // Validate dish ID
        if (
            (typeof dishId !== "string" || !dishId.trim()) &&
            (!Number.isInteger(dishId) || dishId <= 0)
        ) {
            throw new Error("A valid dish ID is required");
        }

        if (typeof unit !== "string" || !unit.trim()) {
            throw new Error("A valid unit is required");
        }

        // Validate quantities
        const quantities = [prepared, consumed, enteredLeftover];

        if (!quantities.every(value =>
            typeof value === "number" &&
            Number.isFinite(value) &&
            value >= 0
        )) {
            throw new Error("Quantities must be non-negative finite numbers");
        }

        if (consumed > prepared) {
            throw new Error("Consumed quantity cannot exceed prepared quantity");
        }

        // Calculate leftover and waste percentage
        const calculatedLeftover = prepared - consumed;

        const wastePercentage = prepared > 0
            ? Number(((calculatedLeftover / prepared) * 100).toFixed(2))
            : 0;

        const leftoverMismatch =
            Math.abs(enteredLeftover - calculatedLeftover) > 0.000001;

        const record = {
            id: this.nextId++,
            eventId,
            dishId,
            prepared,
            consumed,
            enteredLeftover,
            calculatedLeftover,
            wastePercentage,
            unit,
            leftoverMismatch,
            mismatchMessage: leftoverMismatch
                ? "Entered leftover does not match prepared minus consumed."
                : null,
            createdAt: new Date().toISOString()
        };

        this.records.push(record);

        return { ...record };
    }

    getRecordsByEvent(eventId) {
        return this.records
            .filter(record => record.eventId === eventId)
            .map(record => ({ ...record }));
    }

    getAllRecords() {
    return this.records.map(record => ({ ...record }));
}

    getWasteReportByEvent(eventId) {
        const records = this.getRecordsByEvent(eventId);

        if (records.length === 0) {
            return {
                eventId,
                totalPrepared: 0,
                totalConsumed: 0,
                totalWaste: 0,
                wastePercentage: 0,
                recordCount: 0
            };
        }

        const totalPrepared = records.reduce(
            (sum, record) => sum + record.prepared, 0
        );

        const totalConsumed = records.reduce(
            (sum, record) => sum + record.consumed, 0
        );

        const totalWaste = records.reduce(
            (sum, record) => sum + record.calculatedLeftover, 0
        );

        const wastePercentage = totalPrepared > 0
            ? Number(((totalWaste / totalPrepared) * 100).toFixed(2))
            : 0;

        return {
            eventId,
            totalPrepared,
            totalConsumed,
            totalWaste,
            wastePercentage,
            recordCount: records.length
        };
    }
}

module.exports = ConsumptionService;
