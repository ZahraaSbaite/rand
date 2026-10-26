import { Link, useLocation, useParams } from "react-router-dom";
import { useSite } from "../context/SiteContext.jsx";
import { formatPrice } from "../lib/delivery.js";
import "./OrderConfirmation.css";

export default function OrderConfirmation() {
  const { id } = useParams();
  const location = useLocation();
  const { order, items, email } = location.state || {};
  const bankDetails = useSite().settings.bank_transfer_details.trim();
  const awaitingTransfer = order?.payment_method === "bank_transfer";

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
        {awaitingTransfer ? (
          <>
            Order <strong>#{id}</strong> is saved. We'll start on it as soon as your bank transfer
            arrives.
          </>
        ) : (
          <>Order <strong>#{id}</strong> — we'll start preparing your piece right away.</>
        )}
      </p>

      {awaitingTransfer && bankDetails && (
        <div className="order-confirmation__card order-confirmation__bank">
          <h2>Bank transfer details</h2>
          <p>
            Please transfer <strong>{formatPrice(order.total_cents)}</strong> to:
          </p>
          <p className="order-confirmation__bank-details">{bankDetails}</p>
          <p>
            Use <strong>Order #{id}</strong> as the reference. These details are in your
            confirmation email too.
          </p>
        </div>
      )}

      {items && items.length > 0 && (
        <div className="order-confirmation__card">
          <h2>Order details</h2>
          <ul className="order-confirmation__items">
            {items.map((item) => (
              <li key={`${item.id}-${item.variant_id ?? ""}`}>
                <span>
                  {item.quantity} × {item.name}
                  {item.variant_label && <> · {item.variant_label}</>}
                </span>
                <span>{formatPrice(item.price_cents * item.quantity)}</span>
              </li>
            ))}
          </ul>
          {order?.delivery_fee_cents !== undefined && (
            <div className="order-confirmation__delivery">
              <span>Delivery{order.delivery_area ? ` · ${order.delivery_area}` : ""}</span>
              <span>{formatPrice(order.delivery_fee_cents)}</span>
            </div>
          )}
          {order?.total_cents !== undefined && (
            <div className="order-confirmation__total">
              <span>{awaitingTransfer ? "Total to transfer" : "Total, paid on delivery"}</span>
              <span>{formatPrice(order.total_cents)}</span>
            </div>
          )}
          <p className="order-confirmation__eta">
            Estimated preparation time: <strong>2–5 business days</strong>, depending on the pieces
            ordered.
            {order?.delivery_eta && (
              <>
                {" "}Then delivery usually takes <strong>{order.delivery_eta}</strong>.
              </>
            )}
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
