import { useEffect, useState } from "react";
import "./AdminContentList.css";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const emptyValues = (fields) =>
  fields.reduce((acc, f) => ({ ...acc, [f.name]: f.type === "number" ? 0 : "" }), {});

function truncate(text, max = 70) {
  if (typeof text !== "string") return text;
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export default function AdminContentList({ title, endpoint, fields, itemLabel = "item" }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // null | "new" | id
  const [form, setForm] = useState(emptyValues(fields));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`${API_URL}/api/${endpoint}`)
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(load, [endpoint]);

  const startCreate = () => {
    setForm(emptyValues(fields));
    setEditingId("new");
    setError(null);
  };

  const startEdit = (item) => {
    setForm(
      fields.reduce((acc, f) => ({ ...acc, [f.name]: item[f.name] ?? "" }), {})
    );
    setEditingId(item.id);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyValues(fields));
    setError(null);
  };

  const handleChange = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const isNew = editingId === "new";
    const url = isNew ? `${API_URL}/api/${endpoint}` : `${API_URL}/api/${endpoint}/${editingId}`;
    const method = isNew ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      cancelEdit();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(`Delete this ${itemLabel}? This can't be undone.`)) return;

    try {
      const res = await fetch(`${API_URL}/api/${endpoint}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Delete failed");
      }
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const summaryFields = fields.filter((f) => f.summary);
  const previewFields = summaryFields.length ? summaryFields : fields.slice(0, 2);

  return (
    <div className="admin-content">
      <div className="admin-content__header">
        <h2>{title}</h2>
        {editingId === null && (
          <button type="button" onClick={startCreate}>
            Add {itemLabel}
          </button>
        )}
      </div>

      {editingId !== null && (
        <form className="admin-content__form" onSubmit={handleSubmit}>
          <h3>{editingId === "new" ? `New ${itemLabel}` : `Edit ${itemLabel}`}</h3>

          <div className="admin-content__grid">
            {fields.map((f) => (
              <label
                key={f.name}
                className={f.type === "textarea" ? "admin-content__field--wide" : ""}
              >
                {f.label}
                {f.type === "textarea" ? (
                  <textarea
                    rows={4}
                    value={form[f.name]}
                    onChange={(e) => handleChange(f.name, e.target.value)}
                    required={f.required}
                  />
                ) : (
                  <input
                    type={f.type || "text"}
                    value={form[f.name]}
                    onChange={(e) => handleChange(f.name, e.target.value)}
                    required={f.required}
                  />
                )}
              </label>
            ))}
          </div>

          {error && <p className="admin-content__error">{error}</p>}

          <div className="admin-content__form-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" className="admin-content__cancel" onClick={cancelEdit}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p>No {itemLabel}s yet.</p>
      ) : (
        <table className="admin-content__table">
          <thead>
            <tr>
              {previewFields.map((f) => (
                <th key={f.name}>{f.label}</th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                {previewFields.map((f) => (
                  <td key={f.name}>{truncate(item[f.name])}</td>
                ))}
                <td className="admin-content__actions">
                  <button onClick={() => startEdit(item)}>Edit</button>
                  <button
                    className="admin-content__delete"
                    onClick={() => handleDelete(item.id)}
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
  );
}
