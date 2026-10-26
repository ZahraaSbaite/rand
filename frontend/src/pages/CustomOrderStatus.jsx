import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { getImageUrl } from "../utils/imageUrl.js";
import "./OrderTracking.css";
import "./CustomOrderStatus.css";

const STAGES = [
  { key: "new", label: "Request received" },
  { key: "quoted", label: "Quote sent" },
  { key: "approved", label: "Approved" },
  { key: "in_progress", label: "Crocheting" },
  { key: "ready", label: "Ready" },
  { key: "shipped", label: "Shipped" },
  { key: "completed", label: "Delivered" },
];

// A request that stopped before production stays at the quote step.
const STOPPED = {
  quote_declined: { stage: "quoted", text: "You declined this quote, so we won't start on it. Reply to our email if you'd like to talk it over." },
  declined: { stage: "new", text: "We're sorry, we can't take this piece on. Reply to our email if you'd like to talk about something different." },
};

const NEXT_STEP = {
  new: "We're looking at your idea and will email you a quote within 2–3 business days.",
  approved: "You're booked in. We'll email you when we start crocheting.",
  in_progress: "Your piece is on the hook right now.",
  ready: "Your piece is finished and packed. It will be on its way soon.",
  shipped: "Your piece is on its way. Please have the payment ready, since it's cash on delivery.",
  completed: "Delivered. We hope you love it!",
};

const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;
const formatDate = (value) =>
  value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { dateStyle: "long" }) : "";

function QuoteDecision({ token, onChange }) {
  const [address, setAddress] = useState("");
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const send = async (action, body) => {
    setBusy(true);
    setError(null);
    try {
      onChange(await api(`/api/custom-orders/track/${token}/${action}`, { method: "POST", body }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (declining) {
    return (
      <form
        className="custom-status__decide"
        onSubmit={(e) => {
          e.preventDefault();
          send("decline", { reason });
        }}
      >
        <label>
          Anything we should know? <span className="custom-status__optional">(optional)</span>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} rows={3} />
        </label>
        {error && <p className="order-tracking__error">{error}</p>}
        <div className="custom-status__actions">
          <button type="submit" className="custom-status__secondary" disabled={busy}>
            {busy ? "Sending…" : "Decline the quote"}
          </button>
          <button type="button" className="custom-status__link" onClick={() => setDeclining(false)}>
            Go back
          </button>
        </div>
      </form>
    );
  }

  return (
    <form
      className="custom-status__decide"
      onSubmit={(e) => {
        e.preventDefault();
        send("approve", { shipping_address: address });
      }}
    >
      <label>
        Delivery address
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Street, city, country, postal code"
          maxLength={500}
          rows={3}
          required
        />
      </label>
      {error && <p className="order-tracking__error">{error}</p>}
      <div className="custom-status__actions">
        <button type="submit" disabled={busy}>
          {busy ? "Sending…" : "Approve and book it in"}
        </button>
        <button type="button" className="custom-status__link" onClick={() => setDeclining(true)}>
          Decline
        </button>
      </div>
      <p className="custom-status__note">Payment is cash on delivery. Approving books your piece into our queue.</p>
    </form>
  );
}

export default function CustomOrderStatus() {
  const { token } = useParams();
  const [request, setRequest] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api(`/api/custom-orders/track/${token}`)
      .then(setRequest)
      .catch((err) => setError(err.message));
  }, [token]);

  if (error) {
    return (
      <main className="order-tracking">
        <p className="order-tracking__error">{error}</p>
      </main>
    );
  }
  if (!request) {
    return (
      <main className="order-tracking">
        <p className="custom-status__loading">Loading your request…</p>
      </main>
    );
  }

  const stopped = STOPPED[request.status];
  const current = STAGES.findIndex((s) => s.key === (stopped?.stage ?? request.status));
  const hasQuote = request.quote_cents != null && request.status !== "new";
  const details = [
    ["Colors", request.preferred_colors],
    ["Size", request.preferred_size],
    ["Yarn", request.yarn_type],
    ["Quantity", request.quantity],
    ["Wanted by", formatDate(request.deadline)],
  ].filter(([, value]) => value);

  return (
    <main className="order-tracking">
      <header className="order-tracking__header">
        <p className="order-tracking__eyebrow">Custom request #{request.id}</p>
        <h1 className="order-tracking__title">{request.product_type || "Your custom piece"}</h1>
        <p className="order-tracking__intro">
          {stopped ? stopped.text : request.status === "quoted" ? "Your quote is ready. Approve it to book your piece in, or decline it." : NEXT_STEP[request.status]}
        </p>
      </header>

      <div className="order-tracking__result">
        <ol className="order-tracking__timeline">
          {STAGES.map((stage, i) => (
            <li
              key={stage.key}
              className={`order-tracking__stage${i <= current ? " is-complete" : ""}${i === current ? " is-current" : ""}`}
            >
              <span className="order-tracking__dot" />
              <span className="order-tracking__label">{stage.label}</span>
            </li>
          ))}
        </ol>

        {hasQuote && (
          <section className="custom-status__quote">
            <h2>Your quote</h2>
            <div className="order-tracking__meta">
              <div>
                <span>Price</span>
                <strong>{formatPrice(request.quote_cents)}</strong>
              </div>
              <div>
                <span>Ready by</span>
                <strong>{formatDate(request.quote_ready_by)}</strong>
              </div>
              {request.shipping_address && (
                <div>
                  <span>Delivering to</span>
                  <strong>{request.shipping_address}</strong>
                </div>
              )}
            </div>
            {request.quote_message && <p className="custom-status__message">{request.quote_message}</p>}
            {request.status === "quoted" && <QuoteDecision token={token} onChange={setRequest} />}
          </section>
        )}

        <section className="custom-status__details">
          <h2>What you asked for</h2>
          <p>{request.description}</p>
          {details.length > 0 && (
            <dl>
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}
          {request.additional_notes && <p className="custom-status__note">{request.additional_notes}</p>}
          {request.inspiration_image_url && (
            <img src={getImageUrl(request.inspiration_image_url)} alt="Your inspiration" className="custom-status__image" />
          )}
        </section>

        <p className="custom-status__note">
          Keep this page's link to come back to it. Questions? <Link to="/contact">Get in touch</Link>.
        </p>
      </div>
    </main>
  );
}
