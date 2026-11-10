import { useEffect, useState } from "react";
import { fetchUserEvents } from "../../services/eventService";
import { createQuotation, getQuotationsByEvent } from "../../services/quotationService";
import "./QuotationsPage.css";

interface QuotationItem {
  id: number;
  ingredientName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  lineTotal: number;
}

interface Quotation {
  id: number;
  eventId: number;
  totalCost: number;
  createdAt: string;
  items: QuotationItem[];
}

export default function QuotationsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUserEvents().then(setEvents).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setQuotations([]);
      return;
    }
    loadQuotations(selectedEventId);
  }, [selectedEventId]);

  const loadQuotations = async (eventId: string) => {
    setIsLoading(true);
    try {
      const data = await getQuotationsByEvent(eventId);
      setQuotations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedEventId) return;
    setError("");
    setIsLoading(true);
    try {
      await createQuotation(selectedEventId);
      await loadQuotations(selectedEventId);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to generate quotation.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <div className="quotations-page">
      <div className="quotations-heading no-print">
        <div>
          <h2>Quotations Management</h2>
          <p>Generate precise, recipe-backed cost quotations for your events.</p>
        </div>
      </div>

      <div className="quotation-form-section no-print">
        <div className="section-title-row">
          <h3>Generate Quotation</h3>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Select Event</label>
            <select 
              value={selectedEventId} 
              onChange={(e) => { setSelectedEventId(e.target.value); setError(""); }}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
            >
              <option value="">-- Choose an Event --</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name} ({new Date(ev.eventDate).toLocaleDateString()})</option>
              ))}
            </select>
          </div>
          <button 
            className="create-quotation-btn" 
            onClick={handleGenerate} 
            disabled={!selectedEventId || isLoading}
          >
            {isLoading ? "Generating..." : "Generate New Quotation"}
          </button>
        </div>
        {error && <p style={{ color: "#dc2626", marginTop: "15px" }}>{error}</p>}
      </div>

      {quotations.length > 0 ? (
        <div className="quotation-list-section">
          <h3>Event Quotation History</h3>
          {quotations.map((q) => (
            <div key={q.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginBottom: '20px', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                <div>
                  <strong>Quotation #{q.id}</strong>
                  <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#666' }}>Generated: {new Date(q.createdAt).toLocaleString()}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', color: '#666' }}>Total Estimated Cost</span>
                  <h3 style={{ margin: '5px 0 0', color: '#2563eb' }}>{formatCurrency(q.totalCost)}</h3>
                </div>
              </div>
              <table className="quotations-table" style={{ width: '100%', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '10px' }}>Ingredient</th>
                    <th style={{ padding: '10px' }}>Quantity Required</th>
                    <th style={{ padding: '10px' }}>Price / Unit</th>
                    <th style={{ padding: '10px' }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {q.items.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{item.ingredientName}</td>
                      <td style={{ padding: '10px' }}>{item.quantity.toFixed(2)} {item.unit}</td>
                      <td style={{ padding: '10px' }}>{formatCurrency(item.pricePerUnit)}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{formatCurrency(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : (
        selectedEventId && !isLoading && (
          <div className="quotation-empty-state">
            <p>No quotations generated for this event yet.</p>
          </div>
        )
      )}
    </div>
  );
}