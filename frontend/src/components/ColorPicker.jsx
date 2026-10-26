import { useState } from "react";
import { swatchFor } from "../lib/yarnPalette.js";
import "./ColorPicker.css";

/**
 * Lets a customer pick up to `max` yarn colors, in order (the first is the
 * main color), from `choices` ({ name, hex }), or by typing one in when
 * `allowOther` is set.
 */
export default function ColorPicker({ max, value, onChange, choices, allowOther = true }) {
  const [other, setOther] = useState("");
  const full = value.length >= max;
  const has = (name) => value.some((v) => v.toLowerCase() === name.toLowerCase());

  const toggle = (name) => {
    if (has(name)) onChange(value.filter((v) => v.toLowerCase() !== name.toLowerCase()));
    else if (max === 1) onChange([name]);
    else if (!full) onChange([...value, name]);
  };

  const addOther = () => {
    const name = other.trim().slice(0, 40);
    if (!name || has(name) || (full && max !== 1)) return;
    onChange(max === 1 ? [name] : [...value, name]);
    setOther("");
  };

  return (
    <fieldset className="color-picker">
      <legend className="color-picker__label">
        {max === 1 ? "Choose your color" : `Choose your colors (up to ${max})`}
      </legend>

      <div className="color-picker__chosen" aria-live="polite">
        {value.length === 0 ? (
          <span className="color-picker__hint">
            {max === 1 ? "Pick one below." : "Pick the main color first, then any others."}
          </span>
        ) : (
          value.map((name, i) => (
            <button type="button" key={name} className="color-picker__chip" onClick={() => toggle(name)} aria-label={`Remove ${name}`}>
              <span className="color-picker__dot" style={{ background: swatchFor(name) || undefined }} data-custom={!swatchFor(name) || undefined} />
              {max > 1 && <small>{i === 0 ? "Main" : i + 1}</small>}
              {name}
              <span aria-hidden="true">×</span>
            </button>
          ))
        )}
      </div>

      <div className="color-picker__grid">
        {choices.map((c) => {
          const on = has(c.name);
          return (
            <button
              type="button"
              key={c.name}
              className={`color-picker__swatch${on ? " is-on" : ""}`}
              onClick={() => toggle(c.name)}
              disabled={!on && full && max !== 1}
              aria-pressed={on}
              title={c.name}
            >
              <span className="color-picker__dot" style={{ background: c.hex || undefined }} data-custom={!c.hex || undefined} />
              <span className="color-picker__name">{c.name}</span>
            </button>
          );
        })}
      </div>

      {allowOther && (
      <div className="color-picker__other">
        <input
          value={other}
          onChange={(e) => setOther(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addOther();
            }
          }}
          placeholder="Another color, e.g. lavender with gold sparkle"
          maxLength={40}
          disabled={full && max !== 1}
          aria-label="Another color"
        />
        <button type="button" onClick={addOther} disabled={!other.trim() || (full && max !== 1)}>
          Add
        </button>
      </div>
      )}
    </fieldset>
  );
}
