import "./Wishlist.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useCustomerAuth } from "../context/CustomerAuthContext.jsx";
import { SkeletonWishlistGrid } from "../components/Skeleton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { getImageUrl, getPrimaryImage } from "../utils/imageUrl.js";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export default function Wishlist() {
  const { wishlistIds, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { customer, loading: authLoading } = useCustomerAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wishlistIds.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${API_URL}/api/products`)
      .then((res) => res.json())
      .then((allProducts) => {
        setItems(allProducts.filter((p) => wishlistIds.includes(p.id)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [wishlistIds]);

  const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

  return (
    <main className="wishlist-page">
      <header className="wishlist-page__header">
        <p className="wishlist-page__eyebrow">Saved for later</p>
        <h1 className="wishlist-page__title">
          Wishlist {items.length > 0 && <span>({items.length})</span>}
        </h1>
      </header>

      {authLoading ? (
        <SkeletonWishlistGrid />
      ) : !customer ? (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path
                d="M12 21s-7.5-4.6-10-9.2C.5 8.5 2 5 5.5 5c2 0 3.5 1.2 4.5 2.7C11 6.2 12.5 5 14.5 5 18 5 19.5 8.5 18 11.8 15.5 16.4 12 21 12 21z"
                strokeLinejoin="round"
              />
            </svg>
          }
          title="Log in to see your wishlist"
          subtitle="Create an account or log in to save pieces and come back to them anytime."
          ctaText="Log in"
          ctaTo="/login"
        />
      ) : loading ? (
        <SkeletonWishlistGrid />
      ) : items.length === 0 ? (
        <div className="wishlist-page__empty">
          <div className="wishlist-page__empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d="M12 21s-7.5-4.6-10-9.2C.5 8.5 2 5 5.5 5c2 0 3.5 1.2 4.5 2.7C11 6.2 12.5 5 14.5 5 18 5 19.5 8.5 18 11.8 15.5 16.4 12 21 12 21z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p>Nothing saved yet — tap the heart on any piece to keep it here.</p>
          <Link to="/shop" className="wishlist-page__cta">
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className="wishlist-page__grid">
          {items.map((item) => (
            <div className="wishlist-card" key={item.id}>
              <Link to={`/product/${item.id}`} className="wishlist-card__image-wrap">
                <img
                  src={getImageUrl(getPrimaryImage(item)) || "https://placehold.co/400x400/e8e2f8/2a2420?text=RRAND"}
                  alt={item.name}
                />
              </Link>
              <div className="wishlist-card__body">
                <Link to={`/product/${item.id}`} className="wishlist-card__name">
                  {item.name}
                </Link>
                <p className="wishlist-card__price">{formatPrice(item.price_cents)}</p>
                <div className="wishlist-card__actions">
                  <button onClick={() => addToCart(item.id, 1)}>Add to Cart</button>
                  <button
                    className="wishlist-card__remove"
                    onClick={() => removeFromWishlist(item.id)}
                    aria-label={`Remove ${item.name} from wishlist`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
