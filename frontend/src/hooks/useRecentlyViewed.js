import { useEffect, useState } from "react";

const STORAGE_KEY = "rrand_recently_viewed";
const MAX_ITEMS = 8;

function read() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/** Tracks the given product id as viewed, and returns the recent id list (most recent first, excluding the current product). */
export default function useRecentlyViewed(productId) {
  const [ids, setIds] = useState(read);

  useEffect(() => {
    if (!productId) return;
    const next = [productId, ...read().filter((id) => id !== productId)].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setIds(next);
  }, [productId]);

  return ids.filter((id) => id !== productId);
}
