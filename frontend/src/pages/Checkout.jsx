import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import "./Checkout.css";

const API_URL = import.meta.env.VITE_API_URL || "";
const STEPS = ["Customer Info", "Shipping", "Review"];

export default function Checkout() {
  const { cartRefs, clearCart } = useCart();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
  });

  useEffect(() => {
    if (cartRefs.length === 0) {
      setLoading(false);
      return;
    }

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
      .catch(() => setLoading(false));
  }, [cartRefs]);

  const subtotalCents = items.reduce((sum, item) => sum + item.price_cents * item.quantity, 0);
  const shippingCents = subtotalCents > 0 ? 500 : 0;
  const totalCents = subtotalCents + shippingCents;
  const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const stepValid = {
    0: form.name.trim() && form.email.trim() && form.phone.trim(),
    1: form.address.trim() && form.city.trim() && form.country.trim(),
    2: true,
  };

  const goNext = () => stepValid[step] && setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    setError(null);

    const fullAddress = [form.address, form.city, form.country, form.postalCode]
      .filter(Boolean)
      .join(", ");

    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          customer_address: fullAddress,
          items: items.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
            price_cents: item.price_cents,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order failed");

      clearCart();
      navigate(`/order-confirmation/${data.id}`, { state: { order: data, items, email: form.email } });
    } catch (err) {
      setError(err.message || "Something went wrong placing your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <main className="checkout"><p className="checkout__status">Loading…</p></main>;

  if (items.length === 0) {
    return (
      <main className="checkout">
        <div className="checkout__empty">
          <p>Your cart is empty — nothing to check out yet.</p>
          <Link to="/shop">Browse the shop</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout">
      <h1 className="checkout__title">Checkout</h1>

      <ol className="checkout__steps">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`checkout__step${i === step ? " is-active" : ""}${i < step ? " is-done" : ""}`}
          >
            <span className="checkout__step-number">{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      <div className="checkout__layout">
        <div className="checkout__form-panel">
          {step === 0 && (
            <div className="checkout__fields">
              <label>
                Full name
                <input name="name" value={form.name} onChange={handleChange} required />
              </label>
              <label>
                Email
                <input type="email" name="email" value={form.email} onChange={handleChange} required />
              </label>
              <label>
                Phone
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} required />
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="checkout__fields">
              <label>
                Street address
                <input name="address" value={form.address} onChange={handleChange} required />
              </label>
              <label>
                City
                <input name="city" value={form.city} onChange={handleChange} required />
              </label>
              <label>
                Country
                <input name="country" value={form.country} onChange={handleChange} required />
              </label>
              <label>
                Postal code <span className="checkout__optional">(optional)</span>
                <input name="postalCode" value={form.postalCode} onChange={handleChange} />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="checkout__review">
              <div className="checkout__review-block">
                <h3>Customer</h3>
                <p>{form.name} · {form.email} · {form.phone}</p>
              </div>
              <div className="checkout__review-block">
                <h3>Shipping to</h3>
                <p>{[form.address, form.city, form.country, form.postalCode].filter(Boolean).join(", ")}</p>
              </div>
              <div className="checkout__review-block">
                <h3>Payment</h3>
                <p>Cash on delivery — pay when your order arrives, no card needed.</p>
              </div>
              {error && <p className="checkout__error">{error}</p>}
            </div>
          )}

          <div className="checkout__actions">
            {step > 0 && (
              <button type="button" className="checkout__btn-secondary" onClick={goBack}>
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                className="checkout__btn-primary"
                onClick={goNext}
                disabled={!stepValid[step]}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                className="checkout__btn-primary"
                onClick={handlePlaceOrder}
                disabled={submitting}
              >
                {submitting ? "Placing order…" : "Place Order"}
              </button>
            )}
          </div>
        </div>

        <aside className="checkout__summary">
          <h2>Order Summary</h2>
          <ul className="checkout__summary-items">
            {items.map((item) => (
              <li key={item.id}>
                <span>{item.quantity} × {item.name}</span>
                <span>{formatPrice(item.price_cents * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="checkout__summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotalCents)}</span>
          </div>
          <div className="checkout__summary-row">
            <span>Shipping</span>
            <span>{formatPrice(shippingCents)}</span>
          </div>
          <div className="checkout__summary-row checkout__summary-total">
            <span>Total</span>
            <span>{formatPrice(totalCents)}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
