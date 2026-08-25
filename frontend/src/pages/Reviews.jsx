import "./InfoPage.css";
import { Link } from "react-router-dom";
import TiltCard from "../components/TiltCard.jsx";

const REVIEWS = [
  {
    name: "Maya T.",
    stars: 5,
    product: "Amigurumi Fox",
    date: "2026-07-02",
    quote: "The Amigurumi Fox is even softer and more detailed in person. Shipped fast and packaged so cutely!",
  },
  {
    name: "Jordan P.",
    stars: 5,
    product: "Woven Market Tote",
    date: "2026-06-18",
    quote: "Ordered a custom tote in my wedding colors and it turned out perfectly. Will be a repeat customer.",
  },
  {
    name: "Sam R.",
    stars: 5,
    product: "Granny Square Blanket",
    date: "2026-05-27",
    quote: "The granny square blanket is a piece of art. You can tell how much care went into every stitch.",
  },
  {
    name: "Alex K.",
    stars: 4,
    product: "Chunky Coaster Set",
    date: "2026-05-11",
    quote: "Beautiful coasters, exactly as pictured. Took a little longer to arrive but well worth the wait.",
  },
];

const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
  stars,
  count: REVIEWS.filter((r) => r.stars === stars).length,
}));
const averageRating = REVIEWS.reduce((sum, r) => sum + r.stars, 0) / REVIEWS.length;

export default function Reviews() {
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
            <p className="reviews__average-count">{REVIEWS.length} reviews</p>
          </div>
          <div className="reviews__breakdown">
            {breakdown.map(({ stars, count }) => (
              <div className="reviews__breakdown-row" key={stars}>
                <span>{stars}★</span>
                <div className="reviews__breakdown-bar">
                  <div
                    className="reviews__breakdown-fill"
                    style={{ width: `${(count / REVIEWS.length) * 100}%` }}
                  />
                </div>
                <span>{count}</span>
              </div>
            ))}
          </div>
          <Link to="/contact" className="reviews__share-cta">
            Share Your Experience
          </Link>
        </div>

        <div className="reviews__grid">
          {REVIEWS.map((review) => (
            <TiltCard className="reviews__card" key={review.name} max={6}>
              <p className="reviews__stars" aria-label={`${review.stars} out of 5 stars`}>
                {"★".repeat(review.stars)}
                {"☆".repeat(5 - review.stars)}
              </p>
              <p className="reviews__quote">"{review.quote}"</p>
              <p className="reviews__author">{review.name}</p>
              <p className="reviews__product-date">
                {review.product} · {new Date(review.date).toLocaleDateString()}
              </p>
            </TiltCard>
          ))}
        </div>
      </section>
    </main>
  );
}
