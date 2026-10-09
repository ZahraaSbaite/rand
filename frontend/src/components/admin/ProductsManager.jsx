import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api.js";
import { getImageUrl } from "../../utils/imageUrl.js";
import {
    EmptyState,
    GalleryField,
    ImageField,
    SectionHeader,
    StatusPill,
    formatMoney,
    useAdmin,
} from "./AdminUI.jsx";

const EMPTY = {
    name: "",
    category: "",
    price: "",
    stock_quantity: "1",
    yarn_color: "",
    colors: "",
    description: "",
    materials: "",
    dimensions: "",
    care_instructions: "",
    production_time: "",
    image_url: "",
    images: [],
    featured: false,
    bestseller: false,
    is_visible: true,
};

function toForm(p) {
    return {
        name: p.name || "",
        category: p.category || "",
        price: p.price_cents != null ? (p.price_cents / 100).toFixed(2) : "",
        stock_quantity: String(p.stock_quantity ?? 0),
        yarn_color: p.yarn_color || "",
        colors: (p.colors || []).join(", "),
        description: p.description || "",
        materials: p.materials || "",
        dimensions: p.dimensions || "",
        care_instructions: p.care_instructions || "",
        production_time: p.production_time || "",
        image_url: p.image_url || "",
        images: p.images || [],
        featured: !!p.featured,
        bestseller: !!p.bestseller,
        is_visible: p.is_visible !== false,
    };
}

function toPayload(f) {
    return {
        name: f.name.trim(),
        category: f.category,
        price_cents: Math.round(Number(f.price) * 100),
        stock_quantity: Math.max(0, parseInt(f.stock_quantity, 10) || 0),
        yarn_color: f.yarn_color.trim(),
        colors: f.colors
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
        description: f.description.trim(),
        materials: f.materials.trim(),
        dimensions: f.dimensions.trim(),
        care_instructions: f.care_instructions.trim(),
        production_time: f.production_time.trim(),
        image_url: f.image_url,
        images: f.images,
        featured: f.featured,
        bestseller: f.bestseller,
        is_visible: f.is_visible,
    };
}

function ProductEditor({ product, categories, onSaved, onCancel }) {
    const { notify } = useAdmin();
    const [form, setForm] = useState(product ? toForm(product) : { ...EMPTY, category: categories[0]?.name || "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const set = (key) => (e) =>
        setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const saved = await api(product ? `/api/products/${product.id}` : "/api/products", {
                method: product ? "PUT" : "POST",
                body: toPayload(form),
            });
            notify(product ? `Saved “${saved.name}”` : `Added “${saved.name}”`);
            onSaved(saved);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="admin-editor" onSubmit={submit}>
            <div className="admin-editor__head">
                <h2>{product ? `Edit “${product.name}”` : "New product"}</h2>
                <button type="button" className="admin-link-btn" onClick={onCancel}>
                    Close
                </button>
            </div>

            <div className="admin-editor__cols">
                <div className="admin-form-grid">
                    <label className="admin-field admin-field--wide">
                        <span className="admin-field__label">Name</span>
                        <input value={form.name} onChange={set("name")} required />
                    </label>
                    <label className="admin-field">
                        <span className="admin-field__label">Category</span>
                        <select value={form.category} onChange={set("category")} required>
                            <option value="" disabled>
                                Choose…
                            </option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.name}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="admin-field">
                        <span className="admin-field__label">Price ($)</span>
                        <input type="number" min="0" step="0.01" value={form.price} onChange={set("price")} required />
                    </label>
                    <label className="admin-field">
                        <span className="admin-field__label">In stock</span>
                        <input type="number" min="0" step="1" value={form.stock_quantity} onChange={set("stock_quantity")} required />
                    </label>
                    <label className="admin-field">
                        <span className="admin-field__label">Main yarn color</span>
                        <input value={form.yarn_color} onChange={set("yarn_color")} placeholder="e.g. Marigold" />
                    </label>
                    <label className="admin-field admin-field--wide">
                        <span className="admin-field__label">Colorways offered (comma separated)</span>
                        <input value={form.colors} onChange={set("colors")} placeholder="Oat, Avocado, Tomato" />
                    </label>
                    <label className="admin-field admin-field--wide">
                        <span className="admin-field__label">Description</span>
                        <textarea rows={4} value={form.description} onChange={set("description")} />
                    </label>
                    <label className="admin-field">
                        <span className="admin-field__label">Materials</span>
                        <input value={form.materials} onChange={set("materials")} placeholder="100% cotton yarn" />
                    </label>
                    <label className="admin-field">
                        <span className="admin-field__label">Size / dimensions</span>
                        <input value={form.dimensions} onChange={set("dimensions")} placeholder="14in W x 12in H" />
                    </label>
                    <label className="admin-field">
                        <span className="admin-field__label">Care</span>
                        <input value={form.care_instructions} onChange={set("care_instructions")} placeholder="Hand wash cold" />
                    </label>
                    <label className="admin-field">
                        <span className="admin-field__label">Making time</span>
                        <input value={form.production_time} onChange={set("production_time")} placeholder="3-5 business days" />
                    </label>
                </div>

                <div className="admin-editor__side">
                    <ImageField
                        label="Cover photo"
                        value={form.image_url}
                        onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                    />
                    <GalleryField
                        label="More photos (product page gallery)"
                        value={form.images}
                        onChange={(images) => setForm((f) => ({ ...f, images }))}
                    />
                    <fieldset className="admin-checks">
                        <legend className="admin-field__label">Display</legend>
                        <label>
                            <input type="checkbox" checked={form.is_visible} onChange={set("is_visible")} />
                            Visible in the shop
                        </label>
                        <label>
                            <input type="checkbox" checked={form.featured} onChange={set("featured")} />
                            Featured (can appear on the homepage cover)
                        </label>
                        <label>
                            <input type="checkbox" checked={form.bestseller} onChange={set("bestseller")} />
                            Best seller
                        </label>
                    </fieldset>
                </div>
            </div>

            {error && <p className="admin-error">{error}</p>}
            <div className="admin-editor__foot">
                <button type="submit" className="admin-btn" disabled={saving}>
                    {saving ? "Saving…" : product ? "Save changes" : "Add product"}
                </button>
                <button type="button" className="admin-btn admin-btn--ghost" onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </form>
    );
}

function StockInput({ product, onSaved }) {
    const { notify } = useAdmin();
    const [value, setValue] = useState(String(product.stock_quantity));

    useEffect(() => setValue(String(product.stock_quantity)), [product.stock_quantity]);

    const save = async () => {
        const next = Math.max(0, parseInt(value, 10) || 0);
        if (next === product.stock_quantity) return setValue(String(next));
        try {
            const saved = await api(`/api/products/${product.id}`, {
                method: "PUT",
                body: { stock_quantity: next },
            });
            onSaved(saved);
            notify(`Stock for “${product.name}” set to ${next}`);
        } catch (err) {
            notify(err.message, "bad");
            setValue(String(product.stock_quantity));
        }
    };

    return (
        <input
            className="admin-stock-input"
            type="number"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            aria-label={`Stock for ${product.name}`}
        />
    );
}

export default function ProductsManager() {
    const { notify, refreshCounts } = useAdmin();
    const [products, setProducts] = useState(null);
    const [categories, setCategories] = useState([]);
    const [editing, setEditing] = useState(null); // null | "new" | product
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [visibility, setVisibility] = useState("all");

    const load = () => {
        api("/api/products?all=true")
            .then(setProducts)
            .catch((err) => {
                notify(err.message, "bad");
                setProducts([]);
            });
        api("/api/categories").then(setCategories).catch(() => {});
    };

    useEffect(load, []);

    const replace = (saved) =>
        setProducts((list) => {
            const exists = list.some((p) => p.id === saved.id);
            return exists ? list.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...list];
        });

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return (products || []).filter((p) => {
            if (category && p.category !== category) return false;
            if (visibility === "visible" && !p.is_visible) return false;
            if (visibility === "hidden" && p.is_visible) return false;
            if (visibility === "soldout" && p.stock_quantity > 0) return false;
            if (!q) return true;
            return [p.name, p.category, p.yarn_color].some((v) => v?.toLowerCase().includes(q));
        });
    }, [products, search, category, visibility]);

    const toggleVisible = async (p) => {
        try {
            const saved = await api(`/api/products/${p.id}`, {
                method: "PUT",
                body: { is_visible: !p.is_visible },
            });
            replace(saved);
            notify(saved.is_visible ? `“${p.name}” is now in the shop` : `“${p.name}” is hidden`);
            refreshCounts?.();
        } catch (err) {
            notify(err.message, "bad");
        }
    };

    const remove = async (p) => {
        if (!confirm(`Delete “${p.name}”? This can't be undone.`)) return;
        try {
            await api(`/api/products/${p.id}`, { method: "DELETE" });
            setProducts((list) => list.filter((x) => x.id !== p.id));
            notify(`Deleted “${p.name}”`);
        } catch (err) {
            notify(err.message, "bad");
        }
    };

    return (
        <div>
            <SectionHeader title="Products" description="Everything in the shop: prices, stock, photos, and what's visible.">
                <button type="button" className="admin-btn" onClick={() => setEditing("new")}>
                    + New product
                </button>
            </SectionHeader>

            {editing && (
                <ProductEditor
                    key={editing === "new" ? "new" : editing.id}
                    product={editing === "new" ? null : editing}
                    categories={categories}
                    onCancel={() => setEditing(null)}
                    onSaved={(saved) => {
                        replace(saved);
                        setEditing(null);
                        refreshCounts?.();
                    }}
                />
            )}

            <div className="admin-toolbar">
                <input
                    type="search"
                    className="admin-search"
                    placeholder="Search by name, category or color"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
                    <option value="">All categories</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <select value={visibility} onChange={(e) => setVisibility(e.target.value)} aria-label="Filter by status">
                    <option value="all">Any status</option>
                    <option value="visible">Visible</option>
                    <option value="hidden">Hidden</option>
                    <option value="soldout">Sold out</option>
                </select>
            </div>

            {products === null ? (
                <p className="admin-loading">Loading products…</p>
            ) : filtered.length === 0 ? (
                <EmptyState title={products.length ? "No products match" : "No products yet"}>
                    {products.length ? "Try a different search or filter." : "Add your first piece with “New product”."}
                </EmptyState>
            ) : (
                <div className="admin-table-wrap">
                    <table className="admin-table admin-table--products">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th className="admin-table__num">Price</th>
                                <th>Stock</th>
                                <th>Shop</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => (
                                <tr key={p.id} className={p.is_visible ? "" : "is-muted"}>
                                    <td>
                                        <div className="admin-product-cell">
                                            <span className="admin-thumb">
                                                {p.image_url ? <img src={getImageUrl(p.image_url)} alt="" /> : null}
                                            </span>
                                            <span>
                                                <strong>{p.name}</strong>
                                                <span className="admin-product-cell__flags">
                                                    #{p.id}
                                                    {p.featured && <StatusPill tone="info">Featured</StatusPill>}
                                                    {p.bestseller && <StatusPill tone="info">Best seller</StatusPill>}
                                                    {p.stock_quantity <= 0 && <StatusPill tone="bad">Sold out</StatusPill>}
                                                </span>
                                            </span>
                                        </div>
                                    </td>
                                    <td>{p.category}</td>
                                    <td className="admin-table__num">{formatMoney(p.price_cents)}</td>
                                    <td>
                                        <StockInput product={p} onSaved={replace} />
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className={`admin-switch${p.is_visible ? " is-on" : ""}`}
                                            role="switch"
                                            aria-checked={p.is_visible}
                                            aria-label={`Show ${p.name} in the shop`}
                                            onClick={() => toggleVisible(p)}
                                        >
                                            <span />
                                        </button>
                                    </td>
                                    <td className="admin-table__actions">
                                        <button type="button" className="admin-btn admin-btn--small admin-btn--ghost" onClick={() => setEditing(p)}>
                                            Edit
                                        </button>
                                        <button type="button" className="admin-link-btn admin-link-btn--danger" onClick={() => remove(p)}>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
