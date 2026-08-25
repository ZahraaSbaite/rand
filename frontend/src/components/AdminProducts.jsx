
import { useEffect, useMemo, useState } from "react";
import AdminCategories from "./AdminCategories.jsx";
import "./AdminProducts.css";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:4000";

const emptyForm = {
    name: "",
    description: "",
    price_cents: "",
    image_url: "",
    yarn_color: "",
    category: "",
    stock_quantity: "",
};

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");

    const loadProducts = () => {
        setLoading(true);

        fetch(`${API_URL}/api/products`)
            .then((res) => res.json())
            .then((data) => {
                setProducts(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    };

    const loadCategories = () => {
        fetch(`${API_URL}/api/categories`)
            .then((res) => res.json())
            .then(setCategories)
            .catch(console.error);
    };

    useEffect(() => {
        loadProducts();
        loadCategories();
    }, []);

    const filteredProducts = useMemo(() => {
        if (!search.trim()) return products;

        const q = search.trim().toLowerCase();

        return products.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.category?.toLowerCase().includes(q) ||
                p.yarn_color?.toLowerCase().includes(q)
        );
    }, [products, search]);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const startEdit = (product) => {
        setEditingId(product.id);

        setForm({
            name: product.name || "",
            description: product.description || "",
            price_cents: product.price_cents ?? "",
            image_url: product.image_url || "",
            yarn_color: product.yarn_color || "",
            category: product.category || "",
            stock_quantity: product.stock_quantity ?? "",
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm(emptyForm);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setSaving(true);

        const payload = {
            ...form,
            price_cents: Number(form.price_cents),
            stock_quantity: Number(form.stock_quantity),
        };

        try {
            const url = editingId
                ? `${API_URL}/api/products/${editingId}`
                : `${API_URL}/api/products`;

            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));

                throw new Error(
                    data.error || "Save failed"
                );
            }

            cancelEdit();
            loadProducts();
        } catch (err) {
            console.error(err);

            alert(
                "Couldn't save that product. Check the console for details."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (
            !confirm(
                "Delete this product? This can't be undone."
            )
        ) {
            return;
        }

        try {
            const res = await fetch(
                `${API_URL}/api/products/${id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!res.ok) {
                const data = await res
                    .json()
                    .catch(() => ({}));

                throw new Error(
                    data.error || "Delete failed"
                );
            }

            loadProducts();
        } catch (err) {
            console.error(err);

            alert("Couldn't delete that product.");
        }
    };

    return (
        <div className="admin-products">
            <div className="admin-products__layout">
                <div className="admin-products__main">
                    <form
                        className="admin-products__form"
                        onSubmit={handleSubmit}
                    >
                        <h2>
                            {editingId
                                ? "Edit product"
                                : "Add a new product"}
                        </h2>

                        <div className="admin-products__grid">
                            <label>
                                Name

                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                />
                            </label>

                            <label>
                                Category

                                <select
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                >
                                    <option value="">
                                        Select a category
                                    </option>

                                    {categories.map((cat) => (
                                        <option
                                            key={cat.id}
                                            value={cat.name}
                                        >
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Price (cents)

                                <input
                                    name="price_cents"
                                    type="number"
                                    min="0"
                                    value={form.price_cents}
                                    onChange={handleChange}
                                    required
                                />
                            </label>

                            <label>
                                Stock quantity

                                <input
                                    name="stock_quantity"
                                    type="number"
                                    min="0"
                                    value={
                                        form.stock_quantity
                                    }
                                    onChange={handleChange}
                                    required
                                />
                            </label>

                            <label>
                                Yarn color

                                <input
                                    name="yarn_color"
                                    value={form.yarn_color}
                                    onChange={handleChange}
                                />
                            </label>

                            <label>
                                Image URL

                                <input
                                    name="image_url"
                                    value={form.image_url}
                                    onChange={handleChange}
                                />
                            </label>
                        </div>

                        <label className="admin-products__description">
                            Description

                            <textarea
                                name="description"
                                rows={3}
                                value={form.description}
                                onChange={handleChange}
                            />
                        </label>

                        <div className="admin-products__form-actions">
                            <button
                                type="submit"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving…"
                                    : editingId
                                        ? "Save changes"
                                        : "Add product"}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="admin-products__cancel"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>

                    <div className="admin-products__list-header">
                        <h2 className="admin-products__list-title">
                            All products
                        </h2>

                        <input
                            className="admin-products__search"
                            type="search"
                            placeholder="Search by name, category, or color"
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />
                    </div>

                    {loading ? (
                        <p>Loading products…</p>
                    ) : filteredProducts.length === 0 ? (
                        <p>
                            No products match "{search}".
                        </p>
                    ) : (
                        <table className="admin-products__table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th></th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredProducts.map((p) => (
                                    <tr key={p.id}>
                                        <td>{p.name}</td>

                                        <td>{p.category}</td>

                                        <td>
                                            $
                                            {(
                                                p.price_cents /
                                                100
                                            ).toFixed(2)}
                                        </td>

                                        <td>
                                            {p.stock_quantity}
                                        </td>

                                        <td className="admin-products__actions">
                                            <button
                                                onClick={() =>
                                                    startEdit(p)
                                                }
                                            >
                                                Edit
                                            </button>

                                            <button
                                                onClick={() =>
                                                    handleDelete(
                                                        p.id
                                                    )
                                                }
                                                className="admin-products__delete"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <aside className="admin-products__sidebar">
                    <AdminCategories
                        categories={categories}
                        onChange={loadCategories}
                    />
                </aside>
            </div>
        </div>
    );
}