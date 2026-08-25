import { Link } from "react-router-dom";
import useTilt from "../hooks/useTilt.js";
import { useWishlist } from "../context/WishlistContext.jsx";
import "./ProductCard.css";

const CARD_TONES = [
  "lavender",
  "butter",
  "powder",
  "mint",
  "pink",
];

export default function ProductCard({ product, colorIndex = 0 }) {
  const price = (product.price_cents / 100).toFixed(2);
  const fallback = "https://placehold.co/600x600/e8e2f8/2a2420?text=RRAND";
  const tone = CARD_TONES[colorIndex % CARD_TONES.length];
  const tilt = useTilt();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  return (
    <Link
      to={`/product/${product.id}`}
      className={`product-card product-card--${tone}`}
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
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
          src={product.image_url || fallback}
          alt={product.name}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallback;
          }}
        />
      </div>
      <div className="product-card__meta">
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__price">${price}</p>
      </div>
    </Link>
  );
}
