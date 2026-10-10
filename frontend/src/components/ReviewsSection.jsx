import "./ReviewsSection.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TiltCard from "./TiltCard.jsx";
import { api } from "../lib/api.js";

function Stars({ value }) {
  const rounded = Math.round(value);
  return (
    <p className="reviews__stars" aria-label={`${value} out of 5 stars`}>
      {"★".repeat(rounded)}
      {"☆".repeat(5 - rounded)}
    </p>
  );
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api("/api/reviews/public")
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => {
        setFailed(true);
        setReviews([]);
      });
  }, []);

  const count = reviews?.length ?? 0;
  const average = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: (reviews || []).filter((r) => r.rating === stars).length,
  }));

  return (
    <section className="reviews-section" id="reviews" data-strand aria-labelledby="reviews-title">
      <header className="reviews-section__header">
        <h2 id="reviews-title" className="home__h2">
          What people say
        </h2>
        <p>
          Reviews from customers about the pieces they've brought home, each left on a product
          page.
        </p>
      </header>

      <div>
        {reviews === null ? (
          <p>Loading reviews…</p>
        ) : count === 0 ? (
          <div className="reviews__empty">
            <p>
              {failed
                ? "We couldn't load reviews just now. Please try again in a moment."
                : "No reviews yet. Bought a piece? Leave the first review on its product page."}
            </p>
            <Link to="/shop" className="reviews__share-cta">
              Find your piece
            </Link>
          </div>
        ) : (
          <>
            <div className="reviews__summary">
              <div className="reviews__average">
                <p className="reviews__average-number">{average.toFixed(1)}</p>
                <Stars value={average} />
                <p className="reviews__average-count">
                  {count} review{count === 1 ? "" : "s"}
                </p>
              </div>
              <div className="reviews__breakdown">
                {breakdown.map(({ stars, count: n }) => (
                  <div className="reviews__breakdown-row" key={stars}>
                    <span>{stars}★</span>
                    <div className="reviews__breakdown-bar">
                      <div
                        className="reviews__breakdown-fill"
                        style={{ width: `${(n / count) * 100}%` }}
                      />
                    </div>
                    <span>{n}</span>
                  </div>
                ))}
              </div>
              <Link to="/shop" className="reviews__share-cta">
                Review a piece you bought
              </Link>
            </div>

            <div className="reviews__grid">
              {reviews.map((review) => (
                <TiltCard className="reviews__card" key={review.id} max={6}>
                  <Stars value={review.rating} />
                  <p className="reviews__quote">"{review.comment}"</p>
                  <p className="reviews__author">{review.customer_name}</p>
                  <p className="reviews__product-date">
                    <Link to={`/product/${review.product_id}`}>{review.product_name}</Link> ·{" "}
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </TiltCard>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
