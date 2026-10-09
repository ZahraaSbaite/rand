import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../lib/api.js";
import slugify from "../lib/slug.js";

// What the site shows when the API is unreachable or a setting is blank.
export const DEFAULT_SETTINGS = {
    hero_tagline: "A world of color + thread",
    hero_text:
        "Handmade bags, totes, scarves, cardigans and gloves, worked slowly by hand and sold as each piece is finished.",
    ticker:
        "Made by hand, one stitch at a time | Small batches, sold as they're finished | Custom colorways on request",
    instagram_url: "",
    tiktok_url: "",
    pinterest_url: "",
    contact_email: "",
    shipping_text: "",
    returns_text: "",
    privacy_text: "",
    terms_text: "",
};

export const DEFAULT_CATEGORIES = [
    { id: "bags", name: "Bags" },
    { id: "tote-bags", name: "Tote Bags" },
    { id: "scarves", name: "Scarves" },
    { id: "cardigans", name: "Cardigans" },
    { id: "gloves", name: "Gloves" },
];

const SiteContext = createContext(null);

export function SiteProvider({ children }) {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

    const reload = useCallback(() => {
        api("/api/settings")
            .then((data) => {
                // Blank values fall back to the defaults.
                const merged = { ...DEFAULT_SETTINGS };
                for (const [key, value] of Object.entries(data || {})) {
                    if (value?.trim()) merged[key] = value;
                }
                setSettings(merged);
            })
            .catch(() => {});
        api("/api/categories")
            .then((data) => {
                if (Array.isArray(data) && data.length) setCategories(data);
            })
            .catch(() => {});
    }, []);

    useEffect(reload, [reload]);

    const value = {
        settings,
        categories: categories.map((c) => ({ ...c, slug: slugify(c.name) })),
        reload,
    };

    return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
    const context = useContext(SiteContext);
    if (!context) throw new Error("useSite must be used inside SiteProvider");
    return context;
}

/** Fetch a public list (FAQs, story blocks...) with a built-in fallback. */
export function useContentList(path, fallback) {
    const [items, setItems] = useState(null);

    useEffect(() => {
        let cancelled = false;
        api(path)
            .then((data) => {
                if (!cancelled) setItems(Array.isArray(data) && data.length ? data : fallback);
            })
            .catch(() => {
                if (!cancelled) setItems(fallback);
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path]);

    return items;
}
