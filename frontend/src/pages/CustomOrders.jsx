import "./CustomOrders.css";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSite } from "../context/SiteContext.jsx";
import DesignChat from "../components/DesignChat.jsx";
import heroHands from "../assets/hero-crochet-hands.jpg";

const API_URL = import.meta.env.VITE_API_URL || "";

const PROCESS_STEPS = [
  { title: "Tell Us Your Idea", copy: "Pick the type of piece, colors, size and yarn, and add a photo if you have one.", tone: "lavender" },
  { title: "Get Your Quote", copy: "We send a price and a finish date. Approve it or decline it, no strings attached.", tone: "butter" },
  { title: "We Create It", copy: "Once you approve, your piece is worked by hand. Follow each step from your link.", tone: "mint" },
  { title: "You Receive It", copy: "Packaged with care and delivered to your door.", tone: "coral" },
];

const EXPECTATIONS = [
  "A quote within 2–3 business days, with the price and the date it will be ready.",
  "Nothing is started until you approve the quote.",
  "A private link to follow your piece, from quote to delivery.",
  "Payment is cash on delivery, same as the rest of the shop.",
];

const YARN_TYPES = ["Cotton", "Milk cotton", "Acrylic", "Wool blend", "Chenille / velvet", "Not sure, help me choose"];

export default function CustomOrders() {
  // The saved request, whose secret link lets the customer follow it.
  const [submitted, setSubmitted] = useState(null);
  const [capacity, setCapacity] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [searchParams] = useSearchParams();
  const presetColors = searchParams.get("colorway") || "";
  const { categories } = useSite();
  // The classic form comes first; the AI designer is an optional extra.
  const [aiEnabled, setAiEnabled] = useState(false);
  const [mode, setMode] = useState("form");

  useEffect(() => {
    fetch(`${API_URL}/api/design-chat`)
      .then((res) => (res.ok ? res.json() : { enabled: false }))
      .then((data) => setAiEnabled(Boolean(data.enabled)))
      .catch(() => setAiEnabled(false));
    fetch(`${API_URL}/api/custom-orders/capacity`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setCapacity)
      .catch(() => setCapacity(null));
  }, []);

  const bookFull = capacity?.limited && !capacity.open;

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

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setSubmitted(data);
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
        {bookFull ? (
          <div className="custom-orders__full" role="status">
            <h2>Our custom order book is full</h2>
            <p>
              We only take on as many pieces as we can make well, and right now the queue is full. Please check back
              soon, or browse the <Link to="/shop">pieces that are ready now</Link>.
            </p>
          </div>
        ) : submitted ? (
          <div className="custom-orders__full" role="status">
            <h2>Thanks, your request is in</h2>
            <p>
              We'll email {submitted.email} a quote with the price and finish date within 2–3 business days. You can
              follow your request, and approve the quote when it arrives, from your private page.
            </p>
            <p className="custom-orders__full-actions">
              <Link to={`/custom-order/${submitted.access_token}`} className="custom-orders__hero-cta">
                Follow your request
              </Link>
              <button type="button" className="custom-orders__again" onClick={() => setSubmitted(null)}>
                Send another request
              </button>
            </p>
          </div>
        ) : aiEnabled && mode === "ai" ? (
          <DesignChat onUseForm={() => setMode("form")} />
        ) : (
        <div className="custom-orders__form-layout">
          <form className="custom-orders__form" onSubmit={handleSubmit}>
            <h2>Request a piece</h2>
            {capacity?.limited && capacity.weeks_out > 0 && (
              <p className="custom-orders__queue">
                We're currently booked about {capacity.weeks_out} week{capacity.weeks_out === 1 ? "" : "s"} ahead.
              </p>
            )}

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
                Phone
                <input type="tel" name="phone" required />
              </label>
            </fieldset>

            <fieldset>
              <legend>Your idea</legend>
              <div className="custom-orders__row">
                <label>
                  Product type
                  <select name="product_type" defaultValue="">
                    <option value="" disabled>Select a type</option>
                    {categories.map((cat) => (
                      <option key={cat.slug} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
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
                <textarea name="description" placeholder="The piece, its shape, any details like a strap, lining or pattern…" required />
              </label>
              <div className="custom-orders__row">
                <label>
                  Preferred colors
                  <input type="text" name="preferred_colors" placeholder="e.g. sage green, cream" defaultValue={presetColors} />
                </label>
                <label>
                  Size / dimensions
                  <input type="text" name="preferred_size" placeholder="e.g. small, 12in tall" />
                </label>
              </div>
              <label>
                Yarn type
                <select name="yarn_type" defaultValue="">
                  <option value="">No preference</option>
                  {YARN_TYPES.map((yarn) => (
                    <option key={yarn} value={yarn}>
                      {yarn}
                    </option>
                  ))}
                </select>
              </label>
            </fieldset>

            <fieldset>
              <legend>Timeline &amp; budget</legend>
              <div className="custom-orders__row">
                <label>
                  Preferred delivery date <span className="custom-orders__optional">(optional)</span>
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
            {aiEnabled && (
              <p className="custom-orders__switch">
                Not sure yet?{" "}
                <button type="button" onClick={() => setMode("ai")}>
                  Design it with our AI helper instead
                </button>
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
        )}
      </section>
    </main>
  );
}
