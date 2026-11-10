import { useEffect, useState } from "react";
import { getAdminWasteReport } from "../../services/reportService";
import "./ReportsPage.css";

interface UnitBreakdown {
  unit: string;
  prepared: number;
  consumed: number;
  waste: number;
  wastePercentage: number;
  recordCount: number;
}

interface WasteReport {
  totalEvents: number;
  totalRecords: number;
  unitBreakdown: UnitBreakdown[];
}

export default function ReportsPage() {
    const [report, setReport] = useState<WasteReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadReport = async () => {
            try {
                const data = await getAdminWasteReport();
                setReport(data);
            } catch (err: any) {
                setError(err.response?.data?.message || "Failed to load admin waste report.");
            } finally {
                setIsLoading(false);
            }
        };
        loadReport();
    }, []);

    if (isLoading) return <div style={{ padding: "30px" }}>Compiling business reports...</div>;
    if (error) return <div style={{ padding: "30px", color: "red" }}>{error}</div>;
    if (!report) return null;

    return (
        <div className="reports-page">
            <div className="reports-heading">
                <div>
                    <h1>Business Reports & Analytics</h1>
                    <p>Live, aggregated waste reporting across all company events.</p>
                </div>
            </div>

            <div className="reports-kpi-grid">
                <div className="reports-kpi">
                    <span>Events Tracked</span>
                    <h3>{report.totalEvents}</h3>
                    <small>Events with consumption data</small>
                </div>
                <div className="reports-kpi">
                    <span>Total Dish Records</span>
                    <h3>{report.totalRecords}</h3>
                    <small>Total consumption logs</small>
                </div>
            </div>

            <section className="reports-panel" style={{ marginTop: '30px' }}>
                <div className="reports-panel-heading">
                    <div>
                        <h2>Global Food Waste Analysis</h2>
                        <p>Aggregated waste metrics grouped by unit.</p>
                    </div>
                </div>

                <div className="reports-table-wrapper">
                    <table className="reports-table">
                        <thead>
                            <tr>
                                <th>Unit Type</th>
                                <th>Total Prepared</th>
                                <th>Total Consumed</th>
                                <th>Total Wasted</th>
                                <th>Waste Percentage</th>
                                <th>Sample Size</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.unitBreakdown.map((item, index) => (
                                <tr key={index}>
                                    <td><strong>{item.unit}</strong></td>
                                    <td>{item.prepared}</td>
                                    <td>{item.consumed}</td>
                                    <td>
                                        <strong style={{ color: item.waste > 0 ? '#dc2626' : '#16a34a' }}>
                                            {item.waste}
                                        </strong>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span>{item.wastePercentage}%</span>
                                            <div style={{ height: '6px', width: '100px', background: '#eef0f3', borderRadius: '10px' }}>
                                                <div style={{ height: '100%', width: `${Math.min(item.wastePercentage, 100)}%`, background: item.wastePercentage > 15 ? '#ef4444' : '#f59e0b', borderRadius: '10px' }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td>{item.recordCount} logs</td>
                                </tr>
                            ))}
                            {report.unitBreakdown.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="reports-empty">No consumption data has been logged yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}