export const API_URL = import.meta.env.VITE_API_URL || "";

/**
 * fetch wrapper for the Strand API: sends cookies, encodes JSON bodies,
 * and throws an Error carrying the server's message on failure.
 */
export async function api(path, { method = "GET", body, signal } = {}) {
    const isForm = typeof FormData !== "undefined" && body instanceof FormData;
    const res = await fetch(`${API_URL}${path}`, {
        method,
        credentials: "include",
        signal,
        headers: body && !isForm ? { "Content-Type": "application/json" } : undefined,
        body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
    }
    return data;
}

export function uploadImage(file) {
    const form = new FormData();
    form.append("image", file);
    return api("/api/upload", { method: "POST", body: form }).then((d) => d.url);
}
