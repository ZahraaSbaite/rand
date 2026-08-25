import { useRef } from "react";

/**
 * Sets --px / --py custom properties (-0.5..0.5) on the element based on
 * cursor position, for descendant elements to build parallax depth from.
 */
export default function useParallax() {
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
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    node.style.setProperty("--px", px.toFixed(3));
    node.style.setProperty("--py", py.toFixed(3));
  };

  const onMouseLeave = () => {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty("--px", "0");
    node.style.setProperty("--py", "0");
  };

  return { ref, onMouseMove, onMouseLeave };
}
