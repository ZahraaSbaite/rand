import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { EmptyState, SectionHeader, StatusPill, formatDate, useAdmin } from "./AdminUI.jsx";

export default function ReviewsManager() {
    const { notify, refreshCounts } = useAdmin();
    const [reviews, setReviews] = useState(null);
    const [filter, setFilter] = useState("pending");

    useEffect(() => {
        api("/api/reviews/admin")
            .then(setReviews)
            .catch((err) => {
                notify(err.message, "bad");
                setReviews([]);
            });
    }, [notify]);

    const setApproved = async (r, approved) => {
        try {
            await api(`/api/reviews/${r.id}/${approved ? "approve" : "unapprove"}`, { method: "PATCH" });
            setReviews((list) => list.map((x) => (x.id === r.id ? { ...x, approved } : x)));
            notify(approved ? "Review published" : "Review hidden");
            refreshCounts?.();
        } catch (err) {
            notify(err.message, "bad");
        }
    };

    const remove = async (r) => {
        if (!confirm(`Delete ${r.customer_name}'s review? This can't be undone.`)) return;
        try {
            await api(`/api/reviews/${r.id}`, { method: "DELETE" });
            setReviews((list) => list.filter((x) => x.id !== r.id));
            notify("Review deleted");
            refreshCounts?.();
        } catch (err) {
            notify(err.message, "bad");
        }
    };

    const pending = (reviews || []).filter((r) => !r.approved);
    const shown = filter === "pending" ? pending : filter === "published" ? (reviews || []).filter((r) => r.approved) : reviews || [];

    return (
        <div>
            <SectionHeader
                title="Reviews"
                description="Customers leave reviews on product pages. Nothing shows on the site until you publish it."
            />

            <div className="admin-tabs" role="tablist">
                {[
                    ["pending", "Waiting", pending.length],
                    ["published", "Published", (reviews || []).length - pending.length],
                    ["all", "All", (reviews || []).length],
                ].map(([key, label, n]) => (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={filter === key}
                        className={`admin-tabs__tab${filter === key ? " is-active" : ""}`}
                        onClick={() => setFilter(key)}
                    >
                        {label} <span>{n}</span>
                    </button>
                ))}
            </div>

            {reviews === null ? (
                <p className="admin-loading">Loading reviews…</p>
            ) : shown.length === 0 ? (
                <EmptyState title={filter === "pending" ? "No reviews waiting" : "No reviews yet"} />
            ) : (
                <div className="admin-stack">
                    {shown.map((r) => (
                        <article key={r.id} className="admin-review">
                            <header className="admin-review__head">
                                <span className="admin-review__stars" aria-label={`${r.rating} out of 5`}>
                                    {"★".repeat(r.rating)}
                                    <span className="admin-muted">{"★".repeat(5 - r.rating)}</span>
                                </span>
                                <StatusPill tone={r.approved ? "ok" : "warn"}>{r.approved ? "Published" : "Waiting"}</StatusPill>
                            </header>
                            <p className="admin-review__comment">{r.comment}</p>
                            <p className="admin-muted">
                                {r.customer_name} (<a href={`mailto:${r.customer_email}`}>{r.customer_email}</a>) on{" "}
                                <strong>{r.product_name}</strong> · {formatDate(r.created_at)}
                            </p>
                            <div className="admin-row">
                                {r.approved ? (
                                    <button type="button" className="admin-btn admin-btn--small admin-btn--ghost" onClick={() => setApproved(r, false)}>
                                        Hide from site
                                    </button>
                                ) : (
                                    <button type="button" className="admin-btn admin-btn--small" onClick={() => setApproved(r, true)}>
                                        Publish
                                    </button>
                                )}
                                <button type="button" className="admin-link-btn admin-link-btn--danger" onClick={() => remove(r)}>
                                    Delete
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
