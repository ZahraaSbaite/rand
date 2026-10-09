import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api.js";
import { getImageUrl } from "../../utils/imageUrl.js";
import { EmptyState, SectionHeader, StatusPill, formatDate, useAdmin } from "./AdminUI.jsx";

const STATUSES = [
    { key: "new", label: "New", tone: "warn" },
    { key: "quoted", label: "Quoted", tone: "info" },
    { key: "in_progress", label: "In progress", tone: "info" },
    { key: "completed", label: "Completed", tone: "ok" },
    { key: "declined", label: "Declined", tone: "neutral" },
];
const BY_KEY = Object.fromEntries(STATUSES.map((s) => [s.key, s]));

const BUDGETS = {
    "under-30": "Under $30",
    "30-75": "$30 – $75",
    "75-150": "$75 – $150",
};

function Request({ request, onChange, onDelete }) {
    const { notify } = useAdmin();
    const [notes, setNotes] = useState(request.admin_notes || "");

    const patch = async (body, message) => {
        try {
            const saved = await api(`/api/custom-orders/${request.id}`, { method: "PATCH", body });
            onChange(saved);
            if (message) notify(message);
        } catch (err) {
            notify(err.message, "bad");
        }
    };

    const status = BY_KEY[request.status] || BY_KEY.new;

    return (
        <article className="admin-request">
            <header className="admin-request__head">
                <div>
                    <h3>
                        {request.product_type || "Custom piece"} for {request.name}
                    </h3>
                    <p className="admin-muted">
                        #{request.id} · {formatDate(request.created_at)}
                    </p>
                </div>
                <StatusPill tone={status.tone}>{status.label}</StatusPill>
            </header>

            <p className="admin-request__desc">{request.description}</p>

            <dl className="admin-facts">
                <div>
                    <dt>Email</dt>
                    <dd>
                        <a href={`mailto:${request.email}`}>{request.email}</a>
                    </dd>
                </div>
                {request.phone && (
                    <div>
                        <dt>Phone</dt>
                        <dd>
                            <a href={`tel:${request.phone}`}>{request.phone}</a>
                        </dd>
                    </div>
                )}
                {request.preferred_colors && (
                    <div>
                        <dt>Colors</dt>
                        <dd>{request.preferred_colors}</dd>
                    </div>
                )}
                {request.preferred_size && (
                    <div>
                        <dt>Size</dt>
                        <dd>{request.preferred_size}</dd>
                    </div>
                )}
                <div>
                    <dt>Quantity</dt>
                    <dd>{request.quantity || 1}</dd>
                </div>
                {request.budget_range && (
                    <div>
                        <dt>Budget</dt>
                        <dd>{BUDGETS[request.budget_range] || request.budget_range}</dd>
                    </div>
                )}
                {request.deadline && (
                    <div>
                        <dt>Needed by</dt>
                        <dd>{formatDate(request.deadline)}</dd>
                    </div>
                )}
            </dl>

            {request.additional_notes && (
                <p className="admin-request__extra">
                    <strong>Customer notes:</strong> {request.additional_notes}
                </p>
            )}

            {request.inspiration_image_url && (
                <a href={getImageUrl(request.inspiration_image_url)} target="_blank" rel="noopener noreferrer" className="admin-request__image">
                    <img src={getImageUrl(request.inspiration_image_url)} alt="Inspiration from the customer" />
                </a>
            )}

            <div className="admin-request__work">
                <label className="admin-field">
                    <span className="admin-field__label">Status</span>
                    <select
                        value={request.status || "new"}
                        onChange={(e) => patch({ status: e.target.value }, `Marked as ${BY_KEY[e.target.value].label.toLowerCase()}`)}
                    >
                        {STATUSES.map((s) => (
                            <option key={s.key} value={s.key}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="admin-field admin-request__notes">
                    <span className="admin-field__label">Private notes (quote, yarn, dates…)</span>
                    <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        onBlur={() => notes !== (request.admin_notes || "") && patch({ admin_notes: notes }, "Notes saved")}
                    />
                </label>
                <div className="admin-row">
                    <a className="admin-btn admin-btn--small admin-btn--ghost" href={`mailto:${request.email}?subject=${encodeURIComponent("Your RRAND custom order")}`}>
                        Reply by email
                    </a>
                    <button type="button" className="admin-link-btn admin-link-btn--danger" onClick={() => onDelete(request)}>
                        Delete
                    </button>
                </div>
            </div>
        </article>
    );
}

export default function CustomOrdersInbox() {
    const { notify, refreshCounts } = useAdmin();
    const [requests, setRequests] = useState(null);
    const [filter, setFilter] = useState("open");

    useEffect(() => {
        api("/api/custom-orders")
            .then(setRequests)
            .catch((err) => {
                notify(err.message, "bad");
                setRequests([]);
            });
    }, [notify]);

    const shown = useMemo(() => {
        const list = requests || [];
        if (filter === "open") return list.filter((r) => !["completed", "declined"].includes(r.status));
        if (filter === "all") return list;
        return list.filter((r) => r.status === filter);
    }, [requests, filter]);

    const onChange = (saved) => {
        setRequests((list) => list.map((r) => (r.id === saved.id ? saved : r)));
        refreshCounts?.();
    };

    const onDelete = async (request) => {
        if (!confirm(`Delete the request from ${request.name}? This can't be undone.`)) return;
        try {
            await api(`/api/custom-orders/${request.id}`, { method: "DELETE" });
            setRequests((list) => list.filter((r) => r.id !== request.id));
            notify("Request deleted");
            refreshCounts?.();
        } catch (err) {
            notify(err.message, "bad");
        }
    };

    return (
        <div>
            <SectionHeader title="Custom orders" description="Commission requests from the Custom Orders page." />

            <div className="admin-tabs" role="tablist">
                {[{ key: "open", label: "Open" }, ...STATUSES, { key: "all", label: "All" }].map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        role="tab"
                        aria-selected={filter === t.key}
                        className={`admin-tabs__tab${filter === t.key ? " is-active" : ""}`}
                        onClick={() => setFilter(t.key)}
                    >
                        {t.label}
                        <span>
                            {t.key === "open"
                                ? (requests || []).filter((r) => !["completed", "declined"].includes(r.status)).length
                                : t.key === "all"
                                  ? (requests || []).length
                                  : (requests || []).filter((r) => r.status === t.key).length}
                        </span>
                    </button>
                ))}
            </div>

            {requests === null ? (
                <p className="admin-loading">Loading requests…</p>
            ) : shown.length === 0 ? (
                <EmptyState title="Nothing here">Requests from the Custom Orders page will land here.</EmptyState>
            ) : (
                <div className="admin-stack">
                    {shown.map((r) => (
                        <Request key={r.id} request={r} onChange={onChange} onDelete={onDelete} />
                    ))}
                </div>
            )}
        </div>
    );
}
