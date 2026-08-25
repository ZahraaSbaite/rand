import { useRef } from "react";

/**
 * Cursor-following 3D tilt. Sets --tilt-x / --tilt-y custom properties on the
 * element so the CSS can define the actual `transform` (keeps hover-lift /
 * box-shadow rules in CSS instead of fighting an inline style).
 */
export default function useTilt({ max = 8 } = {}) {
  const ref = useRef(null);
  const reducedMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const onMouseMove = (e) => {
    if (reducedMotion.current) return;
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    node.style.setProperty("--tilt-x", `${((0.5 - y) * max * 2).toFixed(2)}deg`);
    node.style.setProperty("--tilt-y", `${((x - 0.5) * max * 2).toFixed(2)}deg`);
  };

  const onMouseLeave = () => {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty("--tilt-x", "0deg");
    node.style.setProperty("--tilt-y", "0deg");
  };

  return { ref, onMouseMove, onMouseLeave };
}
