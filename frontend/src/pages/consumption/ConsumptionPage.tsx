import { useEffect, useState, type FormEvent } from "react";
import { fetchUserEvents, getEventById } from "../../services/eventService";
import { createConsumptionRecord, getConsumptionByEvent } from "../../services/consumptionService";
import "./ConsumptionPage.css";

export default function ConsumptionPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>("");
    const [eventDishes, setEventDishes] = useState<any[]>([]);
    const [records, setRecords] = useState<any[]>([]);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        dishId: "",
        unit: "Servings",
        prepared: "",
        consumed: "",
        enteredLeftover: ""
    });

    useEffect(() => {
        fetchUserEvents().then(setEvents).catch(console.error);
    }, []);

    useEffect(() => {
        if (!selectedEventId) {
            setEventDishes([]);
            setRecords([]);
            return;
        }
        loadEventDetails(selectedEventId);
    }, [selectedEventId]);

    const loadEventDetails = async (eventId: string) => {
        try {
            const evData = await getEventById(eventId);
            setEventDishes(evData.event.eventDishes || []);
            const recData = await getConsumptionByEvent(eventId);
            setRecords(recData);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        try {
            await createConsumptionRecord({
                eventId: Number(selectedEventId),
                dishId: Number(form.dishId),
                unit: form.unit,
                prepared: Number(form.prepared),
                consumed: Number(form.consumed),
                enteredLeftover: form.enteredLeftover ? Number(form.enteredLeftover) : undefined
            });
            setForm({ dishId: "", unit: "Servings", prepared: "", consumed: "", enteredLeftover: "" });
            await loadEventDetails(selectedEventId);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to save record");
        }
    };

    return (
        <div className="consumption-page">
            <div className="consumption-heading">
                <div>
                    <h1>Food Consumption</h1>
                    <p>Track dish preparation and wastage per event.</p>
                </div>
            </div>

            <div className="consumption-form-section">
                <h2>Select Event</h2>
                <select 
                    value={selectedEventId} 
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '20px' }}
                >
                    <option value="">-- Choose an Event --</option>
                    {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>{ev.name}</option>
                    ))}
                </select>

                {selectedEventId && (
                    <form onSubmit={handleSubmit} style={{ marginTop: '20px', padding: '20px', background: '#f8fafc', borderRadius: '8px' }}>
                        <h3>Record Dish Consumption</h3>
                        <div className="consumption-form-grid">
                            <div className="consumption-field">
                                <label>Dish</label>
                                <select value={form.dishId} onChange={(e) => setForm({...form, dishId: e.target.value})} required>
                                    <option value="">Select dish...</option>
                                    {eventDishes.map((ed) => (
                                        <option key={ed.dishId} value={ed.dishId}>{ed.dish.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="consumption-field">
                                <label>Quantity Prepared</label>
                                <input type="number" min="0" step="0.1" value={form.prepared} onChange={(e) => setForm({...form, prepared: e.target.value})} required />
                            </div>
                            <div className="consumption-field">
                                <label>Quantity Consumed</label>
                                <input type="number" min="0" step="0.1" value={form.consumed} onChange={(e) => setForm({...form, consumed: e.target.value})} required />
                            </div>
                            <div className="consumption-field">
                                <label>Manually Entered Leftover (Optional)</label>
                                <input type="number" min="0" step="0.1" value={form.enteredLeftover} onChange={(e) => setForm({...form, enteredLeftover: e.target.value})} />
                            </div>
                        </div>
                        {error && <p style={{ color: "#dc2626", marginTop: "15px" }}>{error}</p>}
                        <button type="submit" className="consumption-save-btn" style={{ marginTop: '15px' }}>Save Record</button>
                    </form>
                )}
            </div>

            {selectedEventId && (
                <section className="consumption-records-section">
                    <h2>Consumption Log for Event</h2>
                    <div className="consumption-table-wrapper">
                        <table className="consumption-table">
                            <thead>
                                <tr>
                                    <th>Dish</th>
                                    <th>Prepared</th>
                                    <th>Consumed</th>
                                    <th>Calculated Waste</th>
                                    <th>Waste %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((record) => (
                                    <tr key={record.id}>
                                        <td><strong>{record.dish.name}</strong></td>
                                        <td>{record.prepared} {record.unit}</td>
                                        <td>{record.consumed} {record.unit}</td>
                                        <td><strong style={{ color: '#dc2626' }}>{record.calculatedLeftover} {record.unit}</strong></td>
                                        <td>{record.wastePercentage}%</td>
                                    </tr>
                                ))}
                                {records.length === 0 && (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>No records logged for this event.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
}