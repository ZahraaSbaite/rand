import { useEffect, useState } from "react";
import "./AdminContentList.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function AdminReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = () => {
        setLoading(true);
        fetch(`${API_URL}/api/reviews/admin`, { credentials: "include" })
            .then((res) => res.json())
            .then((data) => {
                setReviews(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(load, []);

    const handleApprove = async (id) => {
        try {
            const res = await fetch(`${API_URL}/api/reviews/${id}/approve`, {
                method: "PATCH",
                credentials: "include",
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Approve failed");
            }
            load();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this review? This can't be undone.")) return;

        try {
            const res = await fetch(`${API_URL}/api/reviews/${id}`, {
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

    return (
        <div className="admin-content">
            <div className="admin-content__header">
                <h2>Reviews</h2>
            </div>

            {loading ? (
                <p>Loading…</p>
            ) : reviews.length === 0 ? (
                <p>No reviews yet.</p>
            ) : (
                <table className="admin-content__table">
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Customer</th>
                            <th>Product</th>
                            <th>Rating</th>
                            <th>Comment</th>
                            <th>Date</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {reviews.map((r) => (
                            <tr key={r.id}>
                                <td>{r.approved ? "Approved" : "Pending"}</td>
                                <td>{r.customer_name}</td>
                                <td>{r.product_name || "General experience"}</td>
                                <td>{r.rating} / 5</td>
                                <td>{r.comment.length > 80 ? `${r.comment.slice(0, 80)}…` : r.comment}</td>
                                <td>{new Date(r.created_at).toLocaleDateString()}</td>
                                <td className="admin-content__actions">
                                    {!r.approved && (
                                        <button className="admin-content__approve" onClick={() => handleApprove(r.id)}>
                                            Approve
                                        </button>
                                    )}
                                    <button className="admin-content__delete" onClick={() => handleDelete(r.id)}>
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
