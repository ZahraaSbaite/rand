import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { EmptyState, SectionHeader, formatDate, useAdmin } from "./AdminUI.jsx";

/** Reviews go live as soon as customers post them; the admin can only delete. */
export default function ReviewsManager() {
    const { notify, refreshCounts } = useAdmin();
    const [reviews, setReviews] = useState(null);

    useEffect(() => {
        api("/api/reviews/admin")
            .then(setReviews)
            .catch((err) => {
                notify(err.message, "bad");
                setReviews([]);
            });
    }, [notify]);

    const remove = async (r) => {
        if (!confirm(`Delete ${r.customer_name}'s review? It will disappear from the site. This can't be undone.`)) return;
        try {
            await api(`/api/reviews/${r.id}`, { method: "DELETE" });
            setReviews((list) => list.filter((x) => x.id !== r.id));
            notify("Review deleted");
            refreshCounts?.();
        } catch (err) {
            notify(err.message, "bad");
        }
    };

    return (
        <div>
            <SectionHeader
                title="Reviews"
                description="Reviews appear on the site as soon as customers post them. Delete any you don't want shown."
            />

            {reviews === null ? (
                <p className="admin-loading">Loading reviews…</p>
            ) : reviews.length === 0 ? (
                <EmptyState title="No reviews yet" />
            ) : (
                <div className="admin-stack">
                    {reviews.map((r) => (
                        <article key={r.id} className="admin-review">
                            <header className="admin-review__head">
                                <span className="admin-review__stars" aria-label={`${r.rating} out of 5`}>
                                    {"★".repeat(r.rating)}
                                    <span className="admin-muted">{"★".repeat(5 - r.rating)}</span>
                                </span>
                            </header>
                            <p className="admin-review__comment">{r.comment}</p>
                            <p className="admin-muted">
                                {r.customer_name} (<a href={`mailto:${r.customer_email}`}>{r.customer_email}</a>) on{" "}
                                <strong>{r.product_name}</strong> · {formatDate(r.created_at)}
                            </p>
                            <div className="admin-row">
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
