
class QuotationService {
    constructor(costService) {
        this.costService = costService;
        this.quotations = [];
        this.nextId = 1;
    }

    createQuotation(eventId, ingredients) {
        if (
            (typeof eventId !== "string" || !eventId.trim()) &&
            (!Number.isInteger(eventId) || eventId <= 0)
        ) {
            throw new Error("A valid event ID is required");
        }

        // Calculate the cost using the existing CostService
        const costResult = this.costService.calculateCost(ingredients);

        // Save a snapshot so future price changes do not affect this quotation
        const quotation = {
            id: this.nextId++,
            eventId,
            lineItems: costResult.breakdown.map(item => ({ ...item })),
            totalCost: costResult.totalCost,
            createdAt: new Date().toISOString()
        };

        this.quotations.push(quotation);

        return {
            ...quotation,
            lineItems: quotation.lineItems.map(item => ({ ...item }))
        };
    }

    getQuotationById(id) {
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("A valid quotation ID is required");
        }

        const quotation = this.quotations.find(item => item.id === id);

        if (!quotation) {
            throw new Error("Quotation not found");
        }

        return {
            ...quotation,
            lineItems: quotation.lineItems.map(item => ({ ...item }))
        };
    }

    getQuotationsByEvent(eventId) {
        if (
            (typeof eventId !== "string" || !eventId.trim()) &&
            (!Number.isInteger(eventId) || eventId <= 0)
        ) {
            throw new Error("A valid event ID is required");
        }

        return this.quotations
            .filter(item => item.eventId === eventId)
            .map(item => ({
                ...item,
                lineItems: item.lineItems.map(line => ({ ...line }))
            }));
    }
}

module.exports = QuotationService;
