import "./FAQ.css";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useContentList } from "../context/SiteContext.jsx";

const DEFAULT_CATEGORIES = [
  { key: "orders", label: "Orders", tone: "lavender" },
  { key: "custom", label: "Custom Orders", tone: "butter" },
  { key: "products", label: "Products", tone: "mint" },
  { key: "shipping", label: "Shipping", tone: "coral" },
  { key: "care", label: "Care", tone: "powder" },
  { key: "returns", label: "Returns", tone: "pink" },
];

const QUESTIONS = [
  {
    category: "orders",
    q: "How do I place an order?",
    a: "Add pieces to your cart from the Shop, then head to checkout — you'll confirm your details and pay cash on delivery, no card needed.",
  },
  {
    category: "orders",
    q: "Can I modify my order?",
    a: "Reach out on the Contact page as soon as possible with your order number. We can usually adjust an order before it enters production.",
  },
  {
    category: "custom",
    q: "Do you accept custom requests?",
    a: "Yes! Head to the Custom Orders page and tell us about the piece, colors, and size you have in mind.",
  },
  {
    category: "custom",
    q: "How long do custom orders take?",
    a: "Most custom pieces are worked within 2–4 weeks, depending on the design and current queue.",
  },
  {
    category: "products",
    q: "What materials do you use?",
    a: "Mostly 100% cotton and acrylic yarns, chosen piece by piece for durability and softness. Each product page lists its exact materials.",
  },
  {
    category: "products",
    q: "Can I choose the colors?",
    a: "Many pieces come in a few colorways shown on the product page — for anything outside that, a Custom Order is the way to go.",
  },
  {
    category: "products",
    q: "Are handmade pieces identical?",
    a: "Not quite — small variations in tension, shape, and color are part of what makes each handmade piece one of a kind, not a defect.",
  },
  {
    category: "shipping",
    q: "Where do you ship?",
    a: "Currently within the country only. International shipping is on the roadmap — let us know on the Contact page if you'd like to be notified.",
  },
  {
    category: "shipping",
    q: "How long does shipping take?",
    a: "In-stock pieces ship within 3–5 business days after preparation. Custom pieces ship as soon as they're finished.",
  },
  {
    category: "shipping",
    q: "How much is shipping?",
    a: "A flat $5.00 rate applies to every order, calculated automatically at checkout.",
  },
  {
    category: "care",
    q: "How should I wash my crochet piece?",
    a: "Hand wash in cold water and lay flat to dry. Avoid the dryer, which can cause shrinking or misshaping.",
  },
  {
    category: "care",
    q: "How should I store it?",
    a: "Fold rather than hang, and keep away from direct sunlight and humidity to preserve color and shape.",
  },
  {
    category: "returns",
    q: "Can I return an item?",
    a: "Since most pieces are handmade to order or in very limited quantity, we only accept returns for items that arrive damaged or defective.",
  },
  {
    category: "returns",
    q: "What happens if my order arrives damaged?",
    a: "Contact us within 7 days with a photo of the piece and we'll arrange a replacement or refund.",
  },
];

// Built-in questions, used when the API is unreachable. Admins manage the live
// list under FAQs.
const labelByKey = Object.fromEntries(DEFAULT_CATEGORIES.map((c) => [c.key, c.label]));
const FALLBACK = QUESTIONS.map((item) => ({
  category: labelByKey[item.category],
  question: item.q,
  answer: item.a,
}));
const TONES = ["lavender", "butter", "mint", "coral", "powder", "pink"];

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [openQuestion, setOpenQuestion] = useState(null);
  const faqs = useContentList("/api/faqs", FALLBACK);

  const { questions, categories } = useMemo(() => {
    const list = (faqs || []).map((f) => ({ category: f.category, q: f.question, a: f.answer }));
    const names = [...new Set(list.map((item) => item.category))];
    return {
      questions: list,
      categories: names.map((name, i) => ({ key: name, label: name, tone: TONES[i % TONES.length] })),
    };
  }, [faqs]);

  const toneByCategory = Object.fromEntries(categories.map((c) => [c.key, c.tone]));

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return questions.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      const matchesQuery =
        !query || item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [questions, activeCategory, search]);

  return (
    <main className="faq-page">
      <header className="faq-page__header">
        <p className="faq-page__eyebrow">Good to know</p>
        <h1 className="faq-page__title">Frequently Asked Questions</h1>
        <p className="faq-page__intro">
          Answers to the questions we hear most often — search, or browse by topic.
        </p>

        <div className="faq-page__search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Search questions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search FAQ"
          />
        </div>
      </header>

      <nav className="faq-page__categories" aria-label="FAQ categories">
        <button
          type="button"
          className={`faq-page__pill${activeCategory === "all" ? " is-active" : ""}`}
          onClick={() => setActiveCategory("all")}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            className={`faq-page__pill faq-page__pill--${cat.tone}${activeCategory === cat.key ? " is-active" : ""}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </nav>

      <section className="faq-page__body">
        {filtered.length === 0 ? (
          <p className="faq-page__empty">No questions match "{search}" yet — try another word, or ask us directly.</p>
        ) : (
          <div className="faq-page__list">
            {filtered.map((item) => {
              const isOpen = openQuestion === item.q;
              return (
                <div className={`faq-item faq-item--${toneByCategory[item.category]}`} key={item.q}>
                  <button
                    type="button"
                    className="faq-item__question"
                    aria-expanded={isOpen}
                    onClick={() => setOpenQuestion(isOpen ? null : item.q)}
                  >
                    <span className="faq-item__category">{item.category}</span>
                    <span className="faq-item__text">{item.q}</span>
                    <span className={`faq-item__chevron${isOpen ? " is-open" : ""}`} aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </button>
                  <div className={`faq-item__answer-wrap${isOpen ? " is-open" : ""}`}>
                    <div className="faq-item__answer-inner">
                      <p className="faq-item__answer">{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="faq-page__cta">
        <h2>Still have questions?</h2>
        <p>We're happy to help with anything not covered here.</p>
        <Link to="/contact" className="faq-page__cta-btn">
          Contact us
        </Link>
      </section>
    </main>
  );
}
