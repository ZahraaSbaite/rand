const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function getImageUrl(url) {
    if (!url) return "";
    return url.startsWith("http") ? url : `${API_URL}${url}`;
}