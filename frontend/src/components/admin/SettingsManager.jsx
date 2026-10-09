import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { DEFAULT_SETTINGS, useSite } from "../../context/SiteContext.jsx";
import { SectionHeader, useAdmin } from "./AdminUI.jsx";

const GROUPS = [
    {
        title: "Homepage",
        fields: [
            { key: "hero_tagline", label: "Tagline under RRAND" },
            { key: "hero_text", label: "Intro text", type: "textarea" },
            {
                key: "ticker",
                label: "Scrolling ticker at the top",
                hint: "Separate messages with a | character.",
                type: "textarea",
            },
        ],
    },
    {
        title: "Contact and social",
        description: "Leave a link empty to hide its icon in the footer.",
        fields: [
            { key: "contact_email", label: "Contact email (shown in the footer)", type: "email" },
            { key: "instagram_url", label: "Instagram link", type: "url" },
            { key: "tiktok_url", label: "TikTok link", type: "url" },
            { key: "pinterest_url", label: "Pinterest link", type: "url" },
        ],
    },
    {
        title: "Policy pages",
        description:
            "Leave empty to keep the built-in text. Blank lines start a new paragraph; a line starting with “## ” becomes a heading.",
        fields: [
            { key: "shipping_text", label: "Shipping page", type: "longtext", page: "/shipping" },
            { key: "returns_text", label: "Returns page", type: "longtext", page: "/returns" },
            { key: "privacy_text", label: "Privacy policy page", type: "longtext", page: "/privacy" },
            { key: "terms_text", label: "Terms page", type: "longtext", page: "/terms" },
        ],
    },
];

export default function SettingsManager() {
    const { notify } = useAdmin();
    const { reload } = useSite();
    const [form, setForm] = useState(null);
    const [saved, setSaved] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api("/api/settings")
            .then((data) => {
                const initial = Object.fromEntries(Object.keys(DEFAULT_SETTINGS).map((k) => [k, data?.[k] ?? ""]));
                setForm(initial);
                setSaved(initial);
            })
            .catch((err) => notify(err.message, "bad"));
    }, [notify]);

    if (!form) return <p className="admin-loading">Loading settings…</p>;

    const dirty = Object.keys(form).some((k) => form[k] !== saved[k]);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = await api("/api/settings", { method: "PUT", body: form });
            const next = Object.fromEntries(Object.keys(form).map((k) => [k, data?.[k] ?? ""]));
            setForm(next);
            setSaved(next);
            reload();
            notify("Settings saved. The site is updated.");
        } catch (err) {
            notify(err.message, "bad");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit}>
            <SectionHeader title="Site settings" description="Text and links used across the site.">
                <button type="submit" className="admin-btn" disabled={!dirty || saving}>
                    {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
                </button>
            </SectionHeader>

            {GROUPS.map((group) => (
                <section key={group.title} className="admin-panel admin-settings-group">
                    <h2 className="admin-panel__title">{group.title}</h2>
                    {group.description && <p className="admin-muted">{group.description}</p>}
                    <div className="admin-form-grid">
                        {group.fields.map((field) => (
                            <label key={field.key} className="admin-field admin-field--wide">
                                <span className="admin-field__label">
                                    {field.label}
                                    {field.page && (
                                        <a href={field.page} target="_blank" rel="noopener noreferrer" className="admin-field__link">
                                            View page
                                        </a>
                                    )}
                                </span>
                                {field.type === "textarea" || field.type === "longtext" ? (
                                    <textarea
                                        rows={field.type === "longtext" ? 8 : 3}
                                        value={form[field.key]}
                                        placeholder={field.type === "longtext" ? "Using the built-in text" : DEFAULT_SETTINGS[field.key]}
                                        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                    />
                                ) : (
                                    <input
                                        type={field.type || "text"}
                                        value={form[field.key]}
                                        placeholder={DEFAULT_SETTINGS[field.key]}
                                        onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                    />
                                )}
                                {field.hint && <span className="admin-field__hint">{field.hint}</span>}
                            </label>
                        ))}
                    </div>
                </section>
            ))}

            {dirty && (
                <div className="admin-sticky-save">
                    <button type="submit" className="admin-btn" disabled={saving}>
                        {saving ? "Saving…" : "Save changes"}
                    </button>
                </div>
            )}
        </form>
    );
}
