const YARN_BALL_SVG = `
<svg viewBox="0 0 40 40" aria-hidden="true">
  <circle cx="20" cy="20" r="17" fill="currentColor"/>
  <g fill="none" stroke="rgba(0,0,0,.28)" stroke-width="1.6" stroke-linecap="round">
    <path d="M6 14c8 2 20 10 26 20"/>
    <path d="M4 22c9 0 21 6 24 15"/>
    <path d="M12 5c4 8 14 16 25 19"/>
    <path d="M22 3c1 9 6 17 14 21"/>
  </g>
</svg>`;

/**
 * Rolls a little yarn ball from `fromEl` into the navbar basket
 * ([data-cart-target]) along an arc, then jolts the basket.
 * Purely decorative: the cart update itself happens regardless.
 */
export default function flyToCart(fromEl, color = "var(--ink-tomato)") {
  if (typeof window === "undefined" || !fromEl) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const target = document.querySelector("[data-cart-target]");
  if (!target) return;

  const from = fromEl.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const size = 30;

  const ball = document.createElement("div");
  ball.innerHTML = YARN_BALL_SVG;
  Object.assign(ball.style, {
    position: "fixed",
    left: `${from.left + from.width / 2 - size / 2}px`,
    top: `${from.top + from.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    color,
    zIndex: 1000,
    pointerEvents: "none",
  });
  document.body.appendChild(ball);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const lift = Math.min(-80, dy - 120);

  const anim = ball.animate(
    [
      { transform: "translate(0, 0) rotate(0deg) scale(1)" },
      {
        transform: `translate(${dx * 0.45}px, ${lift}px) rotate(260deg) scale(1.15)`,
        offset: 0.45,
      },
      { transform: `translate(${dx}px, ${dy}px) rotate(620deg) scale(0.45)` },
    ],
    { duration: 780, easing: "cubic-bezier(0.45, 0, 0.25, 1)" }
  );

  anim.onfinish = () => {
    ball.remove();
    target.classList.remove("is-catching");
    // Force a reflow so the animation can restart on rapid adds.
    void target.offsetWidth;
    target.classList.add("is-catching");
    setTimeout(() => target.classList.remove("is-catching"), 520);
  };
}
