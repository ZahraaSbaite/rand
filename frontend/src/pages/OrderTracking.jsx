import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./OrderTracking.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const STAGES = [
  { key: "received", label: "Order Received" },
  { key: "preparing", label: "Preparing" },
  { key: "crocheting", label: "Crocheting" },
  { key: "quality_check", label: "Quality Check" },
  { key: "ready", label: "Ready" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

export default function OrderTracking() {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("order_id") || "");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const lookup = async (e) => {
    e?.preventDefault();
    if (!orderId.trim() || !email.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch(
        `${API_URL}/api/orders/track?order_id=${encodeURIComponent(orderId)}&email=${encodeURIComponent(email)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setOrder(null);
        setError(data.error || "Order not found");
      } else {
        setOrder(data);
      }
    } catch {
      setOrder(null);
      setError("Something went wrong looking up your order.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get("order_id") && searchParams.get("email")) {
      lookup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStageIndex = order ? STAGES.findIndex((s) => s.key === order.tracking_stage) : -1;
  const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

  return (
    <main className="order-tracking">
      <header className="order-tracking__header">
        <p className="order-tracking__eyebrow">Where's my piece?</p>
        <h1 className="order-tracking__title">Track Your Order</h1>
        <p className="order-tracking__intro">
          Enter your order number and the email you used at checkout to see its current stage.
        </p>
      </header>

      <form className="order-tracking__form" onSubmit={lookup}>
        <label>
          Order number
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="e.g. 42"
            inputMode="numeric"
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Looking up…" : "Track Order"}
        </button>
      </form>

      {searched && error && <p className="order-tracking__error">{error}</p>}

      {order && (
        <div className="order-tracking__result">
          <div className="order-tracking__meta">
            <div>
              <span>Order</span>
              <strong>#{order.id}</strong>
            </div>
            <div>
              <span>Placed</span>
              <strong>{new Date(order.created_at).toLocaleDateString()}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{formatPrice(order.total_cents)}</strong>
            </div>
          </div>

          <ol className="order-tracking__timeline">
            {STAGES.map((stage, i) => (
              <li
                key={stage.key}
                className={`order-tracking__stage${i <= currentStageIndex ? " is-complete" : ""}${i === currentStageIndex ? " is-current" : ""}`}
              >
                <span className="order-tracking__dot" />
                <span className="order-tracking__label">{stage.label}</span>
              </li>
            ))}
          </ol>

          <ul className="order-tracking__items">
            {order.items.map((item, i) => (
              <li key={i}>
                {item.quantity} × {item.product_name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
