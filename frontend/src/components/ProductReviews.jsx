import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import "./ProductReviews.css";

const EMPTY = { customer_name: "", customer_email: "", rating: 5, comment: "" };

/** Approved reviews for one product, plus a form; new reviews wait for admin approval. */
export default function ProductReviews({ productId, productName }) {
    const [reviews, setReviews] = useState([]);
    const [form, setForm] = useState(EMPTY);
    const [status, setStatus] = useState("idle"); // idle | sending | sent | error
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        api(`/api/reviews?product_id=${productId}`)
            .then((data) => setReviews(Array.isArray(data) ? data : []))
            .catch(() => setReviews([]));
    }, [productId]);

    const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        setStatus("sending");
        setError(null);
        try {
            await api("/api/reviews", {
                method: "POST",
                body: { ...form, rating: Number(form.rating), product_id: productId },
            });
            setStatus("sent");
            setForm(EMPTY);
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    };

    return (
        <section className="product-reviews" aria-labelledby="product-reviews-title">
            <div className="product-reviews__head">
                <h2 id="product-reviews-title">Reviews</h2>
                {!open && status !== "sent" && (
                    <button type="button" className="product-reviews__toggle" onClick={() => setOpen(true)}>
                        Write a review
                    </button>
                )}
            </div>

            {status === "sent" ? (
                <p className="product-reviews__thanks">
                    Thank you! Your review will appear here once it has been approved.
                </p>
            ) : (
                open && (
                    <form className="product-reviews__form" onSubmit={submit}>
                        <fieldset className="product-reviews__rating">
                            <legend>Your rating</legend>
                            {[1, 2, 3, 4, 5].map((n) => (
                                <label key={n} className={Number(form.rating) >= n ? "is-on" : ""}>
                                    <input
                                        type="radio"
                                        name="rating"
                                        value={n}
                                        checked={Number(form.rating) === n}
                                        onChange={update}
                                    />
                                    <span aria-hidden="true">★</span>
                                    <span className="product-reviews__sr">
                                        {n} star{n > 1 ? "s" : ""}
                                    </span>
                                </label>
                            ))}
                        </fieldset>
                        <div className="product-reviews__row">
                            <label>
                                Name
                                <input name="customer_name" value={form.customer_name} onChange={update} required />
                            </label>
                            <label>
                                Email <small>(not shown)</small>
                                <input
                                    type="email"
                                    name="customer_email"
                                    value={form.customer_email}
                                    onChange={update}
                                    required
                                />
                            </label>
                        </div>
                        <label>
                            Your review of {productName}
                            <textarea name="comment" rows={4} value={form.comment} onChange={update} required />
                        </label>
                        {error && <p className="product-reviews__error">{error}</p>}
                        <div className="product-reviews__actions">
                            <button type="submit" disabled={status === "sending"}>
                                {status === "sending" ? "Sending…" : "Submit review"}
                            </button>
                            <button type="button" className="product-reviews__cancel" onClick={() => setOpen(false)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                )
            )}

            {reviews.length === 0 ? (
                <p className="product-reviews__none">No reviews yet for this piece.</p>
            ) : (
                <ul className="product-reviews__list">
                    {reviews.map((r) => (
                        <li key={r.id}>
                            <p className="product-reviews__stars" aria-label={`${r.rating} out of 5 stars`}>
                                {"★".repeat(r.rating)}
                                {"☆".repeat(5 - r.rating)}
                            </p>
                            <p className="product-reviews__comment">{r.comment}</p>
                            <p className="product-reviews__meta">
                                {r.customer_name} · {new Date(r.created_at).toLocaleDateString()}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
