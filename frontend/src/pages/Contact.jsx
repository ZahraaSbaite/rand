import "./InfoPage.css";
import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

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

      <section className="info-page__section">
        <div className="contact__details">
          <a href="mailto:hello@rrand.shop">hello@rrand.shop</a>
          <div className="contact__socials">
            <a href="#" aria-label="WhatsApp" className="contact__whatsapp">WhatsApp</a>
            <a href="#" aria-label="Instagram">IG</a>
            <a href="#" aria-label="TikTok">TT</a>
            <a href="#" aria-label="Pinterest">PIN</a>
          </div>
        </div>

        <form className="info-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input type="text" name="name" required />
          </label>
          <label>
            Email
            <input type="email" name="email" required />
          </label>
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
      </section>
    </main>
  );
}
