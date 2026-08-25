import useTilt from "../hooks/useTilt.js";

/**
 * Generic cursor-tilt wrapper — see useTilt.js. Renders a <div> by default;
 * pass e.g. `as="figure"` to render a different tag.
 */
export default function TiltCard({ as: Tag = "div", max = 8, className = "", children, ...rest }) {
  const tilt = useTilt({ max });

  return (
    <Tag
      className={className}
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      {...rest}
    >
      {children}
    </Tag>
  );
}
