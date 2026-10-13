import "./ReviewsSection.css";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

// Each review is a granny square; its three rounds take one of these colourways
// (outer → inner), chosen by review id so a square keeps its colours.
const COLOURWAYS = [
  ["marigold", "avocado", "navy"],
  ["avocado", "navy", "marigold"],
  ["navy", "marigold", "avocado"],
  ["marigold", "navy", "avocado"],
  ["avocado", "marigold", "navy"],
];

const EMPTY_FORM = { product_id: "", customer_name: "", customer_email: "", rating: 5, comment: "" };

/** Rating as five yarn balls: wound for each point, an empty loop for the rest. */
function YarnRating({ value, className = "" }) {
  const filled = Math.round(value);
  return (
    <span className={`yarn-rating ${className}`} role="img" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`yarn-rating__ball${n <= filled ? " is-wound" : ""}`} aria-hidden="true" />
      ))}
    </span>
  );
}

function GrannySquare({ review, index }) {
  const [outer, middle, inner] = COLOURWAYS[review.id % COLOURWAYS.length];
  return (
    <li
      className="granny"
      data-outer={outer}
      data-middle={middle}
      data-inner={inner}
      style={{ "--granny-tilt": `${index % 3 === 0 ? -0.8 : index % 3 === 1 ? 0.6 : -0.3}deg` }}
    >
      <div className="granny__round granny__round--middle">
        <div className="granny__round granny__round--inner">
          <figure className="granny__centre">
            <YarnRating value={review.rating} />
            <blockquote className="granny__quote">{review.comment}</blockquote>
            <figcaption className="granny__by">
              <span className="granny__name">{review.customer_name}</span>
              <Link to={`/product/${review.product_id}`} className="granny__piece">
                No. {review.product_id} · {review.product_name}
              </Link>
            </figcaption>
          </figure>
        </div>
      </div>
    </li>
  );
}

function ReviewForm({ onCancel, onSent }) {
  const [products, setProducts] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const firstField = useRef(null);

  useEffect(() => {
    api("/api/products")
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]));
    firstField.current?.focus();
  }, []);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const saved = await api("/api/reviews", {
        method: "POST",
        body: { ...form, product_id: Number(form.product_id), rating: Number(form.rating) },
      });
      const piece = products?.find((p) => String(p.id) === String(form.product_id));
      onSent({ ...saved, product_name: piece?.name ?? "" });
    } catch (err) {
      setError(err.message);
      setSending(false);
    }
  };

  return (
    <li className="granny granny--form">
      <form className="review-form" onSubmit={submit}>
        <p className="review-form__title">Add your square</p>

        <label className="review-form__field review-form__field--wide">
          Which piece did you buy?
          <select ref={firstField} name="product_id" value={form.product_id} onChange={update} required>
            <option value="">{products === null ? "Loading pieces…" : "Choose a piece"}</option>
            {(products || []).map((p) => (
              <option key={p.id} value={p.id}>
                No. {p.id} · {p.name}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="review-form__rating">
          <legend>Your rating</legend>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={`yarn-rating__ball${Number(form.rating) >= n ? " is-wound" : ""}`}>
              <input type="radio" name="rating" value={n} checked={Number(form.rating) === n} onChange={update} />
              <span className="review-form__sr">
                {n} out of 5
              </span>
            </label>
          ))}
          <span className="review-form__rating-text" aria-hidden="true">
            {form.rating} of 5
          </span>
        </fieldset>

        <label className="review-form__field">
          Your name
          <input name="customer_name" value={form.customer_name} onChange={update} autoComplete="name" required />
        </label>
        <label className="review-form__field">
          <span>
            Email <small>(never shown)</small>
          </span>
          <input
            type="email"
            name="customer_email"
            value={form.customer_email}
            onChange={update}
            autoComplete="email"
            required
          />
        </label>

        <label className="review-form__field review-form__field--wide">
          Your review
          <textarea name="comment" rows={4} value={form.comment} onChange={update} required />
        </label>

        {error && <p className="review-form__error">{error}</p>}

        <div className="review-form__actions">
          <button type="submit" className="review-form__submit" disabled={sending}>
            {sending ? "Stitching it in…" : "Stitch in my review"}
          </button>
          <button type="button" className="review-form__cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </li>
  );
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState(null);
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState("idle"); // idle | writing | sent

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

  return (
    <section className="reviews-section" id="reviews" data-strand aria-labelledby="reviews-title">
      <header className="reviews-section__header">
        <h2 id="reviews-title" className="home__h2">
          What people say
        </h2>
        {count > 0 ? (
          <p className="reviews-stamp" aria-label={`Average ${average.toFixed(1)} out of 5 from ${count} reviews`}>
            <span className="reviews-stamp__score">{average.toFixed(1)}</span>
            <span className="reviews-stamp__count">
              {count} square{count === 1 ? "" : "s"}
            </span>
          </p>
        ) : (
          <p className="reviews-section__intro">
            Every review becomes a square in the blanket. Bought a piece? Add the first one.
          </p>
        )}
      </header>

      {reviews === null ? (
        <p className="reviews-section__status">Loading reviews…</p>
      ) : (
        <>
          {failed && (
            <p className="reviews-section__status">We couldn't load reviews just now. Please try again in a moment.</p>
          )}
          <ul className="blanket" aria-label="Customer reviews">
            {reviews.map((review, i) => (
              <GrannySquare key={review.id} review={review} index={i} />
            ))}

            {mode === "writing" ? (
              <ReviewForm
                onCancel={() => setMode("idle")}
                onSent={(review) => {
                  // Reviews go live straight away: stitch it into the blanket now.
                  setReviews((list) => [review, ...(list || [])]);
                  setMode("sent");
                }}
              />
            ) : (
              <li className="granny granny--unfinished">
                {mode === "sent" ? (
                  <p className="granny__thanks" role="status">
                    <strong>Thank you!</strong> Your square is now part of the blanket.
                  </p>
                ) : (
                  <button type="button" className="granny__add" onClick={() => setMode("writing")}>
                    <span className="granny__hook" aria-hidden="true" />
                    {count === 0 ? "Add the first square" : "Add your square"}
                    <small>Write a review of a piece you bought</small>
                  </button>
                )}
              </li>
            )}
          </ul>
        </>
      )}
    </section>
  );
}
