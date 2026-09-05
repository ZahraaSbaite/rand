import "./Skeleton.css";

export function Skeleton({ className = "", width, height, style }) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonProductGrid({ count = 5 }) {
  return (
    <div className="product-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-product-card" key={i}>
          <Skeleton className="skeleton-product-card__image" />
          <Skeleton height="0.9rem" width="70%" />
          <Skeleton height="0.9rem" width="35%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonWishlistGrid({ count = 4 }) {
  return (
    <div className="wishlist-page__grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div className="wishlist-card" key={i}>
          <Skeleton className="wishlist-card__image-wrap" style={{ display: "block" }} />
          <div className="wishlist-card__body">
            <Skeleton height="0.9rem" width="70%" />
            <Skeleton height="0.85rem" width="35%" />
            <div className="wishlist-card__actions">
              <Skeleton height="2.2rem" width="100%" />
              <Skeleton height="2.2rem" width="70px" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonProductDetail() {
  return (
    <div className="product__layout" aria-hidden="true">
      <div className="product__gallery">
        <Skeleton className="product__image" style={{ display: "block" }} />
      </div>
      <div className="skeleton-stack">
        <Skeleton width="30%" height="0.7rem" />
        <Skeleton width="65%" height="2.2rem" />
        <Skeleton width="40%" height="1rem" />
        <Skeleton width="25%" height="1.6rem" />
        <Skeleton width="100%" height="3rem" style={{ marginTop: "0.5rem" }} />
      </div>
    </div>
  );
}

export function SkeletonCart({ count = 2 }) {
  return (
    <div className="cart__layout" aria-hidden="true">
      <div className="cart__items">
        {Array.from({ length: count }).map((_, i) => (
          <div className="cart__item" key={i}>
            <Skeleton className="cart__item-image" style={{ display: "block" }} />
            <div className="skeleton-stack">
              <Skeleton width="65%" height="0.9rem" />
              <Skeleton width="35%" height="0.85rem" />
            </div>
            <Skeleton width="52px" height="2rem" />
            <Skeleton width="55px" height="0.8rem" />
          </div>
        ))}
      </div>
      <div className="cart__summary">
        <Skeleton width="40%" height="1.25rem" style={{ marginBottom: "1.2rem" }} />
        <Skeleton width="100%" height="0.85rem" style={{ marginBottom: "0.7rem" }} />
        <Skeleton width="100%" height="0.85rem" style={{ marginBottom: "0.7rem" }} />
        <Skeleton width="100%" height="2.6rem" style={{ marginTop: "0.5rem" }} />
      </div>
    </div>
  );
}

export function SkeletonReviews({ count = 4 }) {
  return (
    <div className="reviews__grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div className="reviews__card skeleton-stack" key={i}>
          <Skeleton width="35%" height="0.9rem" />
          <Skeleton width="100%" height="0.85rem" />
          <Skeleton width="80%" height="0.85rem" />
          <Skeleton width="45%" height="0.85rem" style={{ marginTop: "0.5rem" }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCheckout() {
  return (
    <div className="checkout__layout" aria-hidden="true">
      <div className="checkout__form-panel skeleton-stack">
        <Skeleton width="45%" height="0.8rem" />
        <Skeleton width="100%" height="2.6rem" />
        <Skeleton width="100%" height="2.6rem" />
        <Skeleton width="100%" height="2.6rem" />
      </div>
      <div className="checkout__summary skeleton-stack">
        <Skeleton width="50%" height="1.1rem" />
        <Skeleton width="100%" height="0.85rem" />
        <Skeleton width="100%" height="0.85rem" />
        <Skeleton width="100%" height="0.85rem" />
      </div>
    </div>
  );
}
