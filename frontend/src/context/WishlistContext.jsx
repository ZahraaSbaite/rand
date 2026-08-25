import { createContext, useContext, useEffect, useState } from "react";

const WishlistContext = createContext(null);
const STORAGE_KEY = "rrand_wishlist";

export function WishlistProvider({ children }) {
    const [wishlistIds, setWishlistIds] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlistIds));
    }, [wishlistIds]);

    const isWishlisted = (productId) => wishlistIds.includes(productId);

    const toggleWishlist = (productId) => {
        setWishlistIds((prev) =>
            prev.includes(productId)
                ? prev.filter((id) => id !== productId)
                : [...prev, productId]
        );
    };

    const removeFromWishlist = (productId) => {
        setWishlistIds((prev) => prev.filter((id) => id !== productId));
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
