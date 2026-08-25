import "./Home.css";
import { Link } from "react-router-dom";
import useReveal from "../hooks/useReveal.js";
import useTilt from "../hooks/useTilt.js";
import useParallax from "../hooks/useParallax.js";

const FEATURED_CATEGORIES = [
  { slug: "bags", label: "Bags", swatch: "lavender" },
  { slug: "flowers", label: "Flowers", swatch: "coral" },
  { slug: "plushies", label: "Plushies", swatch: "mint" },
  { slug: "accessories", label: "Accessories", swatch: "butter" },
  { slug: "home", label: "Home", swatch: "powder" },
  { slug: "collections", label: "Collections", swatch: "pink" },
];

const TEASERS = [
  {
    title: "Custom Orders",
    copy: "Have a colorway or size in mind? Commission a one-of-a-kind piece made just for you.",
    to: "/custom-orders",
    cta: "Start a commission",
  },
  {
    title: "Our Story",
    copy: "A small studio dedicated to slow-made, small-batch crochet — one skein at a time.",
    to: "/our-story",
    cta: "Meet the maker",
  },
  {
    title: "Reviews",
    copy: "See what fellow yarn lovers have to say about their RRAND pieces.",
    to: "/reviews",
    cta: "Read reviews",
  },
];

function CategoryTile({ cat }) {
  const tilt = useTilt({ max: 10 });
  return (
    <Link
      to={`/shop/${cat.slug}`}
      className={`home__category-tile home__category-tile--${cat.swatch}`}
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      <span>{cat.label}</span>
    </Link>
  );
}

function TeaserCard({ teaser }) {
  const tilt = useTilt({ max: 6 });
  return (
    <div
      className="home__teaser-card"
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      <h3>{teaser.title}</h3>
      <p>{teaser.copy}</p>
      <Link to={teaser.to}>{teaser.cta} →</Link>
    </div>
  );
}

export default function Home() {
  const categoriesRevealRef = useReveal();
  const teasersRevealRef = useReveal();
  const parallax = useParallax();

  return (
    <main className="shop">
      <section
        className="shop__hero"
        aria-label="RRAND hero"
        ref={parallax.ref}
        onMouseMove={parallax.onMouseMove}
        onMouseLeave={parallax.onMouseLeave}
      >
        <div className="shop__hero-bg" aria-hidden="true">
          <div className="shop__hero-shape shop__hero-shape--lavender" />
          <div className="shop__hero-shape shop__hero-shape--butter" />
          <div className="shop__hero-shape shop__hero-shape--mint" />
          <div className="shop__hero-shape shop__hero-shape--coral" />
          <svg className="shop__hero-thread" viewBox="0 0 400 80" preserveAspectRatio="none">
            <path
              d="M0 40 Q100 10 200 45 T400 35"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        <div className="shop__hero-layout">
          <div className="shop__hero-content">
            <p className="shop__eyebrow">NEW AGE CROCHET</p>
            <h1 className="shop__title">RRAND</h1>
            <p className="shop__tagline">A WORLD OF COLOR + THREAD</p>
            <p className="shop__sub">
              Small-batch pieces, worked slowly and sold as they're finished.
            </p>
            <Link to="/shop" className="home__hero-cta">
              Shop the collection
            </Link>
          </div>
        </div>

        <nav className="shop__crumb" aria-label="Breadcrumb">
          <span>Home</span>
          <span className="shop__crumb-sep">/</span>
          <Link to="/shop">Shop</Link>
        </nav>
      </section>

      <section className="home__categories reveal" ref={categoriesRevealRef} aria-label="Shop by category">
        <header className="home__section-header">
          <p className="home__section-eyebrow">Browse</p>
          <h2 className="home__section-title">Shop by Category</h2>
        </header>

        <div className="home__category-grid">
          {FEATURED_CATEGORIES.map((cat) => (
            <CategoryTile key={cat.slug} cat={cat} />
          ))}
        </div>
      </section>

      <section className="home__teasers reveal" ref={teasersRevealRef} aria-label="More from RRAND">
        <div className="home__teaser-grid">
          {TEASERS.map((teaser) => (
            <TeaserCard key={teaser.title} teaser={teaser} />
          ))}
        </div>
      </section>
    </main>
  );
}
