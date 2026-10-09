import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { EmptyState, SectionHeader, useAdmin } from "./AdminUI.jsx";

export default function CategoriesManager() {
    const { notify } = useAdmin();
    const [categories, setCategories] = useState(null);
    const [counts, setCounts] = useState({});
    const [newName, setNewName] = useState("");
    const [editing, setEditing] = useState(null); // { id, name, description }

    const load = () => {
        api("/api/categories")
            .then(setCategories)
            .catch((err) => {
                notify(err.message, "bad");
                setCategories([]);
            });
        api("/api/products?all=true")
            .then((products) => {
                const c = {};
                products.forEach((p) => (c[p.category] = (c[p.category] || 0) + 1));
                setCounts(c);
            })
            .catch(() => {});
    };

    useEffect(load, []);

    const add = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;
        try {
            await api("/api/categories", { method: "POST", body: { name: newName.trim() } });
            notify(`Added “${newName.trim()}”`);
            setNewName("");
            load();
        } catch (err) {
            notify(err.message, "bad");
        }
    };

    const save = async () => {
        try {
            await api(`/api/categories/${editing.id}`, {
                method: "PUT",
                body: { name: editing.name.trim(), description: editing.description },
            });
            notify("Category saved. Products in it were updated too.");
            setEditing(null);
            load();
        } catch (err) {
            notify(err.message, "bad");
        }
    };

    const move = async (index, dir) => {
        const list = [...categories];
        const other = index + dir;
        if (other < 0 || other >= list.length) return;
        [list[index], list[other]] = [list[other], list[index]];
        setCategories(list);
        try {
            await Promise.all(
                list.map((c, i) =>
                    api(`/api/categories/${c.id}`, { method: "PUT", body: { name: c.name, sort_order: i + 1 } })
                )
            );
        } catch (err) {
            notify(err.message, "bad");
            load();
        }
    };

    const remove = async (cat) => {
        const n = counts[cat.name] || 0;
        const warning = n
            ? `“${cat.name}” still has ${n} product${n === 1 ? "" : "s"}. They keep the category name but it won't appear in the menu. Delete anyway?`
            : `Delete “${cat.name}”?`;
        if (!confirm(warning)) return;
        try {
            await api(`/api/categories/${cat.id}`, { method: "DELETE" });
            notify(`Deleted “${cat.name}”`);
            load();
        } catch (err) {
            notify(err.message, "bad");
        }
    };

    return (
        <div>
            <SectionHeader
                title="Categories"
                description="What the shop sells. The order here is the order in the menu, the homepage and the shop."
            />

            <form className="admin-inline-form" onSubmit={add}>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New category, e.g. Hats" />
                <button type="submit" className="admin-btn">
                    Add category
                </button>
            </form>

            {categories === null ? (
                <p className="admin-loading">Loading…</p>
            ) : categories.length === 0 ? (
                <EmptyState title="No categories yet" />
            ) : (
                <ul className="admin-cards">
                    {categories.map((cat, i) => (
                        <li key={cat.id} className="admin-card">
                            {editing?.id === cat.id ? (
                                <div className="admin-card__edit">
                                    <label className="admin-field">
                                        <span className="admin-field__label">Name</span>
                                        <input
                                            value={editing.name}
                                            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                                            autoFocus
                                        />
                                    </label>
                                    <label className="admin-field">
                                        <span className="admin-field__label">Short description</span>
                                        <input
                                            value={editing.description}
                                            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                                        />
                                    </label>
                                    <div className="admin-row">
                                        <button type="button" className="admin-btn admin-btn--small" onClick={save}>
                                            Save
                                        </button>
                                        <button type="button" className="admin-link-btn" onClick={() => setEditing(null)}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="admin-card__order">
                                        <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${cat.name} up`}>
                                            ↑
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => move(i, 1)}
                                            disabled={i === categories.length - 1}
                                            aria-label={`Move ${cat.name} down`}
                                        >
                                            ↓
                                        </button>
                                    </div>
                                    <div className="admin-card__body">
                                        <strong>{cat.name}</strong>
                                        <span className="admin-muted">
                                            {counts[cat.name] || 0} product{counts[cat.name] === 1 ? "" : "s"}
                                            {cat.description ? ` · ${cat.description}` : ""}
                                        </span>
                                    </div>
                                    <div className="admin-row">
                                        <button
                                            type="button"
                                            className="admin-btn admin-btn--small admin-btn--ghost"
                                            onClick={() =>
                                                setEditing({ id: cat.id, name: cat.name, description: cat.description || "" })
                                            }
                                        >
                                            Edit
                                        </button>
                                        <button type="button" className="admin-link-btn admin-link-btn--danger" onClick={() => remove(cat)}>
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
