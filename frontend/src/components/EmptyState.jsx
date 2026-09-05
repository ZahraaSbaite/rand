import { Link } from "react-router-dom";
import "./EmptyState.css";

export default function EmptyState({
  icon,
  title,
  subtitle,
  ctaText,
  ctaTo,
  onCtaClick,
  tone = "default",
}) {
  return (
    <div className={`empty-state empty-state--${tone}`}>
      {icon && (
        <div className="empty-state__icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <p className="empty-state__title">{title}</p>
      {subtitle && <p className="empty-state__sub">{subtitle}</p>}
      {ctaText && ctaTo && (
        <Link to={ctaTo} className="empty-state__cta">
          {ctaText}
        </Link>
      )}
      {ctaText && !ctaTo && onCtaClick && (
        <button type="button" className="empty-state__cta" onClick={onCtaClick}>
          {ctaText}
        </button>
      )}
    </div>
  );
}
