import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useSite } from "../context/SiteContext.jsx";
import { FLAT_DELIVERY_CENTS, parseDeliveryZones } from "../lib/delivery.js";
import { hasOptions, isMadeToOrder, maxQuantity, variantInStock, variantLabel } from "../lib/productOptions.js";
import "./cart.css";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Cart() {
  const { cartRefs, removeFromCart, updateCartQuantity, updateCartVariant } = useCart();
  const { settings } = useSite();
  const zones = parseDeliveryZones(settings.delivery_zones);
  const offersBankTransfer = settings.bank_transfer_details.trim() !== "";
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
            if (!product) return null;
            const variant = product.variants?.find((v) => v.id === ref.variant_id);
            return {
              ...product,
              quantity: ref.quantity,
              variant,
              variant_id: ref.variant_id ?? null,
              variant_label: variantLabel(product, variant),
              buyable: product.status === "published" && variantInStock(product, variant),
            };
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
  // With delivery areas, the fee is only known once one is picked at checkout.
  const shippingCents = subtotalCents > 0 && zones.length === 0 ? FLAT_DELIVERY_CENTS : 0;
  const totalCents = subtotalCents + shippingCents;

  const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;
  const blocked = items.some((item) => !item.buyable);

  if (loading) {
    return (
      <main className="cart">
        <p className="cart__empty">Loading your cart…</p>
      </main>
    );
  }

  return (
    <main className="cart">
      <nav className="cart__crumb">
        <span>Home</span>
        <span className="cart__crumb-sep">/</span>
        <span>Cart</span>
      </nav>

      <h1 className="cart__title">
        Cart <span className="cart__count">({items.length} product{items.length !== 1 ? "s" : ""})</span>
      </h1>

      {items.length === 0 ? (
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
            {items.map((item) => {
              const lineKey = `${item.id}-${item.variant_id ?? ""}`;
              const most = Math.max(item.quantity, Math.min(5, maxQuantity(item, item.variant)));
              return (
              <div className="cart__item" key={lineKey}>
                <img
                  src={item.image_url}
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
                  {hasOptions(item) ? (
                    <label className="cart__item-color">
                      {item.option_groups.map((g) => g.name).join(" / ")}
                      <select
                        value={item.variant_id ?? ""}
                        onChange={(e) => updateCartVariant(item.id, item.variant_id, Number(e.target.value))}
                      >
                        {item.variants.map((v) => (
                          <option
                            key={v.id}
                            value={v.id}
                            disabled={v.id !== item.variant_id && !variantInStock(item, v)}
                          >
                            {variantLabel(item, v)}
                            {variantInStock(item, v) ? "" : " (sold out)"}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    item.yarn_color && (
                      <p className="cart__item-meta">Color: {item.yarn_color}</p>
                    )
                  )}
                  {isMadeToOrder(item) && (
                    <p className="cart__item-meta">
                      Made to order{item.production_time ? `, ready in ${item.production_time}` : ""}
                    </p>
                  )}
                  {!item.buyable && (
                    <p className="cart__item-warning">
                      {item.status === "published"
                        ? hasOptions(item)
                          ? "These options are sold out. Pick others or remove it."
                          : "Sold out. Please remove it to check out."
                        : "No longer available. Please remove it to check out."}
                    </p>
                  )}
                  <p className="cart__item-price">
                    {formatPrice(item.price_cents)}
                  </p>
                </div>
                <div className="cart__item-qty">
                  <label htmlFor={`qty-${lineKey}`}>Qty</label>
                  <select
                    id={`qty-${lineKey}`}
                    value={item.quantity}
                    onChange={(e) =>
                      updateCartQuantity(item.id, item.variant_id, Number(e.target.value))
                    }
                  >
                    {Array.from({ length: Math.max(1, most) }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="cart__item-remove"
                  onClick={() => removeFromCart(item.id, item.variant_id)}
                >
                  Remove
                </button>
              </div>
              );
            })}

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
              <span>Delivery</span>
              <span>
                {zones.length > 0
                  ? `From ${formatPrice(Math.min(...zones.map((z) => z.fee_cents)))}`
                  : formatPrice(shippingCents)}
              </span>
            </div>
            <div className="cart__summary-row cart__summary-total">
              <span>{zones.length > 0 ? "Total before delivery" : "Order total"}</span>
              <span>{formatPrice(totalCents)}</span>
            </div>

            <button
              type="button"
              className="cart__checkout-btn"
              onClick={() => navigate("/checkout")}
              disabled={blocked}
            >
              Proceed to checkout
            </button>

            <p className="cart__cod-note">
              {offersBankTransfer
                ? "Pay by cash on delivery or bank transfer. No card details needed."
                : "Payment by cash on delivery. No card details needed."}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
