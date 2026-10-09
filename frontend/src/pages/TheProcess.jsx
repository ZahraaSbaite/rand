import "./InfoPage.css";
import TiltCard from "../components/TiltCard.jsx";
import { useContentList } from "../context/SiteContext.jsx";

// Used when the API is unreachable; the admin edits these as Process steps.
const STEPS = [
  {
    title: "Sourcing yarn",
    copy: "Every project starts with choosing fiber and colorway — quality yarn, sourced thoughtfully.",
  },
  {
    title: "Design & swatch",
    copy: "New pieces begin as a swatch, testing stitch patterns and proportions before committing.",
  },
  {
    title: "Hand crochet",
    copy: "Each piece is worked entirely by hand, stitch by stitch — no machines involved.",
  },
  {
    title: "Finishing & QC",
    copy: "Ends woven in, seams checked, and every piece inspected before it's listed.",
  },
  {
    title: "Packaging & shipping",
    copy: "Wrapped with care and shipped out, ready for its new home.",
  },
];

export default function TheProcess() {
  const steps = useContentList("/api/process-steps", STEPS) || [];
  return (
    <main className="info-page">
      <header className="info-page__header">
        <h1 className="info-page__title">The Process</h1>
        <p className="info-page__intro">
          From skein to finished piece — here's how every RRAND item comes together.
        </p>
      </header>

      <section className="info-page__section">
        <div className="process__steps">
          {steps.map((step, index) => (
            <TiltCard className="process__step" key={step.id ?? step.title} max={6}>
              <p className="process__step-number">{String(index + 1).padStart(2, "0")}</p>
              <h3>{step.title}</h3>
              <p>{step.description ?? step.copy}</p>
            </TiltCard>
          ))}
        </div>
      </section>
    </main>
  );
}
