import "./InfoPage.css";
import heroHands from "../assets/hero-crochet-hands.jpg";
import heroGranny from "../assets/hero-granny-square.jpg";

export default function OurStory() {
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
        <div className="our-story__block">
          <div className="our-story__text">
            <h2>How it began</h2>
            <p>
              What started as a way to unwind after long days turned into something bigger —
              friends asking where a beanie or a plushie came from, then asking to buy one for
              themselves. RRAND was born out of that word-of-mouth, one stitch at a time.
            </p>
          </div>
          <img src={heroHands} alt="Hands crocheting" />
        </div>
      </section>

      <section className="info-page__section">
        <div className="our-story__block">
          <img src={heroGranny} alt="Granny square blanket in progress" />
          <div className="our-story__text">
            <h2>Small-batch, on purpose</h2>
            <p>
              Every piece is made in limited quantities and sold as it's finished — no
              mass production, no overseas factories. Just yarn, hooks, and time. That's why
              some pieces sell out and don't always come back the same way twice.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
