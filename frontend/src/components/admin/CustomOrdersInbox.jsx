import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api.js";
import { getImageUrl } from "../../utils/imageUrl.js";
import { EmptyState, SectionHeader, StatusPill, formatDate, formatMoney, useAdmin } from "./AdminUI.jsx";

const STATUSES = [
    { key: "new", label: "New", tone: "warn" },
    { key: "quoted", label: "Quoted", tone: "info" },
    { key: "approved", label: "Approved", tone: "warn" },
    { key: "in_progress", label: "Crocheting", tone: "info" },
    { key: "ready", label: "Ready", tone: "info" },
    { key: "shipped", label: "Shipped", tone: "info" },
    { key: "completed", label: "Delivered", tone: "ok" },
    { key: "quote_declined", label: "Quote declined", tone: "neutral" },
    { key: "declined", label: "Turned down", tone: "neutral" },
];
const BY_KEY = Object.fromEntries(STATUSES.map((s) => [s.key, s]));
const CLOSED = ["completed", "quote_declined", "declined"];
const QUOTABLE = ["new", "quoted", "quote_declined"];
// The customer gets an email when a request moves to one of these (see CustomOrderController).
const EMAILED = ["in_progress", "ready", "shipped", "completed", "declined"];

const BUDGETS = {
    "under-30": "Under $30",
    "30-75": "$30 – $75",
    "75-150": "$75 – $150",
    "150-plus": "$150+",
};

const statusUrl = (token) => `${window.location.origin}/custom-order/${token}`;

function CapacityPanel({ capacity, onSaved }) {
    const { notify } = useAdmin();
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api("/api/settings")
            .then((s) =>
                setForm({
                    custom_hours_per_week: s.custom_hours_per_week || "",
                    custom_booking_weeks: s.custom_booking_weeks || "6",
                    custom_default_hours: s.custom_default_hours || "6",
                })
            )
            .catch(() => {});
    }, []);

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api("/api/settings", { method: "PUT", body: form });
            notify("Capacity saved");
            onSaved();
        } catch (err) {
            notify(err.message, "bad");
        } finally {
            setSaving(false);
        }
    };

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
    const used = capacity?.limit_hours ? Math.min(100, (capacity.booked_hours / capacity.limit_hours) * 100) : 0;

    return (
        <section className="admin-panel admin-capacity">
            <div className="admin-capacity__summary">
                <h2 className="admin-panel__title">Capacity</h2>
                {!capacity ? null : capacity.limited ? (
                    <>
                        <p>
                            <strong>{capacity.booked_hours}</strong> of {capacity.limit_hours} hours booked, about{" "}
                            {capacity.weeks_out} week{capacity.weeks_out === 1 ? "" : "s"} of work.{" "}
                            {capacity.open ? (
                                <StatusPill tone="ok">Taking requests</StatusPill>
                            ) : (
                                <StatusPill tone="bad">Full: the form is closed</StatusPill>
                            )}
                        </p>
                        <div className="admin-capacity__meter" role="img" aria-label={`${Math.round(used)}% booked`}>
                            <span style={{ width: `${used}%` }} />
                        </div>
                    </>
                ) : (
                    <p className="admin-muted">
                        No limit set: requests are always accepted. {capacity.booked_hours} hours of work are queued.
                    </p>
                )}
                <p className="admin-field__hint">
                    Requests that are new, quoted, approved or being crocheted hold a place. Quoted ones count the hours in
                    their quote; new ones count the typical hours per piece.
                </p>
            </div>
            {form && (
                <form className="admin-capacity__form" onSubmit={save}>
                    <label className="admin-field">
                        <span className="admin-field__label">Hours a week for custom work</span>
                        <input type="number" min="0" step="0.5" value={form.custom_hours_per_week} onChange={set("custom_hours_per_week")} placeholder="No limit" />
                    </label>
                    <label className="admin-field">
                        <span className="admin-field__label">Book up to (weeks ahead)</span>
                        <input type="number" min="1" step="1" value={form.custom_booking_weeks} onChange={set("custom_booking_weeks")} />
                    </label>
                    <label className="admin-field">
                        <span className="admin-field__label">Typical hours per piece</span>
                        <input type="number" min="0.5" step="0.5" value={form.custom_default_hours} onChange={set("custom_default_hours")} />
                    </label>
                    <button type="submit" className="admin-btn admin-btn--small" disabled={saving}>
                        {saving ? "Saving…" : "Save"}
                    </button>
                </form>
            )}
        </section>
    );
}

function QuoteForm({ request, onSaved }) {
    const { notify } = useAdmin();
    const [form, setForm] = useState({
        price: request.quote_cents != null ? (request.quote_cents / 100).toFixed(2) : "",
        ready_by: request.quote_ready_by ? String(request.quote_ready_by).slice(0, 10) : "",
        hours: request.quote_hours != null ? String(request.quote_hours) : "",
        message: request.quote_message || "",
    });
    const [sending, setSending] = useState(false);
    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const send = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            const saved = await api(`/api/custom-orders/${request.id}/quote`, {
                method: "POST",
                body: {
                    quote_cents: Math.round(Number(form.price) * 100),
                    quote_ready_by: form.ready_by,
                    quote_hours: form.hours === "" ? null : Number(form.hours),
                    quote_message: form.message,
                },
            });
            onSaved(saved);
            notify(saved.customer_notified === "sent" ? "Quote sent to the customer" : "Quote saved, but the email didn't go out", saved.customer_notified === "sent" ? "ok" : "bad");
        } catch (err) {
            notify(err.message, "bad");
        } finally {
            setSending(false);
        }
    };

    return (
        <form className="admin-quote" onSubmit={send}>
            <div className="admin-quote__grid">
                <label className="admin-field">
                    <span className="admin-field__label">Price ($)</span>
                    <input type="number" min="0.01" step="0.01" value={form.price} onChange={set("price")} required />
                </label>
                <label className="admin-field">
                    <span className="admin-field__label">Ready by</span>
                    <input type="date" value={form.ready_by} onChange={set("ready_by")} required />
                </label>
                <label className="admin-field">
                    <span className="admin-field__label">Hours of work</span>
                    <input type="number" min="0.5" step="0.5" value={form.hours} onChange={set("hours")} placeholder="For capacity" />
                </label>
            </div>
            <label className="admin-field">
                <span className="admin-field__label">Message to the customer (optional)</span>
                <textarea rows={2} value={form.message} onChange={set("message")} maxLength={2000} placeholder="What's included, yarn you'll use, anything you changed…" />
            </label>
            <div className="admin-row">
                <button type="submit" className="admin-btn admin-btn--small" disabled={sending}>
                    {sending ? "Sending…" : request.status === "new" ? "Send quote" : "Send new quote"}
                </button>
            </div>
        </form>
    );
}

function Request({ request, onChange, onDelete }) {
    const { notify } = useAdmin();
    const [notes, setNotes] = useState(request.admin_notes || "");

    const patch = async (body, message) => {
        try {
            const saved = await api(`/api/custom-orders/${request.id}`, { method: "PATCH", body });
            onChange(saved);
            if (saved.customer_notified === "failed") notify(`${message}, but the email to the customer failed`, "bad");
            else if (message) notify(saved.customer_notified === "sent" ? `${message}. Customer emailed.` : message);
        } catch (err) {
            notify(err.message, "bad");
        }
    };

    const status = BY_KEY[request.status] || BY_KEY.new;
    const quoted = request.quote_cents != null;

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
                {request.yarn_type && (
                    <div>
                        <dt>Yarn</dt>
                        <dd>{request.yarn_type}</dd>
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
                        <dt>Wanted by</dt>
                        <dd>{formatDate(request.deadline)}</dd>
                    </div>
                )}
                {request.shipping_address && (
                    <div>
                        <dt>Deliver to</dt>
                        <dd>{request.shipping_address}</dd>
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

            {quoted && (
                <p className="admin-request__extra">
                    <strong>Quote:</strong> {formatMoney(request.quote_cents)}, ready by {formatDate(request.quote_ready_by)}
                    {request.quote_hours != null && <>, {request.quote_hours} h of work</>}
                    {request.status === "quoted" && <> · sent {formatDate(request.quoted_at)}, waiting for the customer</>}
                    {request.status === "quote_declined" && <> · declined {formatDate(request.responded_at)}</>}
                    {!QUOTABLE.includes(request.status) && request.responded_at && <> · approved {formatDate(request.responded_at)}</>}
                </p>
            )}
            {request.decline_reason && (
                <p className="admin-request__extra">
                    <strong>Why they declined:</strong> {request.decline_reason}
                </p>
            )}

            {QUOTABLE.includes(request.status) && <QuoteForm request={request} onSaved={onChange} />}

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
                                {EMAILED.includes(s.key) ? " (emails customer)" : ""}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="admin-field admin-request__notes">
                    <span className="admin-field__label">Private notes (yarn, progress…)</span>
                    <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        onBlur={() => notes !== (request.admin_notes || "") && patch({ admin_notes: notes }, "Notes saved")}
                    />
                </label>
                <div className="admin-row">
                    {request.access_token && (
                        <a className="admin-btn admin-btn--small admin-btn--ghost" href={statusUrl(request.access_token)} target="_blank" rel="noopener noreferrer">
                            Customer's page
                        </a>
                    )}
                    <a className="admin-btn admin-btn--small admin-btn--ghost" href={`mailto:${request.email}?subject=${encodeURIComponent("Your Strand custom order")}`}>
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
    const [capacity, setCapacity] = useState(null);
    const [filter, setFilter] = useState("open");

    const loadCapacity = useCallback(() => {
        api("/api/custom-orders/capacity").then(setCapacity).catch(() => {});
    }, []);

    useEffect(() => {
        api("/api/custom-orders")
            .then(setRequests)
            .catch((err) => {
                notify(err.message, "bad");
                setRequests([]);
            });
        loadCapacity();
    }, [notify, loadCapacity]);

    const shown = useMemo(() => {
        const list = requests || [];
        if (filter === "open") return list.filter((r) => !CLOSED.includes(r.status));
        if (filter === "all") return list;
        return list.filter((r) => r.status === filter);
    }, [requests, filter]);

    const onChange = (saved) => {
        setRequests((list) => list.map((r) => (r.id === saved.id ? saved : r)));
        refreshCounts?.();
        loadCapacity();
    };

    const onDelete = async (request) => {
        if (!confirm(`Delete the request from ${request.name}? This can't be undone.`)) return;
        try {
            await api(`/api/custom-orders/${request.id}`, { method: "DELETE" });
            setRequests((list) => list.filter((r) => r.id !== request.id));
            notify("Request deleted");
            refreshCounts?.();
            loadCapacity();
        } catch (err) {
            notify(err.message, "bad");
        }
    };

    const countFor = (key) => {
        const list = requests || [];
        if (key === "open") return list.filter((r) => !CLOSED.includes(r.status)).length;
        if (key === "all") return list.length;
        return list.filter((r) => r.status === key).length;
    };

    return (
        <div>
            <SectionHeader
                title="Custom orders"
                description="Quote each request with a price and finish date. The customer approves or declines from their own page, then follows each step by email."
            />

            <CapacityPanel capacity={capacity} onSaved={loadCapacity} />

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
                        <span>{countFor(t.key)}</span>
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
