import "./InfoPage.css";
import TiltCard from "../components/TiltCard.jsx";
import heroHands from "../assets/hero-crochet-hands.jpg";
import heroGranny from "../assets/hero-granny-square.jpg";
import { useContentList } from "../context/SiteContext.jsx";
import { getImageUrl } from "../utils/imageUrl.js";

// Used when the API is unreachable or empty; the admin adds Lookbook entries.
const FALLBACK = [
  { id: "hands", image: heroHands, title: "In the studio — hands at work" },
  { id: "granny", image: heroGranny, title: "Granny squares, in progress" },
];

export default function Lookbook() {
  const items = useContentList("/api/journal", FALLBACK) || [];
  return (
    <main className="info-page">
      <header className="info-page__header">
        <h1 className="info-page__title">Lookbook</h1>
        <p className="info-page__intro">
          A running record of pieces, process shots, and styling from the studio.
        </p>
      </header>

      <section className="info-page__section">
        <div className="lookbook__grid">
          {items.map((item) => (
            <TiltCard as="figure" className="lookbook__item" key={item.id} max={7}>
              <img src={item.image || getImageUrl(item.image_url) || heroGranny} alt={item.title} loading="lazy" />
              <figcaption className="lookbook__caption">
                {item.title}
                {item.story && <span className="lookbook__story">{item.story}</span>}
              </figcaption>
            </TiltCard>
          ))}
        </div>
      </section>
    </main>
  );
}
