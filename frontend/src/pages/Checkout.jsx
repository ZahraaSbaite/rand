import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { lineKey, useCart } from "../context/CartContext.jsx";
import { useSite } from "../context/SiteContext.jsx";
import { FLAT_DELIVERY_CENTS, formatPrice, parseDeliveryZones } from "../lib/delivery.js";
import "./Checkout.css";
import { variantLabel } from "../lib/productOptions.js";

const API_URL = import.meta.env.VITE_API_URL || "";
const STEPS = ["Customer Info", "Delivery", "Payment"];

export default function Checkout() {
  const { cartRefs, clearCart } = useCart();
  const { settings } = useSite();
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
    deliveryArea: "",
    paymentMethod: "cash_on_delivery",
  });

  const zones = parseDeliveryZones(settings.delivery_zones);
  const zone = zones.find((z) => z.area === form.deliveryArea);
  const bankDetails = settings.bank_transfer_details.trim();

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
            if (!product) return null;
            const variant = product.variants?.find((v) => v.id === ref.variant_id);
            return {
              ...product,
              quantity: ref.quantity,
              variant_id: ref.variant_id ?? null,
              colors: ref.colors || [],
              variant_label: [variantLabel(product, variant), (ref.colors || []).join(", ")].filter(Boolean).join(" · "),
              key: lineKey(ref),
            };
          })
          .filter(Boolean);
        setItems(cartItems);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [cartRefs]);

  const subtotalCents = items.reduce((sum, item) => sum + item.price_cents * item.quantity, 0);
  // Unknown until an area is picked, when the shop has delivery areas.
  const shippingCents = zones.length === 0 ? FLAT_DELIVERY_CENTS : zone?.fee_cents ?? null;
  const totalCents = subtotalCents + (shippingCents ?? 0);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const stepValid = {
    0: form.name.trim() && form.email.trim() && form.phone.trim(),
    1: form.address.trim() && form.city.trim() && form.country.trim() && (zones.length === 0 || zone),
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
          delivery_area: zone?.area ?? null,
          payment_method: form.paymentMethod,
          items: items.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
            variant_id: item.variant_id,
            colors: item.colors,
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
              {zones.length > 0 && (
                <fieldset className="checkout__choices">
                  <legend>Delivery area</legend>
                  {zones.map((z) => (
                    <label key={z.area} className="checkout__choice">
                      <input
                        type="radio"
                        name="deliveryArea"
                        value={z.area}
                        checked={form.deliveryArea === z.area}
                        onChange={handleChange}
                      />
                      <span className="checkout__choice-text">
                        <strong>{z.area}</strong>
                        {z.eta && <span>Usually arrives in {z.eta}</span>}
                      </span>
                      <span className="checkout__choice-price">
                        {z.fee_cents === 0 ? "Free" : formatPrice(z.fee_cents)}
                      </span>
                    </label>
                  ))}
                </fieldset>
              )}
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
                <h3>Delivering to</h3>
                <p>{[form.address, form.city, form.country, form.postalCode].filter(Boolean).join(", ")}</p>
                {zone?.eta && <p>Usually arrives in {zone.eta}.</p>}
              </div>
              <fieldset className="checkout__choices">
                <legend>How would you like to pay?</legend>
                <label className="checkout__choice">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash_on_delivery"
                    checked={form.paymentMethod === "cash_on_delivery"}
                    onChange={handleChange}
                  />
                  <span className="checkout__choice-text">
                    <strong>Cash on delivery</strong>
                    <span>Pay the courier when your order arrives.</span>
                  </span>
                </label>
                {bankDetails && (
                  <label className="checkout__choice">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={form.paymentMethod === "bank_transfer"}
                      onChange={handleChange}
                    />
                    <span className="checkout__choice-text">
                      <strong>Bank transfer</strong>
                      <span>We'll send the account details. We start on your order once the money arrives.</span>
                    </span>
                  </label>
                )}
              </fieldset>
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
              <li key={item.key}>
                <span>
                  {item.quantity} × {item.name}
                  {item.variant_label && <> · {item.variant_label}</>}
                </span>
                <span>{formatPrice(item.price_cents * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="checkout__summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotalCents)}</span>
          </div>
          <div className="checkout__summary-row">
            <span>Delivery{zone ? ` · ${zone.area}` : ""}</span>
            <span>{shippingCents === null ? "Choose an area" : formatPrice(shippingCents)}</span>
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
