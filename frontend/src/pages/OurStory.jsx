import "./InfoPage.css";
import heroHands from "../assets/hero-crochet-hands.jpg";
import heroGranny from "../assets/hero-granny-square.jpg";
import { useContentList } from "../context/SiteContext.jsx";
import { getImageUrl } from "../utils/imageUrl.js";

const FALLBACK_IMAGES = [heroHands, heroGranny];

// Used when the API is unreachable; the admin edits these as Story blocks.
const FALLBACK = [
  {
    id: 1,
    heading: "How it began",
    body: "What started as a way to unwind after long days turned into something bigger — friends asking where a bag or a scarf came from, then asking to buy one for themselves. RRAND was born out of that word-of-mouth, one stitch at a time.",
  },
  {
    id: 2,
    heading: "Small-batch, on purpose",
    body: "Every piece is made in limited quantities and sold as it's finished — no mass production, no overseas factories. Just yarn, hooks, and time. That's why some pieces sell out and don't always come back the same way twice.",
  },
];

export default function OurStory() {
  const blocks = useContentList("/api/story-blocks", FALLBACK) || [];

  return (
    <main className="info-page">
      <header className="info-page__header">
        <h1 className="info-page__title">A World of Color + Thread</h1>
        <p className="info-page__intro">
          RRAND started as a hobby between projects and grew, one skein at a time, into a
          small studio built around slow, deliberate making.
        </p>
      </header>

      {blocks.map((block, i) => {
        const image = getImageUrl(block.image_url) || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length];
        const text = (
          <div className="our-story__text">
            <h2>{block.heading}</h2>
            {block.body.split(/\n{2,}/).map((para, j) => (
              <p key={j}>{para}</p>
            ))}
          </div>
        );
        const img = <img src={image} alt="" />;
        return (
          <section className="info-page__section" key={block.id ?? i}>
            <div className="our-story__block">
              {i % 2 === 0 ? (
                <>
                  {text}
                  {img}
                </>
              ) : (
                <>
                  {img}
                  {text}
                </>
              )}
            </div>
          </section>
        );
      })}
    </main>
  );
}
