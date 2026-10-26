import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api.js";
import { variantLabel } from "../../lib/productOptions.js";
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

const STATUSES = [
    { key: "published", label: "Published", hint: "In the shop and can be ordered." },
    { key: "draft", label: "Draft", hint: "Only you can see it. Use while you're still setting it up." },
    { key: "sold_out", label: "Sold out", hint: "Shown in the shop as sold out, whatever the stock says." },
    { key: "unavailable", label: "Temporarily unavailable", hint: "Shown as “back soon” and can't be ordered for now." },
    { key: "discontinued", label: "Discontinued", hint: "No longer made. Hidden from the shop; its page says so." },
];
const STATUS_BY_KEY = Object.fromEntries(STATUSES.map((s) => [s.key, s]));
const STATUS_TONES = { published: "ok", draft: "neutral", sold_out: "bad", unavailable: "warn", discontinued: "neutral" };

const OPTION_PRESETS = ["Color", "Size", "Strap type"];
const MAX_GROUPS = 3;
const MAX_COMBINATIONS = 200;

const EMPTY = {
    name: "",
    category: "",
    price: "",
    yarn_color: "",
    description: "",
    materials: "",
    dimensions: "",
    care_instructions: "",
    production_time: "",
    image_url: "",
    images: [],
    featured: false,
    bestseller: false,
    status: "published",
    fulfillment: "ready",
    custom_colors: "0",
    groups: [],
    stock: {},
};

const parseValues = (text) => [...new Set(text.split(",").map((v) => v.trim()).filter(Boolean))];

/** Every combination of the groups' values, e.g. [{Color: "Oat", Size: "S"}, …]; [{}] without options. */
function combinations(groups) {
    return groups.reduce(
        (combos, g) => combos.flatMap((c) => parseValues(g.valuesText).map((v) => ({ ...c, [g.name.trim()]: v }))),
        [{}]
    );
}

// Keyed on the values in option order, so renaming an option keeps its stock numbers.
const comboKey = (groups, options) => JSON.stringify(groups.map((g) => options[g.name.trim()] ?? null));

function toForm(p) {
    const groups = (p.option_groups || []).map((g) => ({ name: g.name, valuesText: g.values.join(", ") }));
    const stock = {};
    for (const v of p.variants || []) {
        const options = Array.isArray(v.options) ? {} : v.options;
        stock[comboKey(groups, options)] = { quantity: String(v.stock_quantity), available: v.is_available };
    }
    return {
        name: p.name || "",
        category: p.category || "",
        price: p.price_cents != null ? (p.price_cents / 100).toFixed(2) : "",
        yarn_color: p.yarn_color || "",
        description: p.description || "",
        materials: p.materials || "",
        dimensions: p.dimensions || "",
        care_instructions: p.care_instructions || "",
        production_time: p.production_time || "",
        image_url: p.image_url || "",
        images: p.images || [],
        featured: !!p.featured,
        bestseller: !!p.bestseller,
        status: p.status || "published",
        fulfillment: p.fulfillment || "ready",
        custom_colors: String(p.custom_colors ?? 0),
        groups,
        stock,
    };
}

function toPayload(f) {
    const groups = f.groups.filter((g) => g.name.trim() || g.valuesText.trim());
    return {
        name: f.name.trim(),
        category: f.category,
        price_cents: Math.round(Number(f.price) * 100),
        yarn_color: f.yarn_color.trim(),
        description: f.description.trim(),
        materials: f.materials.trim(),
        dimensions: f.dimensions.trim(),
        care_instructions: f.care_instructions.trim(),
        production_time: f.production_time.trim(),
        image_url: f.image_url,
        images: f.images,
        featured: f.featured,
        bestseller: f.bestseller,
        status: f.status,
        fulfillment: f.fulfillment,
        custom_colors: Number(f.custom_colors),
        option_groups: groups.map((g) => ({ name: g.name.trim(), values: parseValues(g.valuesText) })),
        variants: combinations(groups).map((options) => {
            const row = f.stock[comboKey(groups, options)];
            return {
                options,
                stock_quantity: Math.max(0, parseInt(row?.quantity, 10) || 0),
                is_available: row?.available ?? true,
            };
        }),
    };
}

function OptionsEditor({ form, setForm }) {
    const groups = form.groups;
    const live = groups.filter((g) => g.name.trim() && parseValues(g.valuesText).length);
    const combos = combinations(live);
    const madeToOrder = form.fulfillment === "made_to_order";

    const setGroup = (i, key) => (e) =>
        setForm((f) => ({ ...f, groups: f.groups.map((g, j) => (j === i ? { ...g, [key]: e.target.value } : g)) }));
    const addGroup = (name = "") =>
        setForm((f) => ({ ...f, groups: [...f.groups, { name, valuesText: "" }] }));
    const removeGroup = (i) => setForm((f) => ({ ...f, groups: f.groups.filter((_, j) => j !== i) }));
    const setStock = (key, patch) =>
        setForm((f) => ({
            ...f,
            stock: { ...f.stock, [key]: { quantity: "0", available: true, ...f.stock[key], ...patch } },
        }));

    const unused = OPTION_PRESETS.filter((p) => !groups.some((g) => g.name.trim().toLowerCase() === p.toLowerCase()));

    return (
        <section className="admin-options">
            <div className="admin-options__head">
                <h3>Options and stock</h3>
                <p className="admin-field__hint">
                    What customers choose, like color, size or strap type. Each combination gets its own stock and sells
                    out on its own.
                </p>
            </div>

            {groups.map((g, i) => (
                <div className="admin-options__group" key={i}>
                    <label className="admin-field">
                        <span className="admin-field__label">Option</span>
                        <input value={g.name} onChange={setGroup(i, "name")} placeholder="e.g. Color" maxLength={40} />
                    </label>
                    <label className="admin-field">
                        <span className="admin-field__label">Choices (comma separated)</span>
                        <input value={g.valuesText} onChange={setGroup(i, "valuesText")} placeholder="Oat, Avocado, Tomato" />
                    </label>
                    <button
                        type="button"
                        className="admin-link-btn admin-link-btn--danger"
                        onClick={() => removeGroup(i)}
                        aria-label={`Remove option ${g.name || i + 1}`}
                    >
                        Remove
                    </button>
                </div>
            ))}

            {groups.length < MAX_GROUPS && (
                <div className="admin-row">
                    {unused.map((name) => (
                        <button key={name} type="button" className="admin-btn admin-btn--small admin-btn--ghost" onClick={() => addGroup(name)}>
                            + {name}
                        </button>
                    ))}
                    <button type="button" className="admin-btn admin-btn--small admin-btn--ghost" onClick={() => addGroup()}>
                        + Other option
                    </button>
                </div>
            )}

            {combos.length > MAX_COMBINATIONS ? (
                <p className="admin-error">
                    That makes {combos.length} combinations; the most is {MAX_COMBINATIONS}. Remove a few choices.
                </p>
            ) : (
                <div className="admin-table-wrap">
                    <table className="admin-table admin-variants">
                        <thead>
                            <tr>
                                <th>{live.length ? live.map((g) => g.name.trim()).join(" / ") : "Product"}</th>
                                {!madeToOrder && <th>In stock</th>}
                                <th>Offered</th>
                            </tr>
                        </thead>
                        <tbody>
                            {combos.map((options) => {
                                const key = comboKey(live, options);
                                const row = form.stock[key] || { quantity: "0", available: true };
                                const label = Object.values(options).join(" / ") || "Every piece";
                                return (
                                    <tr key={key} className={row.available ? "" : "is-muted"}>
                                        <td>{label}</td>
                                        {!madeToOrder && (
                                            <td>
                                                <input
                                                    className="admin-stock-input"
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={row.quantity}
                                                    onChange={(e) => setStock(key, { quantity: e.target.value })}
                                                    aria-label={`Stock for ${label}`}
                                                />
                                            </td>
                                        )}
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={row.available}
                                                onChange={(e) => setStock(key, { available: e.target.checked })}
                                                aria-label={`Offer ${label}`}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            <p className="admin-field__hint">
                {madeToOrder
                    ? "Made to order, so there's no stock count. Untick a combination you can't make right now (say, out of that yarn)."
                    : "A combination with 0 in stock shows as sold out. Untick one you don't make at all."}
            </p>
        </section>
    );
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
                        <span className="admin-field__label">Main yarn color</span>
                        <input value={form.yarn_color} onChange={set("yarn_color")} placeholder="e.g. Marigold" />
                    </label>
                    <label className="admin-field">
                        <span className="admin-field__label">Making time</span>
                        <input value={form.production_time} onChange={set("production_time")} placeholder="3-5 business days" />
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
                    <label className="admin-field admin-field--wide">
                        <span className="admin-field__label">Care</span>
                        <input value={form.care_instructions} onChange={set("care_instructions")} placeholder="Hand wash cold" />
                    </label>
                </div>

                <div className="admin-editor__side">
                    <label className="admin-field">
                        <span className="admin-field__label">Status</span>
                        <select value={form.status} onChange={set("status")}>
                            {STATUSES.map((s) => (
                                <option key={s.key} value={s.key}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                        <span className="admin-field__hint">{STATUS_BY_KEY[form.status]?.hint}</span>
                    </label>
                    <fieldset className="admin-checks">
                        <legend className="admin-field__label">How it's made</legend>
                        <label>
                            <input
                                type="radio"
                                name="fulfillment"
                                value="ready"
                                checked={form.fulfillment === "ready"}
                                onChange={set("fulfillment")}
                            />
                            Ready-made: finished pieces in stock
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="fulfillment"
                                value="made_to_order"
                                checked={form.fulfillment === "made_to_order"}
                                onChange={set("fulfillment")}
                            />
                            Made to order: crocheted after it's ordered
                        </label>
                    </fieldset>
                    <label className="admin-field">
                        <span className="admin-field__label">Customers choose the colors</span>
                        <select value={form.custom_colors} onChange={set("custom_colors")}>
                            <option value="0">No, it comes as listed</option>
                            <option value="1">Yes, 1 color</option>
                            <option value="2">Yes, up to 2 colors</option>
                            <option value="3">Yes, up to 3 colors</option>
                            <option value="4">Yes, up to 4 colors</option>
                        </select>
                        <span className="admin-field__hint">
                            For pieces you make in any color. Customers pick from the yarn palette or type their own color,
                            and it shows on the order.
                        </span>
                    </label>
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

            <OptionsEditor form={form} setForm={setForm} />

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

/** The stock cell: editable in place for a simple product, a summary when it has options. */
function StockCell({ product, onSaved, onEdit }) {
    if (product.fulfillment === "made_to_order") {
        return <span className="admin-muted">Made to order</span>;
    }
    const variants = product.variants || [];
    if (variants.length <= 1 && !(product.option_groups || []).length) {
        return <StockInput product={product} onSaved={onSaved} />;
    }
    const out = variants.filter((v) => v.is_available && v.stock_quantity <= 0);
    return (
        <button
            type="button"
            className="admin-link-btn"
            onClick={onEdit}
            title={out.map((v) => `${variantLabel(product, v)} is sold out`).join("\n") || undefined}
        >
            {product.stock_quantity} across {variants.length} options
            {out.length > 0 && <> · {out.length} sold out</>}
        </button>
    );
}

// Sold out on stock alone (not by status): published ready-made pieces with nothing left.
const soldOutOnStock = (p) => p.status === "published" && p.fulfillment !== "made_to_order" && p.stock_quantity <= 0;

export default function ProductsManager() {
    const { notify, refreshCounts } = useAdmin();
    const [products, setProducts] = useState(null);
    const [categories, setCategories] = useState([]);
    const [editing, setEditing] = useState(null); // null | "new" | product
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

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
            if (statusFilter === "made_to_order" && p.fulfillment !== "made_to_order") return false;
            if (statusFilter === "sold_out" && !(p.status === "sold_out" || soldOutOnStock(p))) return false;
            if (!["all", "made_to_order", "sold_out"].includes(statusFilter) && p.status !== statusFilter) return false;
            if (!q) return true;
            return [p.name, p.category, p.yarn_color].some((v) => v?.toLowerCase().includes(q));
        });
    }, [products, search, category, statusFilter]);

    const setStatus = async (p, status) => {
        try {
            const saved = await api(`/api/products/${p.id}`, { method: "PUT", body: { status } });
            replace(saved);
            notify(`“${p.name}” is now ${STATUS_BY_KEY[status].label.toLowerCase()}`);
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
            <SectionHeader title="Products" description="Everything in the shop: prices, options, stock, photos, and status.">
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
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
                    <option value="all">Any status</option>
                    {STATUSES.map((s) => (
                        <option key={s.key} value={s.key}>
                            {s.key === "sold_out" ? "Sold out (any reason)" : s.label}
                        </option>
                    ))}
                    <option value="made_to_order">Made to order</option>
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
                                <th>Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => (
                                <tr key={p.id} className={["draft", "discontinued"].includes(p.status) ? "is-muted" : ""}>
                                    <td>
                                        <div className="admin-product-cell">
                                            <span className="admin-thumb">
                                                {p.image_url ? <img src={getImageUrl(p.image_url)} alt="" /> : null}
                                            </span>
                                            <span>
                                                <strong>{p.name}</strong>
                                                <span className="admin-product-cell__flags">
                                                    #{p.id}
                                                    {p.status !== "published" && (
                                                        <StatusPill tone={STATUS_TONES[p.status]}>{STATUS_BY_KEY[p.status]?.label}</StatusPill>
                                                    )}
                                                    {p.fulfillment === "made_to_order" && <StatusPill tone="info">Made to order</StatusPill>}
                                                    {p.featured && <StatusPill tone="info">Featured</StatusPill>}
                                                    {p.bestseller && <StatusPill tone="info">Best seller</StatusPill>}
                                                    {soldOutOnStock(p) && <StatusPill tone="bad">Sold out</StatusPill>}
                                                </span>
                                            </span>
                                        </div>
                                    </td>
                                    <td>{p.category}</td>
                                    <td className="admin-table__num">{formatMoney(p.price_cents)}</td>
                                    <td>
                                        <StockCell product={p} onSaved={replace} onEdit={() => setEditing(p)} />
                                    </td>
                                    <td>
                                        <select
                                            className="admin-status-select"
                                            value={p.status}
                                            onChange={(e) => setStatus(p, e.target.value)}
                                            aria-label={`Status of ${p.name}`}
                                        >
                                            {STATUSES.map((s) => (
                                                <option key={s.key} value={s.key}>
                                                    {s.label}
                                                </option>
                                            ))}
                                        </select>
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
