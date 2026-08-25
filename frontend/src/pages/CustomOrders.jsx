import "./CustomOrders.css";
import { useState } from "react";
import heroHands from "../assets/hero-crochet-hands.jpg";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const PROCESS_STEPS = [
  { title: "Tell Us Your Idea", copy: "Share the piece you're picturing — item, colors, inspiration.", tone: "lavender" },
  { title: "Choose Your Details", copy: "We'll confirm size, colorway, and quantity together.", tone: "butter" },
  { title: "We Create It", copy: "Your piece is worked by hand, start to finish.", tone: "mint" },
  { title: "You Receive It", copy: "Packaged with care and shipped to your door.", tone: "coral" },
];

const EXPECTATIONS = [
  "A reply within 2–3 business days to confirm details and price.",
  "Most pieces are worked within 2–4 weeks, depending on the queue.",
  "Payment is cash on delivery, same as the rest of the shop.",
  "We'll send a photo before it ships, so you know exactly what's coming.",
];

export default function CustomOrders() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.target);
    if (imageFile) formData.set("inspiration_image", imageFile);

    try {
      const res = await fetch(`${API_URL}/api/custom-orders`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }

      setSubmitted(true);
      e.target.reset();
      setImageFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="custom-orders">
      <section className="custom-orders__hero">
        <div className="custom-orders__hero-text">
          <p className="custom-orders__eyebrow">Made just for you</p>
          <h1 className="custom-orders__title">Custom Orders</h1>
          <p className="custom-orders__intro">
            Have a colorway, size, or idea in mind that isn't in the shop? Tell us about it —
            most custom pieces are worked within 2–4 weeks depending on the design and current queue.
          </p>
          <a href="#request-form" className="custom-orders__hero-cta">
            Start your request ↓
          </a>
        </div>
        <div className="custom-orders__hero-visual" aria-hidden="true">
          <div className="custom-orders__hero-frame">
            <img src={heroHands} alt="" />
          </div>
        </div>
      </section>

      <section className="custom-orders__process">
        <h2>How it works</h2>
        <ol className="custom-orders__steps">
          {PROCESS_STEPS.map((step, i) => (
            <li className={`custom-orders__step custom-orders__step--${step.tone}`} key={step.title}>
              <span className="custom-orders__step-number">{i + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="custom-orders__form-section" id="request-form">
        <div className="custom-orders__form-layout">
          <form className="custom-orders__form" onSubmit={handleSubmit}>
            <h2>Request a piece</h2>

            <fieldset>
              <legend>Your details</legend>
              <div className="custom-orders__row">
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
                Phone <span className="custom-orders__optional">(optional)</span>
                <input type="tel" name="phone" />
              </label>
            </fieldset>

            <fieldset>
              <legend>Your idea</legend>
              <div className="custom-orders__row">
                <label>
                  Product type
                  <select name="product_type" defaultValue="">
                    <option value="" disabled>Select a type</option>
                    <option value="Bag">Bag</option>
                    <option value="Flower">Flower</option>
                    <option value="Plushie">Plushie</option>
                    <option value="Accessory">Accessory</option>
                    <option value="Home decor">Home decor</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label>
                  Quantity
                  <input type="number" name="quantity" min="1" defaultValue="1" />
                </label>
              </div>
              <label>
                Describe your idea
                <textarea name="description" placeholder="Item, size, colors, inspiration…" required />
              </label>
              <div className="custom-orders__row">
                <label>
                  Preferred colors
                  <input type="text" name="preferred_colors" placeholder="e.g. sage green, cream" />
                </label>
                <label>
                  Preferred size
                  <input type="text" name="preferred_size" placeholder="e.g. small, 12in tall" />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Timeline &amp; budget</legend>
              <div className="custom-orders__row">
                <label>
                  Deadline <span className="custom-orders__optional">(optional)</span>
                  <input type="date" name="deadline" />
                </label>
                <label>
                  Budget range
                  <select name="budget_range" defaultValue="">
                    <option value="" disabled>Select a range</option>
                    <option value="under-30">Under $30</option>
                    <option value="30-75">$30 – $75</option>
                    <option value="75-150">$75 – $150</option>
                    <option value="150-plus">$150+</option>
                  </select>
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Extras</legend>
              <label>
                Upload inspiration image <span className="custom-orders__optional">(optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </label>
              <label>
                Additional notes
                <textarea name="additional_notes" placeholder="Anything else we should know?" />
              </label>
            </fieldset>

            {error && <p className="custom-orders__error">{error}</p>}

            <button type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Submit Custom Request"}
            </button>
            {submitted && (
              <p className="custom-orders__status">
                Thanks! We'll follow up by email within 2–3 business days.
              </p>
            )}
          </form>

          <aside className="custom-orders__sidebar">
            <div className="custom-orders__sidebar-card">
              <h3>What to expect</h3>
              <ul>
                {EXPECTATIONS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
