import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const API_URL =
    import.meta.env.VITE_API_URL || "";

export default function ProtectedRoute({ children }) {
    const [status, setStatus] = useState("checking");

    useEffect(() => {
        let cancelled = false;

        fetch(`${API_URL}/api/auth/me`, { credentials: "include" })
            .then((res) => {
                if (!cancelled) setStatus(res.ok ? "authenticated" : "unauthenticated");
            })
            .catch(() => {
                if (!cancelled) setStatus("unauthenticated");
            });

        return () => {
            cancelled = true;
        };
    }, []);

    if (status === "checking") {
        return null;
    }

    if (status === "unauthenticated") {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
}
