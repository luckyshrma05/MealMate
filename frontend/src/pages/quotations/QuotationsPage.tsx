
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
    Plus,
    Search,
    Eye,
    Pencil,
    Trash2,
    Printer,
    ArrowLeft,
    X,
} from "lucide-react";
import "./QuotationsPage.css";

type QuotationStatus = "Draft" | "Sent" | "Accepted" | "Rejected";

type MenuItem = {
    id: number;
    name: string;
    quantity: number;
    rate: number;
};

type Quotation = {
    id: number;
    quotationNumber: string;
    customerName: string;
    phone: string;
    eventType: string;
    eventDate: string;
    venue: string;
    guests: number;
    notes: string;
    items: MenuItem[];
    status: QuotationStatus;
    createdAt: string;
};

type QuotationForm = {
    customerName: string;
    phone: string;
    eventType: string;
    eventDate: string;
    venue: string;
    guests: string;
    notes: string;
    items: MenuItem[];
};

const STORAGE_KEY = "mealmate_quotations";

const emptyForm: QuotationForm = {
    customerName: "",
    phone: "",
    eventType: "",
    eventDate: "",
    venue: "",
    guests: "",
    notes: "",
    items: [
        {
            id: Date.now(),
            name: "",
            quantity: 1,
            rate: 0,
        },
    ],
};

const statuses: QuotationStatus[] = [
    "Draft",
    "Sent",
    "Accepted",
    "Rejected",
];

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatDate(date: string) {
    if (!date) return "—";

    return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function QuotationsPage() {
    // Load quotations from localStorage.
    const [quotations, setQuotations] = useState<Quotation[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const parsed = saved ? JSON.parse(saved) : [];

            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const [formData, setFormData] =
        useState<QuotationForm>(emptyForm);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [error, setError] = useState("");

    // Persist quotations.
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(quotations));
    }, [quotations]);

    // Calculate quotation totals.
    const getTotal = (items: MenuItem[]) =>
        items.reduce(
            (total, item) => total + item.quantity * item.rate,
            0
        );

    const totalQuotations = quotations.length;

    const acceptedQuotations = quotations.filter(
        (q) => q.status === "Accepted"
    ).length;

    const pendingQuotations = quotations.filter(
        (q) => q.status === "Draft" || q.status === "Sent"
    ).length;

    const totalBusinessValue = quotations
        .filter((q) => q.status === "Accepted")
        .reduce((total, q) => total + getTotal(q.items), 0);

    // Search and filter.
    const filteredQuotations = useMemo(() => {
        return quotations.filter((q) => {
            const search = searchTerm.toLowerCase();

            const matchesSearch =
                q.customerName.toLowerCase().includes(search) ||
                q.quotationNumber.toLowerCase().includes(search) ||
                q.phone.includes(search);

            const matchesStatus =
                statusFilter === "All" || q.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [quotations, searchTerm, statusFilter]);

    const selectedQuotation = quotations.find(
        (q) => q.id === selectedId
    );

    // Form helpers.
    const resetForm = () => {
        setFormData({
            ...emptyForm,
            items: [{ id: Date.now(), name: "", quantity: 1, rate: 0 }],
        });
        setEditingId(null);
        setShowForm(false);
        setError("");
    };

    const handleCreate = () => {
        setSelectedId(null);
        setEditingId(null);
        setFormData({
            ...emptyForm,
            items: [{ id: Date.now(), name: "", quantity: 1, rate: 0 }],
        });
        setError("");
        setShowForm(true);
    };

    const updateField = (
        field: keyof Omit<QuotationForm, "items">,
        value: string
    ) => {
        setFormData((previous) => ({
            ...previous,
            [field]: value,
        }));

        setError("");
    };

    // Menu item management.
    const addMenuItem = () => {
        setFormData((previous) => ({
            ...previous,
            items: [
                ...previous.items,
                {
                    id: Date.now() + previous.items.length,
                    name: "",
                    quantity: 1,
                    rate: 0,
                },
            ],
        }));
    };

    const updateMenuItem = (
        id: number,
        field: keyof Omit<MenuItem, "id">,
        value: string
    ) => {
        setFormData((previous) => ({
            ...previous,
            items: previous.items.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        [field]:
                            field === "name" ? value : Number(value),
                    }
                    : item
            ),
        }));

        setError("");
    };

    const removeMenuItem = (id: number) => {
        setFormData((previous) => ({
            ...previous,
            items: previous.items.filter((item) => item.id !== id),
        }));
    };

    // Create or update quotation.
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        const guests = Number(formData.guests);

        if (
            !formData.customerName.trim() ||
            !formData.phone.trim() ||
            !formData.eventType ||
            !formData.eventDate ||
            !formData.venue.trim()
        ) {
            setError("Please complete all customer and event details.");
            return;
        }

        if (!Number.isInteger(guests) || guests <= 0) {
            setError("Please enter a valid number of guests.");
            return;
        }

        if (formData.items.length === 0) {
            setError("Please add at least one menu item.");
            return;
        }

        const invalidItem = formData.items.some(
            (item) =>
                !item.name.trim() ||
                !Number.isFinite(item.quantity) ||
                !Number.isFinite(item.rate) ||
                item.quantity <= 0 ||
                item.rate <= 0
        );

        if (invalidItem) {
            setError(
                "Each menu item needs a name, quantity and selling rate greater than zero."
            );
            return;
        }

        const cleanedItems = formData.items.map((item) => ({
            ...item,
            name: item.name.trim(),
        }));

        if (editingId !== null) {
            setQuotations((previous) =>
                previous.map((q) =>
                    q.id === editingId
                        ? {
                            ...q,
                            customerName: formData.customerName.trim(),
                            phone: formData.phone.trim(),
                            eventType: formData.eventType,
                            eventDate: formData.eventDate,
                            venue: formData.venue.trim(),
                            guests,
                            notes: formData.notes.trim(),
                            items: cleanedItems,
                        }
                        : q
                )
            );

            setSelectedId(editingId);
        } else {
            const newQuotation: Quotation = {
                id: Date.now(),
                quotationNumber: `MM-${Date.now().toString().slice(-8)}`,
                customerName: formData.customerName.trim(),
                phone: formData.phone.trim(),
                eventType: formData.eventType,
                eventDate: formData.eventDate,
                venue: formData.venue.trim(),
                guests,
                notes: formData.notes.trim(),
                items: cleanedItems,
                status: "Draft",
                createdAt: new Date().toISOString(),
            };

            setQuotations((previous) => [
                newQuotation,
                ...previous,
            ]);

            setSelectedId(newQuotation.id);
        }

        resetForm();
    };

    // Edit quotation.
    const handleEdit = (quotation: Quotation) => {
        setFormData({
            customerName: quotation.customerName,
            phone: quotation.phone,
            eventType: quotation.eventType,
            eventDate: quotation.eventDate,
            venue: quotation.venue,
            guests: String(quotation.guests),
            notes: quotation.notes,
            items: quotation.items.map((item) => ({ ...item })),
        });

        setEditingId(quotation.id);
        setSelectedId(null);
        setShowForm(true);
        setError("");

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Delete quotation.
    const handleDelete = (quotation: Quotation) => {
        const confirmed = window.confirm(
            `Delete quotation ${quotation.quotationNumber} for ${quotation.customerName}?`
        );

        if (!confirmed) return;

        setQuotations((previous) =>
            previous.filter((q) => q.id !== quotation.id)
        );

        if (selectedId === quotation.id) {
            setSelectedId(null);
        }

        if (editingId === quotation.id) {
            resetForm();
        }
    };

    // Update status.
    const updateStatus = (
        id: number,
        status: QuotationStatus
    ) => {
        setQuotations((previous) =>
            previous.map((q) =>
                q.id === id ? { ...q, status } : q
            )
        );
    };

    // Print selected quotation.
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="quotations-page">

            {/* Page Heading */}
            <div className="quotations-heading no-print">
                <div>
                    <h2>Quotations Management</h2>
                    <p>
                        Create and manage customer catering quotations.
                    </p>
                </div>

                <button
                    className="create-quotation-btn"
                    onClick={handleCreate}
                >
                    <Plus size={18} />
                    Create Quotation
                </button>
            </div>

            {/* Statistics */}
            <div className="quotation-summary no-print">

                <div className="quotation-stat-card">
                    <span>Total Quotations</span>
                    <h3>{totalQuotations}</h3>
                </div>

                <div className="quotation-stat-card">
                    <span>Pending Quotations</span>
                    <h3>{pendingQuotations}</h3>
                </div>

                <div className="quotation-stat-card">
                    <span>Accepted Quotations</span>
                    <h3>{acceptedQuotations}</h3>
                </div>

                <div className="quotation-stat-card">
                    <span>Accepted Business Value</span>
                    <h3>{formatCurrency(totalBusinessValue)}</h3>
                </div>

            </div>

            {/* Create / Edit Form */}
            {showForm && (
                <div className="quotation-form-section no-print">

                    <div className="section-title-row">
                        <h3>
                            {editingId !== null
                                ? "Edit Quotation"
                                : "Create New Quotation"}
                        </h3>

                        <button
                            type="button"
                            className="close-form-btn"
                            onClick={resetForm}
                            aria-label="Close form"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>

                        <h4>Customer Information</h4>

                        <div className="quotation-form-grid">

                            <div className="quotation-form-group">
                                <label>Customer Name *</label>
                                <input
                                    type="text"
                                    placeholder="Enter customer name"
                                    value={formData.customerName}
                                    onChange={(e) =>
                                        updateField("customerName", e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="quotation-form-group">
                                <label>Contact Number *</label>
                                <input
                                    type="tel"
                                    placeholder="Enter phone number"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        updateField("phone", e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="quotation-form-group">
                                <label>Event Type *</label>
                                <select
                                    value={formData.eventType}
                                    onChange={(e) =>
                                        updateField("eventType", e.target.value)
                                    }
                                    required
                                >
                                    <option value="">Select Event Type</option>
                                    <option value="Wedding">Wedding</option>
                                    <option value="Birthday">Birthday</option>
                                    <option value="Corporate Event">Corporate Event</option>
                                    <option value="Engagement">Engagement</option>
                                    <option value="Reception">Reception</option>
                                    <option value="Private Party">Private Party</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="quotation-form-group">
                                <label>Event Date *</label>
                                <input
                                    type="date"
                                    value={formData.eventDate}
                                    onChange={(e) =>
                                        updateField("eventDate", e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="quotation-form-group">
                                <label>Event Venue *</label>
                                <input
                                    type="text"
                                    placeholder="Enter event venue"
                                    value={formData.venue}
                                    onChange={(e) =>
                                        updateField("venue", e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="quotation-form-group">
                                <label>Number of Guests *</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="Enter guest count"
                                    value={formData.guests}
                                    onChange={(e) =>
                                        updateField("guests", e.target.value)
                                    }
                                    required
                                />
                            </div>

                        </div>

                        {/* Menu Items */}
                        <div className="menu-items-heading">
                            <div>
                                <h4>Menu & Pricing Details</h4>
                                <p>
                                    Enter the selling quantity and rate for
                                    each menu item.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="add-menu-item-btn"
                                onClick={addMenuItem}
                            >
                                <Plus size={16} />
                                Add Menu Item
                            </button>
                        </div>

                        <div className="menu-item-list">

                            {formData.items.map((item, index) => (
                                <div className="menu-item-row" key={item.id}>

                                    <div className="menu-item-name">
                                        <label>Menu Item {index + 1}</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Paneer Tikka"
                                            value={item.name}
                                            onChange={(e) =>
                                                updateMenuItem(
                                                    item.id,
                                                    "name",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label>Quantity / Plates</label>
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={item.quantity}
                                            onChange={(e) =>
                                                updateMenuItem(
                                                    item.id,
                                                    "quantity",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label>Rate (₹)</label>
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={item.rate || ""}
                                            placeholder="Enter rate"
                                            onChange={(e) =>
                                                updateMenuItem(
                                                    item.id,
                                                    "rate",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="menu-item-total">
                                        <label>Amount</label>
                                        <strong>
                                            {formatCurrency(
                                                item.quantity * item.rate
                                            )}
                                        </strong>
                                    </div>

                                    <button
                                        type="button"
                                        className="remove-menu-item-btn"
                                        onClick={() => removeMenuItem(item.id)}
                                        disabled={formData.items.length === 1}
                                        title="Remove menu item"
                                    >
                                        <Trash2 size={17} />
                                    </button>

                                </div>
                            ))}

                        </div>

                        {/* Total */}
                        <div className="quotation-form-total">
                            <span>Quotation Total</span>
                            <strong>
                                {formatCurrency(getTotal(formData.items))}
                            </strong>
                        </div>

                        <div className="quotation-form-group notes-group">
                            <label>Additional Notes</label>
                            <textarea
                                rows={3}
                                placeholder="Enter additional requirements or terms..."
                                value={formData.notes}
                                onChange={(e) =>
                                    updateField("notes", e.target.value)
                                }
                            />
                        </div>

                        {error && (
                            <p className="quotation-error" role="alert">
                                {error}
                            </p>
                        )}

                        <div className="quotation-form-actions">

                            <button
                                type="button"
                                className="quotation-cancel-btn"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="create-quotation-btn"
                            >
                                {editingId !== null
                                    ? "Update Quotation"
                                    : "Save Quotation"}
                            </button>

                        </div>

                    </form>
                </div>
            )}

            {/* Selected Quotation Details */}
            {selectedQuotation && !showForm && (
                <div className="quotation-detail-section">

                    <div className="detail-actions no-print">
                        <button
                            className="back-to-list-btn"
                            onClick={() => setSelectedId(null)}
                        >
                            <ArrowLeft size={16} />
                            Back to Quotations
                        </button>

                        <div>
                            <button
                                className="detail-edit-btn"
                                onClick={() => handleEdit(selectedQuotation)}
                            >
                                <Pencil size={16} />
                                Edit
                            </button>

                            <button
                                className="detail-print-btn"
                                onClick={handlePrint}
                            >
                                <Printer size={16} />
                                Print
                            </button>
                        </div>
                    </div>

                    <div className="quotation-print-area">

                        <div className="print-header">
                            <h1>MEALMATE</h1>
                            <p>Catering & Event Management</p>
                            <h2>CUSTOMER QUOTATION</h2>
                        </div>

                        <div className="print-quotation-meta">
                            <div>
                                <span>Quotation Number</span>
                                <strong>{selectedQuotation.quotationNumber}</strong>
                            </div>

                            <div>
                                <span>Created On</span>
                                <strong>
                                    {formatDate(
                                        selectedQuotation.createdAt.slice(0, 10)
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Status</span>
                                <strong>{selectedQuotation.status}</strong>
                            </div>
                        </div>

                        <h3>Customer & Event Details</h3>

                        <div className="print-customer-grid">
                            <p>
                                <span>Customer:</span>
                                {selectedQuotation.customerName}
                            </p>
                            <p>
                                <span>Contact:</span>
                                {selectedQuotation.phone}
                            </p>
                            <p>
                                <span>Event:</span>
                                {selectedQuotation.eventType}
                            </p>
                            <p>
                                <span>Date:</span>
                                {formatDate(selectedQuotation.eventDate)}
                            </p>
                            <p>
                                <span>Venue:</span>
                                {selectedQuotation.venue}
                            </p>
                            <p>
                                <span>Guests:</span>
                                {selectedQuotation.guests}
                            </p>
                        </div>

                        <h3>Menu & Price Details</h3>

                        <div className="table-wrapper">
                            <table className="quotation-detail-table">
                                <thead>
                                    <tr>
                                        <th>Menu Item</th>
                                        <th>Quantity</th>
                                        <th>Rate</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {selectedQuotation.items.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.name}</td>
                                            <td>{item.quantity}</td>
                                            <td>{formatCurrency(item.rate)}</td>
                                            <td>
                                                {formatCurrency(
                                                    item.quantity * item.rate
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="print-grand-total">
                            <span>Grand Total</span>
                            <strong>
                                {formatCurrency(
                                    getTotal(selectedQuotation.items)
                                )}
                            </strong>
                        </div>

                        {selectedQuotation.notes && (
                            <div className="print-notes">
                                <h3>Additional Notes</h3>
                                <p>{selectedQuotation.notes}</p>
                            </div>
                        )}

                        <div className="print-footer">
                            <p>Thank you for considering MealMate!</p>
                            <p>We look forward to serving you.</p>
                        </div>

                    </div>
                </div>
            )}

            {/* Quotations List */}
            {!selectedQuotation && !showForm && (
                <div className="quotation-list-section no-print">

                    <div className="quotation-list-heading">
                        <h3>All Quotations</h3>
                        <span>
                            {filteredQuotations.length} Records
                        </span>
                    </div>

                    <div className="quotation-filters">

                        <div className="quotation-search">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search customer or quotation number..."
                                value={searchTerm}
                                onChange={(e) =>
                                    setSearchTerm(e.target.value)
                                }
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value)
                            }
                        >
                            <option value="All">All Statuses</option>
                            {statuses.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>

                    </div>

                    {filteredQuotations.length === 0 ? (
                        <div className="quotation-empty-state">
                            <h3>No Quotations Found</h3>
                            <p>
                                {quotations.length === 0
                                    ? "Create your first customer quotation to get started."
                                    : "Try changing your search or status filter."}
                            </p>

                            {quotations.length === 0 && (
                                <button
                                    className="create-quotation-btn"
                                    onClick={handleCreate}
                                >
                                    <Plus size={17} />
                                    Create First Quotation
                                </button>
                            )}
                        </div>
                    ) : (

                        <div className="table-wrapper">
                            <table className="quotations-table">

                                <thead>
                                    <tr>
                                        <th>Quotation ID</th>
                                        <th>Customer</th>
                                        <th>Event Date</th>
                                        <th>Guests</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredQuotations.map((quotation) => (
                                        <tr key={quotation.id}>

                                            <td className="quotation-id">
                                                {quotation.quotationNumber}
                                            </td>

                                            <td>
                                                <strong>
                                                    {quotation.customerName}
                                                </strong>
                                                <small>{quotation.phone}</small>
                                            </td>

                                            <td>
                                                {formatDate(quotation.eventDate)}
                                            </td>

                                            <td>{quotation.guests}</td>

                                            <td className="quotation-amount">
                                                {formatCurrency(
                                                    getTotal(quotation.items)
                                                )}
                                            </td>

                                            <td>
                                                <select
                                                    className={`status-select status-${quotation.status.toLowerCase()}`}
                                                    value={quotation.status}
                                                    onChange={(e) =>
                                                        updateStatus(
                                                            quotation.id,
                                                            e.target.value as QuotationStatus
                                                        )
                                                    }
                                                >
                                                    {statuses.map((status) => (
                                                        <option
                                                            key={status}
                                                            value={status}
                                                        >
                                                            {status}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td>
                                                <div className="quotation-row-actions">

                                                    <button
                                                        title="View"
                                                        onClick={() =>
                                                            setSelectedId(quotation.id)
                                                        }
                                                    >
                                                        <Eye size={16} />
                                                    </button>

                                                    <button
                                                        title="Edit"
                                                        onClick={() =>
                                                            handleEdit(quotation)
                                                        }
                                                    >
                                                        <Pencil size={16} />
                                                    </button>

                                                    <button
                                                        title="Delete"
                                                        className="row-delete-btn"
                                                        onClick={() =>
                                                            handleDelete(quotation)
                                                        }
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>

                                                </div>
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>

                            </table>
                        </div>
                    )}

                </div>
            )}

        </div>
    );
}

export default QuotationsPage;
