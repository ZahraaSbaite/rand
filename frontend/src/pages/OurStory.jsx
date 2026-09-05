import "./InfoPage.css";
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const FALLBACK_IMAGE = "https://placehold.co/800x600/e8e2f8/2a2420?text=RRAND";

export default function OurStory() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/story-blocks`)
      .then((res) => res.json())
      .then((data) => {
        setBlocks(data);
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
        <p className="info-page__eyebrow">Our story</p>
        <h1 className="info-page__title">A World of Color + Thread</h1>
        <p className="info-page__intro">
          RRAND started as a hobby between projects and grew, one skein at a time, into a
          small studio built around slow, deliberate making.
        </p>
      </header>

      <section className="info-page__section">
        {loading ? (
          <p className="info-page__intro">Loading…</p>
        ) : (
          <div className="our-story__list">
            {blocks.map((block) => (
              <div className="our-story__block" key={block.id}>
                <div className="our-story__text">
                  <h2>{block.heading}</h2>
                  <p>{block.body}</p>
                </div>
                <img src={block.image_url || FALLBACK_IMAGE} alt={block.heading} />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
