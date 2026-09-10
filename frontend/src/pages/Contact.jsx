import "./InfoPage.css";
import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.target);

    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          subject: form.get("subject"),
          message: form.get("message"),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }

      setSubmitted(true);
      e.target.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="info-page">
      <header className="info-page__header">
        <p className="info-page__eyebrow">Get in touch</p>
        <h1 className="info-page__title">Contact</h1>
        <p className="info-page__intro">
          Questions about an order, a custom piece, or just want to say hi? Reach out.
        </p>
      </header>

      <section className="info-page__section contact__layout">
        <div className="contact__card contact__card--info">
          <h2>Let's talk</h2>
          <p className="contact__card-note">
            We usually reply within a day. For order updates, tracking is fastest — for
            everything else, this is the place.
          </p>

          <a href="mailto:hello@rrand.shop" className="contact__email">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2.5" />
              <path d="M4 6.5l8 6.5 8-6.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            hello@rrand.shop
          </a>

          <div className="contact__socials">
            <a href="#" aria-label="WhatsApp" className="contact__social contact__social--whatsapp">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M6.5 17.5L4 20l2.6-2.4A8 8 0 1 1 9.5 19z" strokeLinejoin="round" />
                <path d="M9 9.8c0 3.4 2.8 6.2 6.2 6.2.5 0 1-.3 1.2-.8l.4-1a.9.9 0 0 0-.5-1.1l-1.6-.7a.9.9 0 0 0-1 .2l-.4.4a5 5 0 0 1-2.3-2.3l.4-.4a.9.9 0 0 0 .2-1L10.9 8a.9.9 0 0 0-1.1-.5l-1 .4c-.5.2-.8.7-.8 1.2z" />
              </svg>
              WhatsApp
            </a>
            <a href="#" aria-label="Instagram" className="contact__social">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
              </svg>
              Instagram
            </a>
            <a href="#" aria-label="TikTok" className="contact__social">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 4c.3 2.2 2 3.9 4.2 4.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              TikTok
            </a>
            <a href="#" aria-label="Pinterest" className="contact__social">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M9.5 18c1-3 1.5-5.5 1.5-7a2.5 2.5 0 1 1 2.9 2.4c-.3 1.3-1 3-1.6 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Pinterest
            </a>
          </div>
        </div>

        <div className="contact__card contact__card--form">
          <form className="info-form" onSubmit={handleSubmit}>
            <div className="info-form__row">
              <label>
                Name
                <input type="text" name="name" required />
              </label>
              <label>
                Email
                <input type="email" name="email" required />
              </label>
            </div>
            <label>
              Subject
              <input type="text" name="subject" placeholder="What's this about?" />
            </label>
            <label>
              Message
              <textarea name="message" required />
            </label>

            {error && <p className="info-form__error">{error}</p>}

            <button type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Send message"}
            </button>
            {submitted && (
              <p className="info-form__status">Thanks for reaching out — we'll reply soon.</p>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}
