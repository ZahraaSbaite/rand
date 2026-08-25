import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminProducts from "../components/AdminProducts.jsx";
import AdminOrders from "../components/AdminOrders.jsx";
import "./Admin.css";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Admin() {
    const [tab, setTab] = useState("products");
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await fetch(`${API_URL}/api/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
        } finally {
            navigate("/admin/login");
        }
    };

    return (
        <main className="admin">
            <div className="admin__header">
                <h1 className="admin__title">Admin</h1>
                <button className="admin__logout" onClick={handleLogout}>
                    Log out
                </button>
            </div>

            <div className="admin__tabs">
                <button
                    className={`admin__tab ${tab === "products" ? "admin__tab--active" : ""}`}
                    onClick={() => setTab("products")}
                >
                    Products
                </button>
                <button
                    className={`admin__tab ${tab === "orders" ? "admin__tab--active" : ""}`}
                    onClick={() => setTab("orders")}
                >
                    Orders
                </button>
            </div>

            {tab === "products" ? <AdminProducts /> : <AdminOrders />}
        </main>
    );
}
