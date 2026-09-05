import "./Collections.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TiltCard from "../components/TiltCard.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const FALLBACK_IMAGE = "https://placehold.co/900x1100/e8e2f8/e8e2f8";

export default function Collections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/collections`)
      .then((res) => res.json())
      .then((data) => {
        setCollections(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <main className="collections-page">
      <header className="collections-page__header">
        <p className="collections-page__eyebrow">Curated by mood</p>
        <h1 className="collections-page__title">Collections</h1>
        <p className="collections-page__intro">
          A closer look at the pieces that define RRAND, grouped by the feeling they bring
          to a room — or an outfit.
        </p>
      </header>

      {loading ? (
        <p className="collections-page__intro">Loading…</p>
      ) : (
        <div className="collections-page__grid">
          {collections.map((collection) => (
            <TiltCard
              as={Link}
              key={collection.id}
              to={`/shop/${collection.slug}`}
              className="collection-card"
              max={4}
              style={{ backgroundImage: `url(${collection.image_url || FALLBACK_IMAGE})` }}
            >
              <div className="collection-card__scrim" />
              <div className="collection-card__content">
                <h2>{collection.name}</h2>
                <p>{collection.tagline}</p>
                <span className="collection-card__cta">Shop the collection →</span>
              </div>
            </TiltCard>
          ))}
        </div>
      )}
    </main>
  );
}
