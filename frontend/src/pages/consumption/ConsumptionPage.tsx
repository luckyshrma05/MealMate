import { useEffect, useState, type FormEvent } from "react";
import { fetchUserEvents, getEventById } from "../../services/eventService";
import { createConsumptionRecord, getConsumptionByEvent } from "../../services/consumptionService";

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
            // Handle differences in nested backend structures safely
            setEventDishes(evData.event?.eventDishes || evData.eventDishes || []);
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
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Food Consumption</h1>
                <p className="text-gray-600 mt-1">Track dish preparation and wastage per event.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Event</h2>
                <select 
                    value={selectedEventId} 
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-colors"
                >
                    <option value="">-- Choose an Event --</option>
                    {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>{ev.name}</option>
                    ))}
                </select>

                {selectedEventId && (
                    <form onSubmit={handleSubmit} className="mt-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <h3 className="text-md font-semibold text-gray-800 mb-4">Record Dish Consumption</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dish</label>
                                <select 
                                    value={form.dishId} 
                                    onChange={(e) => setForm({...form, dishId: e.target.value})} 
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    <option value="">Select dish...</option>
                                    {eventDishes.map((ed) => (
                                        <option key={ed.dishId} value={ed.dishId}>{ed.dish.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Prepared</label>
                                <input 
                                    type="number" min="0" step="0.1" 
                                    value={form.prepared} 
                                    onChange={(e) => setForm({...form, prepared: e.target.value})} 
                                    required 
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Consumed</label>
                                <input 
                                    type="number" min="0" step="0.1" 
                                    value={form.consumed} 
                                    onChange={(e) => setForm({...form, consumed: e.target.value})} 
                                    required 
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Manually Entered Leftover (Optional)</label>
                                <input 
                                    type="number" min="0" step="0.1" 
                                    value={form.enteredLeftover} 
                                    onChange={(e) => setForm({...form, enteredLeftover: e.target.value})} 
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        {error && <p className="text-red-600 bg-red-50 p-3 rounded-lg mt-4 border border-red-100 text-sm">{error}</p>}
                        
                        {/* The Fixed Tailwind Button */}
                        <button 
                            type="submit" 
                            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors"
                        >
                            Save Record
                        </button>
                    </form>
                )}
            </div>

            {selectedEventId && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-800">Consumption Log for Event</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-gray-200 text-sm text-gray-600">
                                    <th className="px-6 py-4 font-medium">Dish</th>
                                    <th className="px-6 py-4 font-medium">Prepared</th>
                                    <th className="px-6 py-4 font-medium">Consumed</th>
                                    <th className="px-6 py-4 font-medium">Calculated Waste</th>
                                    <th className="px-6 py-4 font-medium">Waste %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {records.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{record.dish.name}</td>
                                        <td className="px-6 py-4 text-gray-700">{record.prepared} {record.unit}</td>
                                        <td className="px-6 py-4 text-gray-700">{record.consumed} {record.unit}</td>
                                        <td className="px-6 py-4 font-semibold text-red-600">{record.calculatedLeftover} {record.unit}</td>
                                        <td className="px-6 py-4 text-gray-700">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.wastePercentage > 15 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                {record.wastePercentage}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {records.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            No records logged for this event.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}