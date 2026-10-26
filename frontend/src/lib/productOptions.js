// Mirrors the server's rules (ProductController, OrderController) for what a
// customer can order: the product must be published, and the chosen variant
// available and, unless the piece is made to order, in stock.

/** Shop-facing wording for every status except published. */
export const STATUS_LABELS = {
    draft: "Draft",
    sold_out: "Sold out",
    unavailable: "Back soon",
    discontinued: "No longer made",
};

export const isMadeToOrder = (product) => product?.fulfillment === "made_to_order";

export function variantInStock(product, variant) {
    return Boolean(variant?.is_available) && (isMadeToOrder(product) || variant.stock_quantity > 0);
}

/** The variants that can go in the cart right now, in the admin's order. */
export function buyableVariants(product) {
    if (product?.status !== "published") return [];
    return (product.variants || []).filter((v) => variantInStock(product, v));
}

/** Whether anything of this product can be bought, and a short label when not. */
export function availability(product) {
    if (product?.status && product.status !== "published") {
        return { buyable: false, label: STATUS_LABELS[product.status] || "Unavailable" };
    }
    return buyableVariants(product).length > 0
        ? { buyable: true, label: null }
        : { buyable: false, label: "Sold out" };
}

export const hasOptions = (product) => (product?.option_groups || []).length > 0;

/** "Oat / Small", in the product's option order; empty for a product without options. */
export function variantLabel(product, variant) {
    if (!variant) return "";
    return (product?.option_groups || [])
        .map((group) => variant.options?.[group.name])
        .filter(Boolean)
        .join(" / ");
}

/** The variant matching every chosen option, if there is one. */
export function findVariant(product, chosen) {
    return (product?.variants || []).find((v) =>
        (product.option_groups || []).every((g) => v.options?.[g.name] === chosen[g.name])
    );
}

/** How many colors the customer picks for this piece; 0 when it isn't made in any color. */
export const colorsToPick = (product) => Number(product?.custom_colors) || 0;

/** Whether a cart line still needs its colors picked before checkout. */
export const missingColors = (product, colors) => colorsToPick(product) > 0 && !(colors || []).length;

/** How many of a variant one cart line may hold. */
export function maxQuantity(product, variant) {
    return isMadeToOrder(product) ? 10 : Math.max(0, variant?.stock_quantity ?? 0);
}
