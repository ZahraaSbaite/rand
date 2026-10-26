import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { buyableVariants, colorsToPick } from "../lib/productOptions.js";

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
                        // Colors only stay on pieces the customer picks colors for.
                        const colors = colorsToPick(product) > 0 ? ref.colors || [] : [];
                        if (variantId !== ref.variant_id || "color" in ref || colors.length !== (ref.colors || []).length) {
                            changed = true;
                        }
                        mergeLine(next, { product_id: ref.product_id, variant_id: variantId, colors, note: ref.note || "", quantity: ref.quantity });
                    }
                    return changed ? next : prev;
                });
            })
            .catch(() => {
                // Offline or API down: keep the cart as it is.
            });
    }, []);

    // A cart line is one product in one variant (its chosen options), plus the
    // colors the customer picked for a piece made in any color.
    const addToCart = (productId, quantity = 1, variantId = null, colors = [], note = "") => {
        setCartRefs((prev) => {
            const next = [...prev];
            mergeLine(next, { product_id: productId, variant_id: variantId, colors, note: note.trim(), quantity });
            return next;
        });
    };

    const removeFromCart = (key) => {
        setCartRefs((prev) => prev.filter((r) => lineKey(r) !== key));
    };

    const updateCartQuantity = (key, quantity) => {
        setCartRefs((prev) => prev.map((r) => (lineKey(r) === key ? { ...r, quantity } : r)));
    };

    // Switching to options already in the cart folds the two lines together.
    const updateCartVariant = (key, variantId) => {
        setCartRefs((prev) => {
            const next = [];
            for (const r of prev) {
                mergeLine(next, lineKey(r) === key ? { ...r, variant_id: variantId } : r);
            }
            return next;
        });
    };

    // Editing the message can make two lines the same, so they fold together.
    const updateCartNote = (key, note) => {
        setCartRefs((prev) => {
            const next = [];
            for (const r of prev) {
                mergeLine(next, lineKey(r) === key ? { ...r, note: note.trim() } : r);
            }
            return next;
        });
    };

    const clearCart = () => setCartRefs([]);

    return (
        <CartContext.Provider
            value={{ cartRefs, addToCart, removeFromCart, updateCartQuantity, updateCartVariant, updateCartNote, clearCart }}
        >
            {children}
        </CartContext.Provider>
    );
}

/** Identifies a cart line: same product, options, colors and message. */
export function lineKey(ref) {
    return `${ref.product_id}:${ref.variant_id ?? ""}:${(ref.colors || []).join("|")}:${ref.note || ""}`;
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
    const existing = lines.findIndex((r) => lineKey(r) === lineKey(line));
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