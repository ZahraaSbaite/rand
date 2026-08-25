import "./Collections.css";
import { Link } from "react-router-dom";
import TiltCard from "../components/TiltCard.jsx";
import heroGranny from "../assets/hero-granny-square.jpg";

const COLLECTIONS = [
  {
    slug: "flowers",
    name: "Spring Garden",
    tagline: "Flowers, floral accessories, and colorful crochet pieces.",
    image: "https://placehold.co/900x1100/fad4cc/fad4cc",
  },
  {
    slug: "home",
    name: "Cozy Home",
    tagline: "Crochet pieces designed for the home.",
    image: "https://placehold.co/900x1100/d4e8f8/d4e8f8",
  },
  {
    slug: "accessories",
    name: "Little Things",
    tagline: "Small gifts, scrunchies, and mini crochet pieces.",
    image: "https://placehold.co/900x1100/fff3b8/fff3b8",
  },
  {
    slug: "collections",
    name: "Signature Collection",
    tagline: "The brand's most recognizable pieces.",
    image: heroGranny,
  },
];

export default function Collections() {
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

      <div className="collections-page__grid">
        {COLLECTIONS.map((collection) => (
          <TiltCard
            as={Link}
            key={collection.slug}
            to={`/shop/${collection.slug}`}
            className="collection-card"
            max={4}
            style={{ backgroundImage: `url(${collection.image})` }}
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
