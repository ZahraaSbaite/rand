import { Link, useLocation, useParams } from "react-router-dom";
import "./OrderConfirmation.css";

export default function OrderConfirmation() {
  const { id } = useParams();
  const location = useLocation();
  const { order, items, email } = location.state || {};

  const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

  return (
    <main className="order-confirmation">
      <div className="order-confirmation__badge" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path
            d="M4 12l6 6L20 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className="order-confirmation__title">Your order is confirmed</h1>
      <p className="order-confirmation__sub">
        Order <strong>#{id}</strong> — we'll start preparing your piece right away.
      </p>

      {items && items.length > 0 && (
        <div className="order-confirmation__card">
          <h2>Order details</h2>
          <ul className="order-confirmation__items">
            {items.map((item) => (
              <li key={item.id}>
                <span>{item.quantity} × {item.name}</span>
                <span>{formatPrice(item.price_cents * item.quantity)}</span>
              </li>
            ))}
          </ul>
          {order?.total_cents !== undefined && (
            <div className="order-confirmation__total">
              <span>Total (incl. shipping)</span>
              <span>{formatPrice(order.total_cents)}</span>
            </div>
          )}
          <p className="order-confirmation__eta">
            Estimated preparation time: <strong>2–5 business days</strong>, depending on the pieces
            ordered.
          </p>
        </div>
      )}

      <div className="order-confirmation__actions">
        <Link
          to={`/order-tracking${email ? `?order_id=${id}&email=${encodeURIComponent(email)}` : ""}`}
          className="order-confirmation__btn-primary"
        >
          Track Order
        </Link>
        <Link to="/shop" className="order-confirmation__btn-secondary">
          Continue Shopping
        </Link>
      </div>
    </main>
  );
}
