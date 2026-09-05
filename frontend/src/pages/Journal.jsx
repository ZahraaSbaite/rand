import "./InfoPage.css";
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const FALLBACK_IMAGE = "https://placehold.co/700x700/e8e2f8/2a2420?text=RRAND";
const TAG_TONES = ["lavender", "mint", "coral"];

function toneForTag(tag) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_TONES[hash % TAG_TONES.length];
}

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/journal`)
      .then((res) => res.json())
      .then((data) => {
        setEntries(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <main className="info-page">
      <header className="info-page__header">
        <p className="info-page__eyebrow">From the studio</p>
        <h1 className="info-page__title">Journal</h1>
        <p className="info-page__intro">
          Stories behind the pieces — inspiration, process, and a look at what's on the hook.
        </p>
      </header>

      <section className="info-page__section">
        {loading ? (
          <p className="info-page__intro">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="info-page__intro">No journal entries yet — check back soon.</p>
        ) : (
          <div className="journal__list">
            {entries.map((entry, i) => (
              <article className="journal__entry" key={entry.id}>
                <div className="journal__text">
                  <div className="journal__meta">
                    <span className={`journal__tag journal__tag--${toneForTag(entry.tag)}`}>
                      {entry.tag}
                    </span>
                    <span className="journal__date">
                      {new Date(entry.entry_date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <h2>{entry.title}</h2>
                  <p>{entry.story}</p>
                </div>
                <img
                  src={entry.image_url || FALLBACK_IMAGE}
                  alt={entry.title}
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
