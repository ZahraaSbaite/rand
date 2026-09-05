import { createContext, useContext, useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const CustomerAuthContext = createContext(null);

export function CustomerAuthProvider({ children }) {
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/api/customers/me`, { credentials: "include" })
            .then((res) => (res.ok ? res.json() : null))
            .then(setCustomer)
            .catch(() => setCustomer(null))
            .finally(() => setLoading(false));
    }, []);

    const login = async (email, password) => {
        const res = await fetch(`${API_URL}/api/customers/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");
        setCustomer(data);
        return data;
    };

    const register = async (name, email, password) => {
        const res = await fetch(`${API_URL}/api/customers/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");
        setCustomer(data);
        return data;
    };

    const logout = async () => {
        await fetch(`${API_URL}/api/customers/logout`, {
            method: "POST",
            credentials: "include",
        });
        setCustomer(null);
    };

    return (
        <CustomerAuthContext.Provider value={{ customer, loading, login, register, logout }}>
            {children}
        </CustomerAuthContext.Provider>
    );
}

export function useCustomerAuth() {
    const context = useContext(CustomerAuthContext);
    if (!context) throw new Error("useCustomerAuth must be used inside CustomerAuthProvider");
    return context;
}
