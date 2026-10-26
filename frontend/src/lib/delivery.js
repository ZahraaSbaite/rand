// Mirrors app/Support/CheckoutOptions.php. The server works out the real fee;
// these only show the customer what it will be.

/** Charged when the admin hasn't listed any delivery areas yet. */
export const FLAT_DELIVERY_CENTS = 500;

/** The delivery areas saved on the Settings page, each { area, fee_cents, eta }. */
export function parseDeliveryZones(raw) {
    try {
        const zones = JSON.parse(raw || "[]");
        if (!Array.isArray(zones)) return [];
        return zones
            .map((z) => ({
                area: String(z?.area ?? "").trim(),
                fee_cents: Number(z?.fee_cents),
                eta: String(z?.eta ?? "").trim(),
            }))
            .filter((z) => z.area && Number.isInteger(z.fee_cents) && z.fee_cents >= 0);
    } catch {
        return [];
    }
}

export const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

export const PAYMENT_LABELS = {
    cash_on_delivery: "Cash on delivery",
    bank_transfer: "Bank transfer",
};
