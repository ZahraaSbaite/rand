import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { getImageUrl } from "../../utils/imageUrl.js";
import { EmptyState, ImageField, SectionHeader, useAdmin } from "./AdminUI.jsx";

/**
 * One editor for every simple content list (collections, FAQs, story blocks,
 * process steps, lookbook). Each config names its endpoint and fields; items
 * are ordered with sort_order and edited inline.
 */
export const CONTENT_TYPES = {
    collections: {
        title: "Collections",
        description: "Groups shown on the Collections page. Each links to a shop category.",
        endpoint: "/api/collections",
        page: "/collections",
        fields: [
            { key: "name", label: "Name", required: true },
            { key: "slug", label: "Links to category", type: "category", required: true },
            { key: "tagline", label: "Tagline", wide: true },
            { key: "image_url", label: "Cover image", type: "image" },
        ],
        summary: (item) => [item.name, item.tagline],
    },
    faqs: {
        title: "FAQs",
        description: "Questions on the FAQ page. Questions with the same topic are grouped together.",
        endpoint: "/api/faqs",
        page: "/faq",
        fields: [
            { key: "category", label: "Topic", required: true, placeholder: "Orders, Shipping, Care…" },
            { key: "question", label: "Question", required: true, wide: true },
            { key: "answer", label: "Answer", type: "textarea", required: true, wide: true },
        ],
        summary: (item) => [item.question, `${item.category} · ${item.answer}`],
    },
    "story-blocks": {
        title: "Our Story",
        description: "The sections of the Our Story page, top to bottom. Leave a blank line between paragraphs.",
        endpoint: "/api/story-blocks",
        page: "/our-story",
        fields: [
            { key: "heading", label: "Heading", required: true, wide: true },
            { key: "body", label: "Text", type: "textarea", required: true, wide: true },
            { key: "image_url", label: "Photo", type: "image" },
        ],
        summary: (item) => [item.heading, item.body],
    },
    "process-steps": {
        title: "The Process",
        description: "Steps on The Process page and the “How a piece is made” rounds on the homepage.",
        endpoint: "/api/process-steps",
        page: "/the-process",
        fields: [
            { key: "title", label: "Step", required: true, wide: true },
            { key: "description", label: "Description", type: "textarea", required: true, wide: true },
        ],
        summary: (item) => [item.title, item.description],
    },
    lookbook: {
        title: "Lookbook",
        description: "Photos on the Lookbook page, with a caption and an optional line of story.",
        endpoint: "/api/journal",
        page: "/lookbook",
        fields: [
            { key: "image_url", label: "Photo", type: "image" },
            { key: "title", label: "Caption", required: true, wide: true },
            { key: "story", label: "Story", type: "textarea", required: true, wide: true },
            { key: "tag", label: "Tag", placeholder: "Inspiration" },
            { key: "entry_date", label: "Date", type: "date" },
        ],
        summary: (item) => [item.title, item.story],
    },
};

function emptyFor(config) {
    return Object.fromEntries(config.fields.map((f) => [f.key, ""]));
}

function ItemForm({ config, initial, categories, onSubmit, onCancel, submitLabel }) {
    const [form, setForm] = useState(initial);
    const [saving, setSaving] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSubmit(form);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="admin-content-form" onSubmit={submit}>
            <div className="admin-form-grid">
                {config.fields.map((field) => {
                    const value = form[field.key] ?? "";
                    const set = (v) => setForm((f) => ({ ...f, [field.key]: v }));
                    if (field.type === "image") {
                        return (
                            <div key={field.key} className="admin-field admin-field--wide">
                                <ImageField label={field.label} value={value} onChange={set} />
                            </div>
                        );
                    }
                    return (
                        <label key={field.key} className={`admin-field${field.wide ? " admin-field--wide" : ""}`}>
                            <span className="admin-field__label">{field.label}</span>
                            {field.type === "textarea" ? (
                                <textarea rows={4} value={value} onChange={(e) => set(e.target.value)} required={field.required} />
                            ) : field.type === "category" ? (
                                <select value={value} onChange={(e) => set(e.target.value)} required={field.required}>
                                    <option value="" disabled>
                                        Choose…
                                    </option>
                                    {categories.map((c) => (
                                        <option key={c.slug} value={c.slug}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={field.type === "date" ? "date" : "text"}
                                    value={field.type === "date" && value ? String(value).slice(0, 10) : value}
                                    onChange={(e) => set(e.target.value)}
                                    required={field.required}
                                    placeholder={field.placeholder}
                                />
                            )}
                        </label>
                    );
                })}
            </div>
            <div className="admin-row">
                <button type="submit" className="admin-btn admin-btn--small" disabled={saving}>
                    {saving ? "Saving…" : submitLabel}
                </button>
                <button type="button" className="admin-link-btn" onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </form>
    );
}

export default function ContentManager({ type, categories }) {
    const config = CONTENT_TYPES[type];
    const { notify } = useAdmin();
    const [items, setItems] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [adding, setAdding] = useState(false);

    const load = () =>
        api(config.endpoint)
            .then(setItems)
            .catch((err) => {
                notify(err.message, "bad");
                setItems([]);
            });

    useEffect(() => {
        setItems(null);
        setEditingId(null);
        setAdding(false);
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type]);

    const clean = (form) => {
        const body = {};
        for (const f of config.fields) {
            const v = form[f.key];
            body[f.key] = typeof v === "string" ? v.trim() : v;
            if (f.type === "date" && !body[f.key]) delete body[f.key];
        }
        return body;
    };

    const create = async (form) => {
        try {
            await api(config.endpoint, {
                method: "POST",
                body: { ...clean(form), sort_order: (items?.length || 0) + 1 },
            });
            notify("Added");
            setAdding(false);
            load();
        } catch (err) {
            notify(err.message, "bad");
        }
    };

    const update = async (id, form) => {
        try {
            await api(`${config.endpoint}/${id}`, { method: "PATCH", body: clean(form) });
            notify("Saved");
            setEditingId(null);
            load();
        } catch (err) {
            notify(err.message, "bad");
        }
    };

    const remove = async (item) => {
        if (!confirm("Delete this item? This can't be undone.")) return;
        try {
            await api(`${config.endpoint}/${item.id}`, { method: "DELETE" });
            notify("Deleted");
            setItems((list) => list.filter((x) => x.id !== item.id));
        } catch (err) {
            notify(err.message, "bad");
        }
    };

    const move = async (index, dir) => {
        const list = [...items];
        const other = index + dir;
        if (other < 0 || other >= list.length) return;
        [list[index], list[other]] = [list[other], list[index]];
        setItems(list);
        try {
            await Promise.all(
                list.map((item, i) => api(`${config.endpoint}/${item.id}`, { method: "PATCH", body: { sort_order: i + 1 } }))
            );
        } catch (err) {
            notify(err.message, "bad");
            load();
        }
    };

    return (
        <div>
            <SectionHeader title={config.title} description={config.description}>
                <a className="admin-btn admin-btn--ghost" href={config.page} target="_blank" rel="noopener noreferrer">
                    View page
                </a>
                <button
                    type="button"
                    className="admin-btn"
                    onClick={() => {
                        setAdding(true);
                        setEditingId(null);
                    }}
                >
                    + Add
                </button>
            </SectionHeader>

            {adding && (
                <div className="admin-card admin-card--form">
                    <ItemForm
                        config={config}
                        initial={emptyFor(config)}
                        categories={categories}
                        onSubmit={create}
                        onCancel={() => setAdding(false)}
                        submitLabel="Add"
                    />
                </div>
            )}

            {items === null ? (
                <p className="admin-loading">Loading…</p>
            ) : items.length === 0 ? (
                <EmptyState title="Nothing here yet">The page shows its built-in content until you add something.</EmptyState>
            ) : (
                <ul className="admin-cards">
                    {items.map((item, i) => {
                        const [title, sub] = config.summary(item);
                        const image = item.image_url;
                        return (
                            <li key={item.id} className={`admin-card${editingId === item.id ? " admin-card--form" : ""}`}>
                                {editingId === item.id ? (
                                    <ItemForm
                                        config={config}
                                        initial={{ ...emptyFor(config), ...item }}
                                        categories={categories}
                                        onSubmit={(form) => update(item.id, form)}
                                        onCancel={() => setEditingId(null)}
                                        submitLabel="Save"
                                    />
                                ) : (
                                    <>
                                        <div className="admin-card__order">
                                            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                                                ↑
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => move(i, 1)}
                                                disabled={i === items.length - 1}
                                                aria-label="Move down"
                                            >
                                                ↓
                                            </button>
                                        </div>
                                        {"image_url" in item && (
                                            <span className="admin-thumb">{image ? <img src={getImageUrl(image)} alt="" /> : null}</span>
                                        )}
                                        <div className="admin-card__body">
                                            <strong>{title}</strong>
                                            {sub && <span className="admin-muted admin-clamp">{sub}</span>}
                                        </div>
                                        <div className="admin-row">
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn--small admin-btn--ghost"
                                                onClick={() => {
                                                    setEditingId(item.id);
                                                    setAdding(false);
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button type="button" className="admin-link-btn admin-link-btn--danger" onClick={() => remove(item)}>
                                                Delete
                                            </button>
                                        </div>
                                    </>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
