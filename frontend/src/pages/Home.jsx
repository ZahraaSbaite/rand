import "./Home.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import YarnStrand from "../components/YarnStrand.jsx";
import ColorwayBuilder from "../components/ColorwayBuilder.jsx";
import { useCart } from "../context/CartContext.jsx";
import { getImageUrl } from "../utils/imageUrl.js";
import flyToCart from "../utils/flyToCart.js";
import useParallax from "../hooks/useParallax.js";
import { useContentList, useSite } from "../context/SiteContext.jsx";
import slugify from "../lib/slug.js";
import heroHands from "../assets/hero-crochet-hands.jpg";
import heroGranny from "../assets/hero-granny-square.jpg";

const API_URL = import.meta.env.VITE_API_URL || "";
const RACK_SIZE = 8;

const BOOK_TONES = ["band", "oat", "burgundy", "avocado"];


// Fallback when the API is unreachable; the admin edits these as Process steps.
const ROUNDS = [
  {
    title: "Sourcing yarn",
    copy: "Every project starts with choosing fiber and colorway — quality yarn, sourced thoughtfully.",
  },
  {
    title: "Design & swatch",
    copy: "New pieces begin as a swatch, testing stitch patterns and proportions before committing.",
  },
  {
    title: "Hand crochet",
    copy: "Each piece is worked entirely by hand, stitch by stitch — no machines involved.",
  },
  {
    title: "Finishing & QC",
    copy: "Ends woven in, seams checked, and every piece inspected before it's listed.",
  },
  {
    title: "Packaging & shipping",
    copy: "Wrapped with care and shipped out, ready for its new home.",
  },
];

function pickCoverPiece(products) {
  const available = products.filter((p) => Number(p.stock_quantity ?? 1) > 0);
  const pool = available.length ? available : products;
  return (
    pool.find((p) => p.featured) ||
    [...pool].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] ||
    null
  );
}

function CoverPiece({ piece, loading }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  if (loading) {
    return (
      <div className="cover__piece is-loading" aria-hidden="true">
        <div className="cover__photo" />
      </div>
    );
  }

  // No products reachable: show the making instead of an empty frame.
  if (!piece) {
    return (
      <figure className="cover__piece">
        <div className="cover__photo">
          <img src={heroHands} alt="Hands working a crochet hook through yarn" />
        </div>
        <figcaption className="cover__caption">
          <span className="cover__caption-name">Worked by hand, stitch by stitch</span>
          <Link to="/shop" className="cover__caption-link">
            See the pieces
          </Link>
        </figcaption>
      </figure>
    );
  }

  const price = (piece.price_cents / 100).toFixed(2);
  const handleAdd = (e) => {
    addToCart(piece.id);
    flyToCart(e.currentTarget);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <figure className="cover__piece">
      <Link to={`/product/${piece.id}`} className="cover__photo">
        <img
          src={getImageUrl(piece.image_url) || heroGranny}
          alt={piece.name}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = heroGranny;
          }}
        />
      </Link>
      <span className="cover__stamp" aria-hidden="true">
        <small>Piece</small>
        No. {piece.id}
      </span>
      <figcaption className="cover__caption">
        <Link to={`/product/${piece.id}`} className="cover__caption-name">
          {piece.name}
        </Link>
        <span className="cover__caption-price">${price}</span>
        <button
          type="button"
          className={`cover__add${added ? " is-added" : ""}`}
          onClick={handleAdd}
        >
          {added ? "Added to cart" : "Add to cart"}
        </button>
      </figcaption>
    </figure>
  );
}

function PatternRounds({ rounds }) {
  const [current, setCurrent] = useState(0);
  const rowRefs = useRef([]);

  useEffect(() => {
    const rows = rowRefs.current.filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-worked");
            setCurrent(Number(entry.target.dataset.index));
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    rows.forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, [rounds]);

  return (
    <div className="rounds">
      <div className="rounds__aside">
        <div className="rounds__photo">
          <img src={heroHands} alt="Hands crocheting a piece" loading="lazy" />
          <p className="rounds__counter" aria-live="polite">
            <span>Rnd</span>
            <strong key={current}>{current + 1}</strong>
            <span>of {rounds.length}</span>
          </p>
        </div>
      </div>

      <ol className="rounds__list">
        {rounds.map((round, i) => (
          <li
            key={round.title}
            className={`rounds__row${i === 0 ? " is-worked" : ""}${i === current ? " is-current" : ""}`}
            data-index={i}
            ref={(el) => (rowRefs.current[i] = el)}
          >
            <span className="rounds__label">Rnd {i + 1}:</span>
            <div>
              <h3>{round.title}</h3>
              <p>{round.description ?? round.copy}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Home() {
  const pageRef = useRef(null);
  const parallax = useParallax();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState(null);
  const { settings, categories } = useSite();
  const rounds = useContentList("/api/process-steps", ROUNDS);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/products`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const coverPiece = useMemo(() => pickCoverPiece(products), [products]);

  const rackCategories = useMemo(() => {
    const seen = new Map();
    products.forEach((p) => {
      const key = slugify(p.category);
      if (key && !seen.has(key)) seen.set(key, p.category.trim());
    });
    return [...seen.entries()];
  }, [products]);

  const rack = useMemo(() => {
    const sorted = [...products].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const filtered = filter
      ? sorted.filter((p) => slugify(p.category) === filter)
      : sorted;
    return filtered.slice(0, RACK_SIZE);
  }, [products, filter]);

  return (
    <main className="home" ref={pageRef}>
      <YarnStrand containerRef={pageRef} />

      {/* ---------- Cover ---------- */}
      <section
        className="cover"
        data-strand
        aria-label="Strand"
        ref={parallax.ref}
        onMouseMove={parallax.onMouseMove}
        onMouseLeave={parallax.onMouseLeave}
      >
        <div className="cover__strip">
          <span>Strand</span>
          <span className="cover__strip-mid">Crochet, made by hand</span>
          <span>{coverPiece ? `Piece No. ${coverPiece.id}` : "Small batches"}</span>
        </div>

        <div className="cover__layout">
          <div className="cover__text">
            <h1 className="cover__title">
              {"strand".split("").map((letter, i) => (
                <span key={i} style={{ "--i": i }}>
                  {letter}
                </span>
              ))}
            </h1>
            <p className="cover__tagline">{settings.hero_tagline}</p>
            <p className="cover__sub">{settings.hero_text}</p>
            <div className="cover__actions">
              <Link to="/shop" className="cover__cta">
                Shop all pieces
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link to="/custom-orders" className="cover__link">
                Commission a piece
              </Link>
            </div>
          </div>

          <div className="cover__visual">
            <svg className="cover__ring" viewBox="0 0 200 200" aria-hidden="true">
              <circle cx="100" cy="100" r="96" />
            </svg>
            <CoverPiece piece={coverPiece} loading={loading} />
          </div>
        </div>
      </section>

      {/* ---------- The rack ---------- */}
      <section className="rack" data-strand aria-labelledby="rack-title">
        <header className="rack__header">
          <h2 id="rack-title" className="home__h2">
            Fresh off the hook
          </h2>
          <Link to="/shop" className="home__more">
            See every piece
          </Link>
        </header>

        {rackCategories.length > 1 && (
          <div className="rack__filters" role="group" aria-label="Filter by category">
            <button
              type="button"
              className={`rack__chip${!filter ? " is-active" : ""}`}
              aria-pressed={!filter}
              onClick={() => setFilter(null)}
            >
              Everything
            </button>
            {rackCategories.map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`rack__chip${filter === key ? " is-active" : ""}`}
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="product-grid rack__grid" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rack__ghost" />
            ))}
          </div>
        ) : rack.length ? (
          <div className="product-grid rack__grid" key={filter || "all"}>
            {rack.map((product, i) => (
              <div className="rack__item" style={{ "--d": `${i * 60}ms` }} key={product.id}>
                <ProductCard product={product} colorIndex={i} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rack__empty">
            <p>
              {failed
                ? "We couldn't load the pieces just now. Try the shop in a moment."
                : "The hooks are busy. New pieces are on the way."}
            </p>
            <Link to="/custom-orders" className="home__more">
              Commission one instead
            </Link>
          </div>
        )}
      </section>

      {/* ---------- How a piece is made ---------- */}
      <section className="making" data-strand aria-labelledby="making-title">
        <header className="making__header">
          <h2 id="making-title" className="home__h2">
            How a piece is made
          </h2>
          <p>From skein to your door, round by round. No machines, no factories.</p>
        </header>
        {rounds && <PatternRounds rounds={rounds} />}
        <Link to="/the-process" className="home__more making__more">
          The whole process
        </Link>
      </section>

      {/* ---------- Categories ---------- */}
      <section className="shelf" data-strand aria-labelledby="shelf-title">
        <h2 id="shelf-title" className="home__h2">
          Pick a pattern book
        </h2>
        <div className="shelf__grid">
          {[...categories, { slug: "", name: "Everything" }].map((cat, i) => (
            <Link
              key={cat.slug || "all"}
              to={cat.slug ? `/shop/${cat.slug}` : "/shop"}
              className={`shelf__book shelf__book--${BOOK_TONES[i % BOOK_TONES.length]}`}
              style={{ "--tilt": `${(i % 2 ? 1 : -1) * (1 + (i % 3))}deg` }}
            >
              <span className="shelf__no" aria-hidden="true">No. {i + 1}</span>
              <span className="shelf__label">{cat.name}</span>
              <svg className="shelf__arrow" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Commission ---------- */}
      <section className="commission" data-strand aria-labelledby="commission-title">
        <div className="commission__inner">
          <header className="commission__header">
            <h2 id="commission-title" className="home__h2">
              Have a colorway in mind?
            </h2>
            <p>
              Try it on a granny square: pick a round, then a yarn. When it looks right, send it to
              us and we'll make your piece in those colors. Most commissions are worked within 2–4
              weeks.
            </p>
          </header>
          <ColorwayBuilder />
        </div>
      </section>
    </main>
  );
}
