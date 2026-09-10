import "./InfoPage.css";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import TiltCard from "../components/TiltCard.jsx";
import { SkeletonReviews } from "../components/Skeleton.jsx";
import EmptyState from "../components/EmptyState.jsx";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    document.body.style.overflow = showForm ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showForm]);

  useEffect(() => {
    if (!showForm) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setShowForm(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showForm]);

  const loadReviews = () => {
    setLoading(true);
    return fetch(`${API_URL}/api/reviews`)
      .then((res) => res.json())
      .then(setReviews)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews();
    fetch(`${API_URL}/api/products`)
      .then((res) => res.json())
      .then(setProducts)
      .catch(console.error);
  }, []);

  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.target);
    const productId = form.get("product_id");

    try {
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: form.get("customer_name"),
          customer_email: form.get("customer_email"),
          product_id: productId || null,
          rating,
          comment: form.get("comment"),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      e.target.reset();
      setRating(5);
      setSubmitted(true);
      setShowForm(false);
      await loadReviews();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="info-page">
      <header className="info-page__header">
        <p className="info-page__eyebrow">From our customers</p>
        <h1 className="info-page__title">Reviews</h1>
        <p className="info-page__intro">
          Kind words from fellow yarn lovers who've brought a piece of RRAND home.
        </p>
      </header>

      <section className="info-page__section">
        <div className="reviews__summary">
          <div className="reviews__average">
            <p className="reviews__average-number">{averageRating.toFixed(1)}</p>
            <p className="reviews__stars" aria-hidden="true">
              {"★".repeat(Math.round(averageRating))}
              {"☆".repeat(5 - Math.round(averageRating))}
            </p>
            <p className="reviews__average-count">
              {reviews.length} review{reviews.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="reviews__breakdown">
            {breakdown.map(({ stars, count }) => (
              <div className="reviews__breakdown-row" key={stars}>
                <span>{stars}★</span>
                <div className="reviews__breakdown-bar">
                  <div
                    className="reviews__breakdown-fill"
                    style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : "0%" }}
                  />
                </div>
                <span>{count}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="reviews__share-cta"
            onClick={() => {
              setSubmitted(false);
              setShowForm(true);
            }}
          >
            Share Your Experience
          </button>
        </div>

        {submitted && (
          <p className="info-form__status" style={{ marginBottom: "1.5rem" }}>
            Thanks for sharing your experience! It'll appear here once we've had a chance to review it.
          </p>
        )}

        {loading ? (
          <SkeletonReviews />
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path
                  d="M12 21s-7.5-4.6-10-9.2C.5 8.5 2 5 5.5 5c2 0 3.5 1.2 4.5 2.7C11 6.2 12.5 5 14.5 5 18 5 19.5 8.5 18 11.8 15.5 16.4 12 21 12 21z"
                  strokeLinejoin="round"
                />
              </svg>
            }
            title="No reviews yet"
            subtitle="Be the first to share your experience with RRAND."
            ctaText="Share Your Experience"
            onCtaClick={() => setShowForm(true)}
          />
        ) : (
          <div className="reviews__grid">
            {reviews.map((review) => (
              <TiltCard className="reviews__card" key={review.id} max={6}>
                <p className="reviews__stars" aria-label={`${review.rating} out of 5 stars`}>
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </p>
                <p className="reviews__quote">"{review.comment}"</p>
                <p className="reviews__author">{review.customer_name}</p>
                <p className="reviews__product-date">
                  {review.product_name || "General experience"} ·{" "}
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </TiltCard>
            ))}
          </div>
        )}
      </section>

      {showForm && createPortal(
        <div className="reviews__modal" role="dialog" aria-modal="true" aria-label="Share your experience">
          <button
            type="button"
            className="reviews__modal-close"
            aria-label="Close"
            onClick={() => setShowForm(false)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div className="reviews__modal-layout">
            <div className="reviews__modal-intro">
              <p className="reviews__modal-eyebrow">From our customers</p>
              <h2 className="reviews__modal-title">Share your experience</h2>
              <p className="reviews__modal-copy">
                Tell fellow yarn lovers what you thought — the good, the small details, all of
                it. Your review helps others find the right piece.
              </p>
            </div>

            <form className="info-form reviews__modal-form" onSubmit={handleSubmit}>
              <div className="info-form__row">
                <label>
                  Your name
                  <input type="text" name="customer_name" required />
                </label>
                <label>
                  Email
                  <input type="email" name="customer_email" required />
                </label>
              </div>

              <div className="info-form__row">
                <label>
                  Which piece? <span className="info-form__optional">(optional)</span>
                  <select name="product_id" defaultValue="">
                    <option value="">General experience</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Rating
                  <div className="reviews__rating-input" role="radiogroup" aria-label="Rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        className="reviews__rating-star"
                        aria-label={`${star} star${star === 1 ? "" : "s"}`}
                        aria-pressed={rating === star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                      >
                        {(hoverRating || rating) >= star ? "★" : "☆"}
                      </button>
                    ))}
                    <span className="reviews__rating-label">{hoverRating || rating} / 5</span>
                  </div>
                </label>
              </div>

              <label>
                Your review
                <textarea name="comment" placeholder="Tell us what you thought…" required />
              </label>

              {error && <p className="info-form__error">{error}</p>}

              <button type="submit" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Review"}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
}
