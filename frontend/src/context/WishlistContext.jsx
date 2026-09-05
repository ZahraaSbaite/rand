import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useCustomerAuth } from "./CustomerAuthContext.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
    const { customer } = useCustomerAuth();
    const [wishlistIds, setWishlistIds] = useState([]);

    const refresh = useCallback(() => {
        if (!customer) {
            setWishlistIds([]);
            return;
        }
        fetch(`${API_URL}/api/wishlist`, { credentials: "include" })
            .then((res) => (res.ok ? res.json() : []))
            .then((items) => setWishlistIds(items.map((p) => p.id)))
            .catch(() => setWishlistIds([]));
    }, [customer]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const isWishlisted = (productId) => wishlistIds.includes(productId);

    const removeFromWishlist = (productId) => {
        setWishlistIds((prev) => prev.filter((id) => id !== productId));
        fetch(`${API_URL}/api/wishlist/${productId}`, {
            method: "DELETE",
            credentials: "include",
        }).catch(() => refresh());
    };

    // Returns false when the caller isn't logged in, so the UI can redirect to /login.
    const toggleWishlist = (productId) => {
        if (!customer) return false;

        if (wishlistIds.includes(productId)) {
            removeFromWishlist(productId);
        } else {
            setWishlistIds((prev) => [...prev, productId]);
            fetch(`${API_URL}/api/wishlist`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ product_id: productId }),
            }).catch(() => refresh());
        }
        return true;
    };

    return (
        <WishlistContext.Provider
            value={{ wishlistIds, isWishlisted, toggleWishlist, removeFromWishlist }}
        >
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (!context) throw new Error("useWishlist must be used inside WishlistProvider");
    return context;
}
