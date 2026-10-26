import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { buyableVariants } from "../lib/productOptions.js";

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

    // A saved cart can outlive its products (deleted or retired in the admin)
    // or their options (renamed, or saved before options existed). Once the
    // shop's list is in, drop missing products and point each line at an
    // option the product still has, so the cart matches what can be ordered.
    useEffect(() => {
        api("/api/products")
            .then((products) => {
                if (!Array.isArray(products)) return;
                const byId = new Map(products.map((p) => [p.id, p]));
                setCartRefs((prev) => {
                    let changed = false;
                    const next = [];
                    for (const ref of prev) {
                        const product = byId.get(ref.product_id);
                        const variantId = product && currentVariantId(product, ref);
                        if (!variantId) {
                            changed = true;
                            continue;
                        }
                        if (variantId !== ref.variant_id || "color" in ref) changed = true;
                        mergeLine(next, { product_id: ref.product_id, variant_id: variantId, quantity: ref.quantity });
                    }
                    return changed ? next : prev;
                });
            })
            .catch(() => {
                // Offline or API down: keep the cart as it is.
            });
    }, []);

    // A cart line is one product in one variant (its chosen options).
    const addToCart = (productId, quantity = 1, variantId = null) => {
        setCartRefs((prev) => {
            const next = [...prev];
            mergeLine(next, { product_id: productId, variant_id: variantId, quantity });
            return next;
        });
    };

    const removeFromCart = (productId, variantId = null) => {
        setCartRefs((prev) => prev.filter((r) => !isLine(r, productId, variantId)));
    };

    const updateCartQuantity = (productId, variantId, quantity) => {
        setCartRefs((prev) =>
            prev.map((r) => (isLine(r, productId, variantId) ? { ...r, quantity } : r))
        );
    };

    // Switching to options already in the cart folds the two lines together.
    const updateCartVariant = (productId, fromId, toId) => {
        setCartRefs((prev) => {
            const next = [];
            for (const r of prev) {
                mergeLine(next, isLine(r, productId, fromId) ? { ...r, variant_id: toId } : r);
            }
            return next;
        });
    };

    const clearCart = () => setCartRefs([]);

    return (
        <CartContext.Provider
            value={{ cartRefs, addToCart, removeFromCart, updateCartQuantity, updateCartVariant, clearCart }}
        >
            {children}
        </CartContext.Provider>
    );
}

function isLine(ref, productId, variantId) {
    return ref.product_id === productId && (ref.variant_id ?? null) === (variantId ?? null);
}

// The line's variant if the product still has it; otherwise the one matching
// the color an older cart saved, else the first that can be ordered.
function currentVariantId(product, ref) {
    const variants = product.variants || [];
    if (variants.some((v) => v.id === ref.variant_id)) return ref.variant_id;
    const byColor = ref.color && variants.find((v) => Object.values(v.options || {}).includes(ref.color));
    return (byColor || buyableVariants(product)[0] || variants[0])?.id ?? null;
}

// Adds a line to the list, or adds its quantity to a matching line already there.
function mergeLine(lines, line) {
    const existing = lines.findIndex((r) => isLine(r, line.product_id, line.variant_id));
    if (existing === -1) {
        lines.push(line);
    } else {
        lines[existing] = { ...lines[existing], quantity: lines[existing].quantity + line.quantity };
    }
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used inside CartProvider");
    return context;
}