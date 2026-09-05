const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Uploaded images are stored as paths relative to the backend (e.g. "/uploads/xxx.jpg").
// Seed/placeholder images are already absolute URLs — leave those untouched.
export function getImageUrl(imageUrl) {
  if (!imageUrl) return imageUrl;
  return imageUrl.startsWith("/") ? `${API_URL}${imageUrl}` : imageUrl;
}

// Products store their gallery in `images` and, separately, a legacy single `image_url`.
// Most seed products only ever populated `images`, so card/thumbnail views need to
// check that first or they show the generic fallback for pieces that do have photos.
export function getPrimaryImage(product) {
  return product?.images?.[0] || product?.image_url || null;
}
