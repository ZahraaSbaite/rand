import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api.js";

const CartContext = createContext(null);
const STORAGE_KEY = "rrand_cart";

export function CartProvider({ children }) {
    const [cartRefs, setCartRefs] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cartRefs));
    }, [cartRefs]);

    // A saved cart can outlive its products (deleted or hidden in the admin).
    // Drop those once the shop's list is in, so the cart badge matches the cart.
    useEffect(() => {
        api("/api/products")
            .then((products) => {
                if (!Array.isArray(products)) return;
                const inShop = new Set(products.map((p) => p.id));
                setCartRefs((prev) => {
                    const kept = prev.filter((r) => inShop.has(r.product_id));
                    return kept.length === prev.length ? prev : kept;
                });
            })
            .catch(() => {
                // Offline or API down: keep the cart as it is.
            });
    }, []);

    const addToCart = (productId, quantity = 1) => {
        setCartRefs((prev) => {
            const existing = prev.find((r) => r.product_id === productId);
            if (existing) {
                return prev.map((r) =>
                    r.product_id === productId
                        ? { ...r, quantity: r.quantity + quantity }
                        : r
                );
            }
            return [...prev, { product_id: productId, quantity }];
        });
    };

    const removeFromCart = (productId) => {
        setCartRefs((prev) => prev.filter((r) => r.product_id !== productId));
    };

    const updateCartQuantity = (productId, quantity) => {
        setCartRefs((prev) =>
            prev.map((r) => (r.product_id === productId ? { ...r, quantity } : r))
        );
    };

    const clearCart = () => setCartRefs([]);

    return (
        <CartContext.Provider
            value={{ cartRefs, addToCart, removeFromCart, updateCartQuantity, clearCart }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used inside CartProvider");
    return context;
}