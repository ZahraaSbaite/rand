import "./InfoPage.css";
import TiltCard from "../components/TiltCard.jsx";
import heroHands from "../assets/hero-crochet-hands.jpg";
import heroGranny from "../assets/hero-granny-square.jpg";

const LOOKBOOK_ITEMS = [
  { image: heroHands, caption: "In the studio — hands at work" },
  { image: heroGranny, caption: "Granny Square Blanket, in progress" },
  { image: "https://placehold.co/600x800/e8e2f8/2a2420?text=RRAND", caption: "Bags collection, Fall drop" },
  { image: "https://placehold.co/600x800/fad4cc/2a2420?text=RRAND", caption: "Flowers, styled in the window" },
  { image: "https://placehold.co/600x800/d4ede0/2a2420?text=RRAND", caption: "Plushies, fresh off the hook" },
  { image: "https://placehold.co/600x800/fff3b8/2a2420?text=RRAND", caption: "Home pieces, table styling" },
];

export default function Lookbook() {
  return (
    <main className="info-page">
      <header className="info-page__header">
        <p className="info-page__eyebrow">Visual archive</p>
        <h1 className="info-page__title">Lookbook</h1>
        <p className="info-page__intro">
          A running record of pieces, process shots, and styling from the studio.
        </p>
      </header>

      <section className="info-page__section">
        <div className="lookbook__grid">
          {LOOKBOOK_ITEMS.map((item) => (
            <TiltCard as="figure" className="lookbook__item" key={item.caption} max={7}>
              <img src={item.image} alt={item.caption} loading="lazy" />
              <figcaption className="lookbook__caption">{item.caption}</figcaption>
            </TiltCard>
          ))}
        </div>
      </section>
    </main>
  );
}
