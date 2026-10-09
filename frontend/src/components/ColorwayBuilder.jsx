import { useState } from "react";
import { Link } from "react-router-dom";
import "./ColorwayBuilder.css";

// Yarn shades on offer for the sample square. These are yarn colours (content),
// not interface colours.
const YARNS = [
  { name: "Tomato", hex: "#d4472c" },
  { name: "Marigold", hex: "#f2a516" },
  { name: "Avocado", hex: "#6f8a32" },
  { name: "Cocoa", hex: "#5a3424" },
  { name: "Oat", hex: "#e9d8b4" },
  { name: "Sky", hex: "#8fb8d8" },
  { name: "Rose", hex: "#e89ab0" },
  { name: "Plum", hex: "#6b3a5e" },
];

const ROUNDS = ["Centre", "Round 2", "Round 3"];

/** A granny square the visitor colours round by round, then commissions. */
export default function ColorwayBuilder() {
  const [colors, setColors] = useState([YARNS[0], YARNS[4], YARNS[2]]);
  const [active, setActive] = useState(0);
  const [pulse, setPulse] = useState(0);

  const pick = (yarn) => {
    setColors((prev) => prev.map((c, i) => (i === active ? yarn : c)));
    setPulse((p) => p + 1);
    setActive((a) => (a + 1) % ROUNDS.length);
  };

  const colorway = colors.map((c) => c.name).join(", ");

  return (
    <div className="colorway">
      <div className="colorway__square-wrap">
        <svg
          className={`colorway__square${pulse ? (pulse % 2 ? " pop-a" : " pop-b") : ""}`}
          viewBox="0 0 200 200"
          role="img"
          aria-label={`Granny square in ${colorway}`}
        >
          <rect x="6" y="6" width="188" height="188" rx="14" className="colorway__join" />
          {/* Round 3: clusters along the outer edge */}
          <rect
            x="24" y="24" width="152" height="152" rx="10"
            className={`colorway__round${active === 2 ? " is-active" : ""}`}
            style={{ stroke: colors[2].hex, strokeWidth: 22, strokeDasharray: "30 8" }}
            onClick={() => setActive(2)}
          />
          {/* Round 2 */}
          <rect
            x="52" y="52" width="96" height="96" rx="8"
            className={`colorway__round${active === 1 ? " is-active" : ""}`}
            style={{ stroke: colors[1].hex, strokeWidth: 22, strokeDasharray: "26 8" }}
            onClick={() => setActive(1)}
          />
          {/* Centre: the magic ring */}
          <circle
            cx="100" cy="100" r="20"
            className={`colorway__round colorway__centre${active === 0 ? " is-active" : ""}`}
            style={{ stroke: colors[0].hex, strokeWidth: 18, strokeDasharray: "18 5" }}
            onClick={() => setActive(0)}
          />
        </svg>
      </div>

      <div className="colorway__controls">
        <div className="colorway__rounds" role="tablist" aria-label="Choose a round to colour">
          {ROUNDS.map((label, i) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={active === i}
              className={`colorway__round-btn${active === i ? " is-active" : ""}`}
              onClick={() => setActive(i)}
            >
              <span className="colorway__dot" style={{ background: colors[i].hex }} />
              {label}
            </button>
          ))}
        </div>

        <div className="colorway__yarns" aria-label={`Yarn for ${ROUNDS[active]}`}>
          {YARNS.map((yarn) => (
            <button
              key={yarn.name}
              type="button"
              className={`colorway__yarn${colors[active].name === yarn.name ? " is-current" : ""}`}
              style={{ "--yarn": yarn.hex }}
              onClick={() => pick(yarn)}
              aria-label={`${yarn.name} for ${ROUNDS[active]}`}
            >
              <svg viewBox="0 0 40 40" aria-hidden="true">
                <circle cx="20" cy="20" r="17" />
                <path d="M6 14c8 2 20 10 26 20M4 22c9 0 21 6 24 15M12 5c4 8 14 16 25 19M22 3c1 9 6 17 14 21" />
              </svg>
              <span>{yarn.name}</span>
            </button>
          ))}
        </div>

        <p className="colorway__readout">
          Your colorway: <strong>{colorway}</strong>
        </p>

        <Link
          to={`/custom-orders?colorway=${encodeURIComponent(colorway)}`}
          className="colorway__cta"
        >
          Commission this colorway
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
