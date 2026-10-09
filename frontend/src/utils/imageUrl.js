const API_URL = import.meta.env.VITE_API_URL || "";

export function getImageUrl(url) {
    if (!url) return "";
    return url.startsWith("http") ? url : `${API_URL}${url}`;
}