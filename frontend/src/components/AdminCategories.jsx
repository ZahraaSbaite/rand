
import { useState } from "react";
import "./AdminCategories.css";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function AdminCategories({ categories, onChange }) {
    const [newName, setNewName] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [error, setError] = useState(null);

    const handleAdd = async (e) => {
        e.preventDefault();

        if (!newName.trim()) return;

        setError(null);

        try {
            const res = await fetch(`${API_URL}/api/categories`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ name: newName.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to add");
            }

            setNewName("");
            onChange();
        } catch (err) {
            setError(err.message);
        }
    };

    const startEdit = (cat) => {
        setEditingId(cat.id);
        setEditingName(cat.name);
        setError(null);
    };

    const saveEdit = async (id) => {
        if (!editingName.trim()) return;

        setError(null);

        try {
            const res = await fetch(`${API_URL}/api/categories/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    name: editingName.trim(),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to update");
            }

            setEditingId(null);
            onChange();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (
            !confirm(
                "Delete this category? Existing products keep their current category text."
            )
        ) {
            return;
        }

        setError(null);

        try {
            const res = await fetch(`${API_URL}/api/categories/${id}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to delete");
            }

            onChange();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="admin-categories">
            <h3>Categories</h3>

            <form
                className="admin-categories__add"
                onSubmit={handleAdd}
            >
                <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="New category name"
                />

                <button type="submit">Add</button>
            </form>

            {error && (
                <p className="admin-categories__error">
                    {error}
                </p>
            )}

            <ul className="admin-categories__list">
                {categories.map((cat) => (
                    <li key={cat.id}>
                        {editingId === cat.id ? (
                            <>
                                <input
                                    value={editingName}
                                    onChange={(e) =>
                                        setEditingName(e.target.value)
                                    }
                                    autoFocus
                                />

                                <button
                                    onClick={() => saveEdit(cat.id)}
                                >
                                    Save
                                </button>

                                <button
                                    onClick={() => setEditingId(null)}
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                <span>{cat.name}</span>

                                <button
                                    onClick={() => startEdit(cat)}
                                >
                                    Edit
                                </button>

                                <button
                                    onClick={() => handleDelete(cat.id)}
                                    className="admin-categories__delete"
                                >
                                    Delete
                                </button>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

