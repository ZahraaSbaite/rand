import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import { getImageUrl } from "../utils/imageUrl.js";
import flyToCart from "../utils/flyToCart.js";
import "./ProductCard.css";

// Leaflet grounds rotate through the inks so a grid reads like a rack of
// pattern booklets.
const CARD_TONES = ["marigold", "avocado", "oat", "kraft"];

export default function ProductCard({ product, colorIndex = 0 }) {
  const price = (product.price_cents / 100).toFixed(2);
  const fallback = "https://placehold.co/600x800/f4e2b8/34201a?text=strand";
  const tone = CARD_TONES[colorIndex % CARD_TONES.length];
  const soldOut = product.stock_quantity !== undefined && Number(product.stock_quantity) <= 0;
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const [added, setAdded] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (soldOut) return;
    addToCart(product.id);
    flyToCart(e.currentTarget);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className={`product-card product-card--${tone}${soldOut ? " is-sold-out" : ""}`}
      style={{ "--stamp-rot": `${(colorIndex % 3) * 6 - 6}deg` }}
    >
      <div className="product-card__frame">
        <span className="product-card__stamp" aria-hidden="true">
          <small>No.</small>
          {product.id}
        </span>

        <button
          type="button"
          className={`product-card__wishlist${wishlisted ? " is-active" : ""}`}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={wishlisted}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
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

        <div className="product-card__image">
          <img
            src={getImageUrl(product.image_url) || fallback}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = fallback;
            }}
          />
        </div>
      </div>

      <div className="product-card__meta">
        <h3 className="product-card__name">{product.name}</h3>
        <div className="product-card__row">
          {soldOut ? (
            <p className="product-card__sold">Sold out, back when it's made</p>
          ) : (
            <>
              <p className="product-card__price">
                ${price}
                {product.category && <span className="product-card__category"> · {product.category}</span>}
              </p>
              <button
                type="button"
                className={`product-card__add${added ? " is-added" : ""}`}
                onClick={handleAdd}
                aria-label={`Add ${product.name} to cart`}
              >
                {added ? "Added" : "Add"}
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {added ? (
                    <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                  )}
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
