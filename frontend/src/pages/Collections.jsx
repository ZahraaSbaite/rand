import "./Collections.css";
import { Link } from "react-router-dom";
import TiltCard from "../components/TiltCard.jsx";
import heroGranny from "../assets/hero-granny-square.jpg";
import { useContentList } from "../context/SiteContext.jsx";
import { getImageUrl } from "../utils/imageUrl.js";

// Used when the API is unreachable; the admin edits these as Collections.
const FALLBACK = [
  { slug: "tote-bags", name: "Carry It All", tagline: "Totes and bags for every errand." },
  { slug: "scarves", name: "Cold Weather", tagline: "Scarves and gloves for chilly days." },
  { slug: "cardigans", name: "Layer Up", tagline: "Statement cardigans, made one at a time." },
];

const PLACEHOLDERS = [
  "https://placehold.co/900x1100/f2a516/f2a516",
  "https://placehold.co/900x1100/5d7629/5d7629",
  "https://placehold.co/900x1100/c79a6b/c79a6b",
];

export default function Collections() {
  const collections = useContentList("/api/collections", FALLBACK) || [];
  return (
    <main className="collections-page">
      <header className="collections-page__header">
        <h1 className="collections-page__title">Collections</h1>
        <p className="collections-page__intro">
          A closer look at the pieces that define RRAND, grouped by the feeling they bring
          to a room — or an outfit.
        </p>
      </header>

      <div className="collections-page__grid">
        {collections.map((collection, i) => (
          <TiltCard
            as={Link}
            key={collection.id ?? collection.slug}
            to={`/shop/${collection.slug}`}
            className="collection-card"
            max={4}
            style={{
              backgroundImage: `url(${getImageUrl(collection.image_url) || (i === 0 ? heroGranny : PLACEHOLDERS[i % PLACEHOLDERS.length])})`,
            }}
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
    </main>
  );
}
