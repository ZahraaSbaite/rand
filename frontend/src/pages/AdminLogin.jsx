import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./AdminLogin.css";

const API_URL =
    import.meta.env.VITE_API_URL || "";

export default function AdminLogin() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ password }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Login failed");

            navigate("/admin");
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="admin-login">
            <form className="admin-login__form" onSubmit={handleSubmit}>
                <p className="admin-login__mark">RRAND</p>
                <h1>Studio login</h1>
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                    required
                />
                {error && <p className="admin-login__error">{error}</p>}
                <button type="submit" disabled={submitting}>
                    {submitting ? "Checking…" : "Log in"}
                </button>
                <Link to="/" className="admin-login__back">
                    Back to the shop
                </Link>
            </form>
        </main>
    );
}