import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { SkeletonCart } from "../components/Skeleton.jsx";
import { getImageUrl, getPrimaryImage } from "../utils/imageUrl.js";
import "./Cart.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Cart() {
  const { cartRefs, removeFromCart, updateCartQuantity } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (cartRefs.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${API_URL}/api/products`)
      .then((res) => res.json())
      .then((allProducts) => {
        const cartItems = cartRefs
          .map((ref) => {
            const product = allProducts.find((p) => p.id === ref.product_id);
            return product ? { ...product, quantity: ref.quantity } : null;
          })
          .filter(Boolean);
        setItems(cartItems);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [cartRefs]);

  const subtotalCents = items.reduce(
    (sum, item) => sum + item.price_cents * item.quantity,
    0
  );
  const shippingCents = subtotalCents > 0 ? 500 : 0;
  const totalCents = subtotalCents + shippingCents;

  const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

  return (
    <main className="cart">
      <nav className="cart__crumb">
        <span>Home</span>
        <span className="cart__crumb-sep">/</span>
        <span>Cart</span>
      </nav>

      <h1 className="cart__title">
        Cart {!loading && <span className="cart__count">({items.length} product{items.length !== 1 ? "s" : ""})</span>}
      </h1>

      {loading ? (
        <SkeletonCart />
      ) : items.length === 0 ? (
        <div className="cart__empty-state">
          <div className="cart__empty-icon" aria-hidden="true">
            <svg viewBox="0 0 64 64">
              <path
                d="M14 22h36l-3.5 22a4 4 0 01-4 3.4H21.5a4 4 0 01-4-3.4L14 22z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M24 22v-4a8 8 0 0116 0v4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M22 33c3 2 6 2 10-1 4 3 7 3 10 1"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="cart__empty-title">Your cart is empty</p>
          <p className="cart__empty-sub">Looks like you haven't picked out a piece yet.</p>
          <Link to="/shop" className="cart__empty-cta">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="cart__layout">
          <div className="cart__items">
            {items.map((item) => (
              <div className="cart__item" key={item.id}>
                <img
                  src={getImageUrl(getPrimaryImage(item))}
                  alt={item.name}
                  className="cart__item-image"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      "https://placehold.co/200x200/f7f3ec/241f1b?text=No+Image";
                  }}
                />
                <div className="cart__item-details">
                  <p className="cart__item-name">{item.name}</p>
                  {item.yarn_color && (
                    <p className="cart__item-meta">Color: {item.yarn_color}</p>
                  )}
                  <p className="cart__item-price">
                    {formatPrice(item.price_cents)}
                  </p>
                </div>
                <div className="cart__item-qty">
                  <label htmlFor={`qty-${item.id}`}>Qty</label>
                  <select
                    id={`qty-${item.id}`}
                    value={item.quantity}
                    onChange={(e) =>
                      updateCartQuantity(item.id, Number(e.target.value))
                    }
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="cart__item-remove"
                  onClick={() => removeFromCart(item.id)}
                >
                  Remove
                </button>
              </div>
            ))}

            <Link to="/shop" className="cart__continue-link">
              ← Continue shopping
            </Link>
          </div>

          <div className="cart__summary">
            <h2>Summary</h2>
            <div className="cart__summary-row">
              <span>Subtotal</span>
              <span>{formatPrice(subtotalCents)}</span>
            </div>
            <div className="cart__summary-row">
              <span>Shipping</span>
              <span>{formatPrice(shippingCents)}</span>
            </div>
            <div className="cart__summary-row cart__summary-total">
              <span>Order total</span>
              <span>{formatPrice(totalCents)}</span>
            </div>

            <button
              type="button"
              className="cart__checkout-btn"
              onClick={() => navigate("/checkout")}
            >
              Proceed to checkout
            </button>

            <p className="cart__cod-note">
              Payment by cash on delivery. No card details needed.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
