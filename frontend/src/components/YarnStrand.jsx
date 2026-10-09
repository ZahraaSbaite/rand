import { useEffect, useRef, useState } from "react";
import "./YarnStrand.css";

/**
 * One strand of yarn worked down the page as the visitor scrolls. It hugs the
 * page gutters inside each section and only crosses the page at section
 * seams ([data-strand] elements), so it never runs through content.
 */
export default function YarnStrand({ containerRef }) {
  const [geo, setGeo] = useState(null);
  const maskRef = useRef(null);
  const ballRef = useRef(null);
  const lengthRef = useRef(0);

  // Build the path from the section layout.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const build = () => {
      const w = container.clientWidth;
      const h = container.scrollHeight;
      const gutter = Math.max(14, Math.min(64, (w - 1240) / 2 + 22));
      const left = gutter;
      const right = w - gutter;
      const seams = [...container.querySelectorAll("[data-strand]")].map(
        (el) => el.offsetTop + el.offsetHeight
      );

      let side = right;
      let y = Math.min(window.innerHeight * 0.55, seams[0] ? seams[0] * 0.6 : 400);
      let d = `M ${side} ${y}`;

      seams.forEach((seam, i) => {
        if (seam <= y) return;
        // Run down the gutter with a lazy wobble.
        const wobble = side === right ? -16 : 16;
        const runEnd = seam - 70;
        if (runEnd > y) {
          const mid = (y + runEnd) / 2;
          d += ` C ${side + wobble} ${y + (mid - y) * 0.5}, ${side - wobble} ${mid}, ${side} ${mid}`;
          d += ` S ${side} ${runEnd}, ${side} ${runEnd}`;
          y = runEnd;
        }
        // Cross the seam to the other gutter, with a loop in the middle like a
        // chain stitch.
        if (i < seams.length - 1) {
          const next = side === right ? left : right;
          const cx = w / 2;
          const loopY = seam;
          d += ` C ${side} ${loopY}, ${cx + (next - side) * -0.1} ${loopY - 50}, ${cx} ${loopY - 18}`;
          d += ` C ${cx + 26} ${loopY + 10}, ${cx - 26} ${loopY + 34}, ${cx - (next - side) * 0.02} ${loopY + 10}`;
          d += ` C ${cx + (next - side) * 0.25} ${loopY - 10}, ${next} ${loopY + 10}, ${next} ${loopY + 70}`;
          y = loopY + 70;
          side = next;
        }
      });

      setGeo({ w, h, d });
    };

    build();
    const ro = new ResizeObserver(build);
    ro.observe(container);
    window.addEventListener("load", build);
    return () => {
      ro.disconnect();
      window.removeEventListener("load", build);
    };
  }, [containerRef]);

  // Draw it in with scroll.
  useEffect(() => {
    if (!geo) return;
    const container = containerRef.current;
    const maskPath = maskRef.current;
    if (!container || !maskPath) return;

    lengthRef.current = maskPath.getTotalLength();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      maskPath.style.strokeDashoffset = "0";
      if (ballRef.current) ballRef.current.style.display = "none";
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = container.getBoundingClientRect();
      const reach = window.innerHeight * 0.7 - rect.top;
      const length = lengthRef.current;
      // Find the drawn length whose point sits at the reach line.
      let lo = 0;
      let hi = length;
      for (let i = 0; i < 18; i++) {
        const midLen = (lo + hi) / 2;
        if (maskPath.getPointAtLength(midLen).y < reach) lo = midLen;
        else hi = midLen;
      }
      const drawn = Math.max(0, Math.min(length, lo));
      maskPath.style.strokeDasharray = `${length}`;
      maskPath.style.strokeDashoffset = `${length - drawn}`;
      const ball = ballRef.current;
      if (ball) {
        const p = maskPath.getPointAtLength(drawn);
        ball.setAttribute("transform", `translate(${p.x} ${p.y}) rotate(${drawn * 0.9})`);
        ball.style.opacity = drawn > 4 && drawn < length - 4 ? "1" : "0";
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [geo, containerRef]);

  if (!geo) return null;

  return (
    <svg
      className="yarn-strand"
      width={geo.w}
      height={geo.h}
      viewBox={`0 0 ${geo.w} ${geo.h}`}
      aria-hidden="true"
    >
      <defs>
        <mask id="yarn-strand-mask" maskUnits="userSpaceOnUse">
          <path
            ref={maskRef}
            d={geo.d}
            fill="none"
            stroke="#fff"
            strokeWidth="14"
            strokeLinecap="round"
            style={{ strokeDasharray: 99999, strokeDashoffset: 99999 }}
          />
        </mask>
      </defs>
      <g mask="url(#yarn-strand-mask)">
        <path className="yarn-strand__ply" d={geo.d} />
        <path className="yarn-strand__twist" d={geo.d} />
      </g>
      <g ref={ballRef} className="yarn-strand__ball">
        <circle r="11" />
        <path d="M-9 -4c5 1 11 5 14 12M-10 3c5 0 11 3 13 8M-4 -10c2 5 7 9 13 10" />
      </g>
    </svg>
  );
}
