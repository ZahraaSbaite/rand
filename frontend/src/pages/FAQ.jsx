import "./FAQ.css";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const TONES = ["lavender", "butter", "mint", "coral", "powder", "pink"];

function toneForCategory(category, categories) {
  const idx = categories.indexOf(category);
  return TONES[idx % TONES.length];
}

export default function FAQ() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [openQuestion, setOpenQuestion] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/faqs`)
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data);
        setOpenQuestion(data[0]?.id ?? null);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(
    () => [...new Set(questions.map((q) => q.category))],
    [questions]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return questions.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      const matchesQuery =
        !query ||
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query);
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
            key={cat}
            type="button"
            className={`faq-page__pill faq-page__pill--${toneForCategory(cat, categories)}${activeCategory === cat ? " is-active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </nav>

      <section className="faq-page__body">
        {loading ? (
          <p className="faq-page__empty">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="faq-page__empty">
            No questions match "{search}" yet — try another word, or ask us directly.
          </p>
        ) : (
          <div className="faq-page__list">
            {filtered.map((item) => {
              const isOpen = openQuestion === item.id;
              return (
                <div
                  className={`faq-item faq-item--${toneForCategory(item.category, categories)}`}
                  key={item.id}
                >
                  <button
                    type="button"
                    className="faq-item__question"
                    aria-expanded={isOpen}
                    onClick={() => setOpenQuestion(isOpen ? null : item.id)}
                  >
                    <span className="faq-item__category">{item.category}</span>
                    <span className="faq-item__text">{item.question}</span>
                    <span className={`faq-item__chevron${isOpen ? " is-open" : ""}`} aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </button>
                  <div className={`faq-item__answer-wrap${isOpen ? " is-open" : ""}`}>
                    <div className="faq-item__answer-inner">
                      <p className="faq-item__answer">{item.answer}</p>
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
