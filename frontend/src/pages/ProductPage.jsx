import "./ProductPage.css";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import useRecentlyViewed from "../hooks/useRecentlyViewed.js";
import { SkeletonProductDetail } from "../components/Skeleton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { getImageUrl, getPrimaryImage } from "../utils/imageUrl.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const FALLBACK_IMAGE = "https://placehold.co/700x700/e8e2f8/2a2420?text=RRAND";

const TABS = ["Description", "Materials", "Dimensions", "Care", "Production Time", "Shipping"];

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [justAdded, setJustAdded] = useState(false);
  const recentlyViewedIds = useRecentlyViewed(product ? Number(id) : null);

  useEffect(() => {
    setLoading(true);
    setQuantity(1);
    setActiveImage(0);
    setActiveTab(0);
    fetch(`${API_URL}/api/products/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          setProduct(null);
          return;
        }
        const data = await res.json();
        setProduct(data);
        setSelectedColor(data.colors?.[0] ?? data.yarn_color ?? null);
      })
      .catch((err) => {
        console.error(err);
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Fetched once and filtered client-side, same pattern the shop page already uses.
  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then((res) => res.json())
      .then(setAllProducts)
      .catch(console.error);
  }, []);

  const similarProducts = useMemo(() => {
    if (!product) return [];

    const others = allProducts.filter((p) => p.id !== product.id);
    const currentCategory = product.category?.trim().toLowerCase();

    const sameCategory = others.filter(
      (p) => p.category?.trim().toLowerCase() === currentCategory
    );
    const otherCategories = others.filter(
      (p) => p.category?.trim().toLowerCase() !== currentCategory
    );

    // Same-category items first, then everything else fills the remaining slots.
    return [...sameCategory, ...otherCategories].slice(0, 10);
  }, [allProducts, product]);

  const recentlyViewed = useMemo(
    () => recentlyViewedIds.map((rid) => allProducts.find((p) => p.id === rid)).filter(Boolean),
    [recentlyViewedIds, allProducts]
  );

  if (loading) {
    return (
      <main className="product">
        <SkeletonProductDetail />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="product">
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round" />
            </svg>
          }
          title="We couldn't find that piece"
          subtitle="It may have sold out or the link may be outdated."
          ctaText="Back to shop"
          ctaTo="/shop"
        />
      </main>
    );
  }

  const priceLabel = `$${(product.price_cents / 100).toFixed(2)}`;
  const inStock = product.stock_quantity > 0;
  const wishlisted = isWishlisted(product.id);
  const gallery = product.images?.length
    ? product.images.map(getImageUrl)
    : [getImageUrl(product.image_url) || FALLBACK_IMAGE];
  const rating = Number(product.rating) || 0;

  const decrement = () => setQuantity((q) => Math.max(1, q - 1));
  const increment = () =>
    setQuantity((q) => Math.min(product.stock_quantity || 1, q + 1));

  const handleAddToCart = () => {
    addToCart(product.id, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleBuyNow = () => {
    addToCart(product.id, quantity);
    navigate("/checkout");
  };

  const tabContent = {
    Description: product.description || "No description provided yet.",
    Materials: product.materials || "Materials information coming soon.",
    Dimensions: product.dimensions || "Dimensions information coming soon.",
    Care: product.care_instructions || "Hand wash cold, lay flat to dry.",
    "Production Time": product.production_time || "2-5 business days.",
    Shipping: "Flat $5 shipping, calculated at checkout. See our Shipping page for full details.",
  };

  return (
    <main className="product">
      <nav className="product__crumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/shop">Shop</Link>
        {product.category && (
          <>
            <span>/</span>
            <span>{product.category}</span>
          </>
        )}
        <span>/</span>
        <span className="product__crumb-current">{product.name}</span>
      </nav>

      <div className="product__layout">
        <div className="product__gallery">
          <div className="product__gallery-main">
            <img
              className="product__image"
              src={gallery[activeImage] || FALLBACK_IMAGE}
              alt={product.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
            <button
              type="button"
              className={`product__wishlist-btn${wishlisted ? " is-active" : ""}`}
              onClick={() => {
                const ok = toggleWishlist(product.id);
                if (!ok) navigate("/login", { state: { from: `/product/${id}` } });
              }}
              aria-pressed={wishlisted}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 21s-7.5-4.6-10-9.2C.5 8.5 2 5 5.5 5c2 0 3.5 1.2 4.5 2.7C11 6.2 12.5 5 14.5 5 18 5 19.5 8.5 18 11.8 15.5 16.4 12 21 12 21z"
                  fill={wishlisted ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          {gallery.length > 1 && (
            <div className="product__thumbs">
              {gallery.map((src, i) => (
                <button
                  type="button"
                  key={src + i}
                  className={`product__thumb${i === activeImage ? " is-active" : ""}`}
                  onClick={() => setActiveImage(i)}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product__info">
          {product.category && (
            <p className="product__eyebrow">{product.category}</p>
          )}
          <h1 className="product__name">{product.name}</h1>

          {rating > 0 && (
            <div className="product__rating">
              <span className="product__rating-stars" aria-hidden="true">
                {"★".repeat(Math.round(rating))}
                {"☆".repeat(5 - Math.round(rating))}
              </span>
              <span className="product__rating-text">
                {rating.toFixed(1)} ({product.review_count} review{product.review_count === 1 ? "" : "s"})
              </span>
            </div>
          )}

          <p className="product__price">{priceLabel}</p>

          {product.colors?.length > 0 && (
            <div className="product__colors">
              <p className="product__colors-label">Color: {selectedColor}</p>
              <div className="product__colors-row">
                {product.colors.map((color) => (
                  <button
                    type="button"
                    key={color}
                    className={`product__color-swatch${selectedColor === color ? " is-active" : ""}`}
                    onClick={() => setSelectedColor(color)}
                    aria-label={color}
                    aria-pressed={selectedColor === color}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="product__stock">
            {inStock ? (
              <span className="product__stock-badge product__stock-badge--in">
                In stock — {product.stock_quantity} left
              </span>
            ) : (
              <span className="product__stock-badge product__stock-badge--out">
                Sold out
              </span>
            )}
          </div>

          <div className="product__purchase-row">
            <div className="product__qty">
              <button
                type="button"
                onClick={decrement}
                aria-label="Decrease quantity"
                disabled={!inStock}
              >
                −
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                onClick={increment}
                aria-label="Increase quantity"
                disabled={!inStock}
              >
                +
              </button>
            </div>
            <button
              className="product__cta"
              disabled={!inStock}
              onClick={handleAddToCart}
            >
              {!inStock ? "Sold out" : justAdded ? "Added ✓" : "Add to cart"}
            </button>
            <button
              className="product__cta product__cta--secondary"
              disabled={!inStock}
              onClick={handleBuyNow}
            >
              Buy Now
            </button>
          </div>

          <p className="product__handmade-notice">
            Each piece is handmade, so small variations make every item unique.
          </p>

          <div className="product__tabs">
            <div className="product__tabs-nav" role="tablist">
              {TABS.map((tab, i) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === i}
                  className={`product__tab${activeTab === i ? " is-active" : ""}`}
                  onClick={() => setActiveTab(i)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="product__tab-panel" role="tabpanel">
              <p>{tabContent[TABS[activeTab]]}</p>
            </div>
          </div>
        </div>
      </div>

      {similarProducts.length > 0 && (
        <section className="product__similar">
          <h2 className="product__similar-title">Shop Similar</h2>
          <div className="product__similar-grid">
            {similarProducts.map((p) => (
              <Link
                to={`/product/${p.id}`}
                key={p.id}
                className="similar-card"
              >
                <div className="similar-card__image-wrap">
                  <img
                    src={getImageUrl(getPrimaryImage(p)) || "/placeholder.jpg"}
                    alt={p.name}
                    className="similar-card__image"
                  />
                </div>
                <p className="similar-card__name">{p.name}</p>
                <p className="similar-card__price">
                  ${(p.price_cents / 100).toFixed(2)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {recentlyViewed.length > 0 && (
        <section className="product__similar">
          <h2 className="product__similar-title">Recently Viewed</h2>
          <div className="product__similar-grid">
            {recentlyViewed.map((p) => (
              <Link to={`/product/${p.id}`} key={p.id} className="similar-card">
                <div className="similar-card__image-wrap">
                  <img
                    src={getImageUrl(getPrimaryImage(p)) || "/placeholder.jpg"}
                    alt={p.name}
                    className="similar-card__image"
                  />
                </div>
                <p className="similar-card__name">{p.name}</p>
                <p className="similar-card__price">
                  ${(p.price_cents / 100).toFixed(2)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
