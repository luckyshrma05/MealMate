
import { useEffect, useMemo, useState } from "react";
import "./ConsumptionPage.css";

interface Ingredient {
    id: string;
    name: string;
    category: string;
    unit: string;
    supplier: string;
    price: number;
}

interface ConsumptionRecord {
    id: string;
    eventName: string;
    eventDate: string;
    ingredientId: string;
    ingredientName: string;
    unit: string;
    price: number;
    plannedQty: number;
    actualQty: number;
    wastedQty: number;
    notes: string;
}

const INGREDIENTS_KEY = "mealmate_ingredients";
const CONSUMPTION_KEY = "mealmate_consumption";

function ConsumptionPage() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [records, setRecords] = useState<ConsumptionRecord[]>([]);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("");

    const [form, setForm] = useState({
        eventName: "",
        eventDate: "",
        ingredientId: "",
        plannedQty: "",
        actualQty: "",
        wastedQty: "0",
        notes: "",
    });

    useEffect(() => {
        const savedIngredients = localStorage.getItem(INGREDIENTS_KEY);
        const savedRecords = localStorage.getItem(CONSUMPTION_KEY);

        if (savedIngredients) {
            setIngredients(JSON.parse(savedIngredients));
        }

        if (savedRecords) {
            setRecords(JSON.parse(savedRecords));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(CONSUMPTION_KEY, JSON.stringify(records));
    }, [records]);

    const selectedIngredient = ingredients.find(
        (ingredient) => String(ingredient.id) === String(form.ingredientId)
    );

    const planned = Number(form.plannedQty) || 0;
    const actual = Number(form.actualQty) || 0;
    const wasted = Number(form.wastedQty) || 0;
    const unitPrice = selectedIngredient?.price || 0;

    const excess = Math.max(actual - planned, 0);
    const unusedPlanned = Math.max(planned - actual, 0);
    const estimatedCost = actual * unitPrice;
    const estimatedWasteCost = wasted * unitPrice;

    const resetForm = () => {
        setForm({
            eventName: "",
            eventDate: "",
            ingredientId: "",
            plannedQty: "",
            actualQty: "",
            wastedQty: "0",
            notes: "",
        });
        setEditingId(null);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!selectedIngredient) {
            alert("Please select an ingredient.");
            return;
        }

        if (planned <= 0 || actual < 0 || wasted < 0) {
            alert("Please enter valid quantities.");
            return;
        }

        if (wasted > actual) {
            alert("Wastage cannot be greater than actual consumption.");
            return;
        }

        const record: ConsumptionRecord = {
            id: editingId || crypto.randomUUID(),
            eventName: form.eventName.trim(),
            eventDate: form.eventDate,
            ingredientId: selectedIngredient.id,
            ingredientName: selectedIngredient.name,
            unit: selectedIngredient.unit,
            price: selectedIngredient.price,
            plannedQty: planned,
            actualQty: actual,
            wastedQty: wasted,
            notes: form.notes.trim(),
        };

        if (editingId) {
            setRecords((previous) =>
                previous.map((item) => (item.id === editingId ? record : item))
            );
        } else {
            setRecords((previous) => [record, ...previous]);
        }

        resetForm();
    };

    const handleEdit = (record: ConsumptionRecord) => {
        setEditingId(record.id);

        setForm({
            eventName: record.eventName,
            eventDate: record.eventDate,
            ingredientId: record.ingredientId,
            plannedQty: String(record.plannedQty),
            actualQty: String(record.actualQty),
            wastedQty: String(record.wastedQty),
            notes: record.notes,
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this record?")) {
            setRecords((previous) => previous.filter((item) => item.id !== id));

            if (editingId === id) {
                resetForm();
            }
        }
    };

    const filteredRecords = useMemo(() => {
        return records.filter((record) => {
            const searchText = search.toLowerCase();

            const matchesSearch =
                record.eventName.toLowerCase().includes(searchText) ||
                record.ingredientName.toLowerCase().includes(searchText);

            const matchesDate =
                !dateFilter || record.eventDate === dateFilter;

            return matchesSearch && matchesDate;
        });
    }, [records, search, dateFilter]);

    const totalConsumptionCost = records.reduce(
        (total, record) => total + record.actualQty * record.price,
        0
    );

    const totalWasteCost = records.reduce(
        (total, record) => total + record.wastedQty * record.price,
        0
    );

    const totalWasteQuantity = records.reduce(
        (total, record) => total + record.wastedQty,
        0
    );

    const totalExcess = records.reduce(
        (total, record) =>
            total + Math.max(record.actualQty - record.plannedQty, 0),
        0
    );

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(value);

    return (
        <div className="consumption-page">
            <div className="consumption-heading">
                <div>
                    <h1>Food Consumption</h1>
                    <p>Track ingredient usage, consumption costs and wastage.</p>
                </div>
            </div>

            <div className="consumption-summary">
                <div className="consumption-stat">
                    <span>Total Records</span>
                    <h2>{records.length}</h2>
                </div>

                <div className="consumption-stat">
                    <span>Total Consumption Cost</span>
                    <h2>{formatCurrency(totalConsumptionCost)}</h2>
                </div>

                <div className="consumption-stat">
                    <span>Total Food Wastage</span>
                    <h2>{totalWasteQuantity.toFixed(2)}</h2>
                    <small>Quantity across recorded ingredients</small>
                </div>

                <div className="consumption-stat">
                    <span>Estimated Wastage Cost</span>
                    <h2>{formatCurrency(totalWasteCost)}</h2>
                </div>

                <div className="consumption-stat">
                    <span>Excess Consumption</span>
                    <h2>{totalExcess.toFixed(2)}</h2>
                    <small>Quantity above planned consumption</small>
                </div>
            </div>

            <section className="consumption-form-section">
                <h2>{editingId ? "Edit Consumption Record" : "Add Consumption Record"}</h2>

                <form onSubmit={handleSubmit}>
                    <div className="consumption-form-grid">
                        <div className="consumption-field">
                            <label>Event Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Corporate Lunch"
                                value={form.eventName}
                                onChange={(e) =>
                                    setForm({ ...form, eventName: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="consumption-field">
                            <label>Event Date</label>
                            <input
                                type="date"
                                value={form.eventDate}
                                onChange={(e) =>
                                    setForm({ ...form, eventDate: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="consumption-field">
                            <label>Ingredient</label>
                            <select
                                value={form.ingredientId}
                                onChange={(e) =>
                                    setForm({ ...form, ingredientId: e.target.value })
                                }
                                required
                            >
                                <option value="">Select ingredient</option>
                                {ingredients.map((ingredient) => (
                                    <option key={String(ingredient.id)} value={String(ingredient.id)}>
                                        {ingredient.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="consumption-field">
                            <label>Unit Price</label>
                            <input
                                type="text"
                                value={
                                    selectedIngredient
                                        ? `${formatCurrency(unitPrice)} / ${selectedIngredient.unit}`
                                        : "Select an ingredient"
                                }
                                readOnly
                            />
                        </div>

                        <div className="consumption-field">
                            <label>Planned Quantity</label>
                            <input
                                type="number"
                                min="0.01"
                                step="any"
                                placeholder="Enter planned quantity"
                                value={form.plannedQty}
                                onChange={(e) =>
                                    setForm({ ...form, plannedQty: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="consumption-field">
                            <label>Actual Quantity</label>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                placeholder="Enter actual quantity"
                                value={form.actualQty}
                                onChange={(e) =>
                                    setForm({ ...form, actualQty: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="consumption-field">
                            <label>Wasted Quantity</label>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                placeholder="Enter wasted quantity"
                                value={form.wastedQty}
                                onChange={(e) =>
                                    setForm({ ...form, wastedQty: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="consumption-field">
                            <label>Notes</label>
                            <input
                                type="text"
                                placeholder="Optional notes"
                                value={form.notes}
                                onChange={(e) =>
                                    setForm({ ...form, notes: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <div className="consumption-calculations">
                        <div>
                            <span>Excess Consumption</span>
                            <strong>
                                {excess.toFixed(2)} {selectedIngredient?.unit || ""}
                            </strong>
                        </div>

                        <div>
                            <span>Unused Planned Quantity</span>
                            <strong>
                                {unusedPlanned.toFixed(2)} {selectedIngredient?.unit || ""}
                            </strong>
                        </div>

                        <div>
                            <span>Estimated Consumption Cost</span>
                            <strong>{formatCurrency(estimatedCost)}</strong>
                        </div>

                        <div>
                            <span>Estimated Wastage Cost</span>
                            <strong>{formatCurrency(estimatedWasteCost)}</strong>
                        </div>
                    </div>

                    <div className="consumption-form-actions">
                        <button type="submit" className="consumption-save-btn">
                            {editingId ? "Update Record" : "Save Record"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                className="consumption-cancel-btn"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </section>

            <section className="consumption-records-section">
                <div className="consumption-records-heading">
                    <div>
                        <h2>Consumption Records</h2>
                        <p>View and manage all recorded ingredient consumption.</p>
                    </div>

                    <div className="consumption-filters">
                        <input
                            type="text"
                            placeholder="Search event or ingredient..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />

                        <button
                            type="button"
                            onClick={() => {
                                setSearch("");
                                setDateFilter("");
                            }}
                        >
                            Clear
                        </button>
                    </div>
                </div>

                <div className="consumption-table-wrapper">
                    <table className="consumption-table">
                        <thead>
                            <tr>
                                <th>Event</th>
                                <th>Date</th>
                                <th>Ingredient</th>
                                <th>Planned</th>
                                <th>Actual</th>
                                <th>Wasted</th>
                                <th>Consumption Cost</th>
                                <th>Waste Cost</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredRecords.length > 0 ? (
                                filteredRecords.map((record) => (
                                    <tr key={record.id}>
                                        <td>{record.eventName}</td>
                                        <td>{record.eventDate}</td>
                                        <td>{record.ingredientName}</td>
                                        <td>{record.plannedQty} {record.unit}</td>
                                        <td>{record.actualQty} {record.unit}</td>
                                        <td>{record.wastedQty} {record.unit}</td>
                                        <td>
                                            {formatCurrency(record.actualQty * record.price)}
                                        </td>
                                        <td>
                                            {formatCurrency(record.wastedQty * record.price)}
                                        </td>
                                        <td>
                                            <div className="consumption-actions">
                                                <button onClick={() => handleEdit(record)}>
                                                    Edit
                                                </button>
                                                <button
                                                    className="consumption-delete-btn"
                                                    onClick={() => handleDelete(record.id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="consumption-empty">
                                        No consumption records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

export default ConsumptionPage;
