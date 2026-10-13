import "./DesignChat.css";
import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api.js";

const GREETING =
  "Hi! Tell me about the piece you're dreaming of: what it is, who it's for, colours you love. I'll help you shape it into a design.";

const STARTERS = [
  "A tote bag for the beach",
  "A cosy scarf as a gift",
  "A cardigan in autumn colours",
];

const BUDGET_LABELS = {
  "under-30": "Under $30",
  "30-75": "$30 – $75",
  "75-150": "$75 – $150",
  "150-plus": "$150+",
};

const EMPTY_CONTACT = { name: "", email: "", phone: "" };

function formatDeadline(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** The design so far, filled in as the conversation goes. */
function DesignCard({ design, ready }) {
  const rows = design
    ? [
        ["Item", design.product_type],
        ["Colours", design.preferred_colors],
        ["Size", design.preferred_size],
        ["Quantity", design.quantity > 1 ? String(design.quantity) : design.product_type ? "1" : ""],
        ["Budget", BUDGET_LABELS[design.budget_range] || ""],
        ["Needed by", design.deadline ? formatDeadline(design.deadline) : ""],
      ]
    : [];

  return (
    <div className={`design-card${ready ? " is-ready" : ""}`}>
      <p className="design-card__label">Your design</p>
      <h3 className="design-card__title">{design?.title || "Taking shape…"}</h3>
      {design?.description ? (
        <p className="design-card__description">{design.description}</p>
      ) : (
        <p className="design-card__hint">Describe your idea in the chat and the details will appear here.</p>
      )}
      <dl className="design-card__facts">
        {rows.map(([label, value]) => (
          <div key={label} className={value ? "" : "is-empty"}>
            <dt>{label}</dt>
            <dd>{value || "—"}</dd>
          </div>
        ))}
      </dl>
      {design?.additional_notes && <p className="design-card__notes">{design.additional_notes}</p>}
    </div>
  );
}

export default function DesignChat({ onUseForm }) {
  const [messages, setMessages] = useState([]); // { role, content }, starting with the customer
  const [draft, setDraft] = useState("");
  const [design, setDesign] = useState(null);
  const [ready, setReady] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState(null);
  const [contact, setContact] = useState(EMPTY_CONTACT);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const logRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, thinking]);

  const send = async (text) => {
    const content = text.trim();
    if (!content || thinking) return;

    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setDraft("");
    setError(null);
    setThinking(true);
    try {
      const data = await api("/api/design-chat", { method: "POST", body: { messages: next } });
      setMessages([...next, { role: "assistant", content: data.reply }]);
      if (data.design) {
        setDesign(data.design);
        setReady(data.ready);
      }
    } catch (err) {
      // Take the unanswered message back so the conversation stays valid.
      setMessages(messages);
      setDraft(content);
      setError(err.message);
    } finally {
      setThinking(false);
      inputRef.current?.focus();
    }
  };

  const submitDesign = async (e) => {
    e.preventDefault();
    if (!design) return;
    setSending(true);
    setError(null);

    const form = new FormData();
    form.set("name", contact.name);
    form.set("email", contact.email);
    form.set("phone", contact.phone);
    form.set("product_type", design.product_type);
    form.set("quantity", String(design.quantity || 1));
    form.set("description", design.title ? `${design.title}: ${design.description}` : design.description);
    form.set("preferred_colors", design.preferred_colors);
    form.set("preferred_size", design.preferred_size);
    form.set("deadline", design.deadline);
    form.set("budget_range", design.budget_range);
    form.set(
      "additional_notes",
      [design.additional_notes, "Designed with the AI designer on the Custom Orders page."].filter(Boolean).join("\n\n")
    );

    try {
      await api("/api/custom-orders", { method: "POST", body: form });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const restart = () => {
    setMessages([]);
    setDesign(null);
    setReady(false);
    setError(null);
    setSent(false);
    setContact(EMPTY_CONTACT);
  };

  if (sent) {
    return (
      <div className="design-chat design-chat--sent" role="status">
        <h2>Your design is on its way</h2>
        <p>
          Thanks, {contact.name.split(" ")[0] || "friend"}! We'll look over your {design?.title || "design"} and reply
          to {contact.email} within 2–3 business days with the details and a price.
        </p>
        <button type="button" className="design-chat__ghost" onClick={restart}>
          Design another piece
        </button>
      </div>
    );
  }

  return (
    <div className="design-chat">
      <div className="design-chat__conversation">
        <div className="design-chat__head">
          <h2>Design it together</h2>
          <button type="button" className="design-chat__link" onClick={onUseForm}>
            Prefer a form?
          </button>
        </div>

        <ol className="design-chat__log" ref={logRef} aria-live="polite">
          <li className="design-chat__msg design-chat__msg--assistant">{GREETING}</li>
          {messages.map((m, i) => (
            <li key={i} className={`design-chat__msg design-chat__msg--${m.role}`}>
              {m.content}
            </li>
          ))}
          {thinking && (
            <li className="design-chat__msg design-chat__msg--assistant design-chat__msg--typing">
              <span className="design-chat__sr">The designer is writing…</span>
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </li>
          )}
        </ol>

        {messages.length === 0 && (
          <div className="design-chat__starters">
            {STARTERS.map((s) => (
              <button key={s} type="button" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {error && <p className="design-chat__error">{error}</p>}

        <form
          className="design-chat__input"
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <label className="design-chat__sr" htmlFor="design-chat-input">
            Message the designer
          </label>
          <textarea
            id="design-chat-input"
            ref={inputRef}
            rows={2}
            maxLength={2000}
            value={draft}
            placeholder={messages.length ? "Reply…" : "e.g. a navy bag for my sister, she loves the sea"}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
          />
          <button type="submit" disabled={thinking || !draft.trim()}>
            Send
          </button>
        </form>
      </div>

      <aside className="design-chat__side">
        <DesignCard design={design} ready={ready} />

        {ready && design && (
          <form className="design-chat__contact" onSubmit={submitDesign}>
            <p className="design-chat__contact-title">Happy with it? Send it to us</p>
            <label>
              Name
              <input
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
                autoComplete="name"
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                autoComplete="email"
                required
              />
            </label>
            <label>
              Phone
              <input
                type="tel"
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                autoComplete="tel"
                required
              />
            </label>
            <button type="submit" disabled={sending}>
              {sending ? "Sending…" : "Send my design"}
            </button>
            <p className="design-chat__fine">You can keep chatting to change it before you send.</p>
          </form>
        )}
      </aside>
    </div>
  );
}
