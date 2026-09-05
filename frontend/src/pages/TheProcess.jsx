import "./InfoPage.css";
import { useEffect, useState } from "react";
import TiltCard from "../components/TiltCard.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function TheProcess() {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/process-steps`)
      .then((res) => res.json())
      .then((data) => {
        setSteps(data);
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
        <p className="info-page__eyebrow">Behind the scenes</p>
        <h1 className="info-page__title">The Process</h1>
        <p className="info-page__intro">
          From skein to finished piece — here's how every RRAND item comes together.
        </p>
      </header>

      <section className="info-page__section">
        {loading ? (
          <p className="info-page__intro">Loading…</p>
        ) : (
          <div className="process__steps">
            {steps.map((step, index) => (
              <TiltCard className="process__step" key={step.id} max={6}>
                <p className="process__step-number">{String(index + 1).padStart(2, "0")}</p>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </TiltCard>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
