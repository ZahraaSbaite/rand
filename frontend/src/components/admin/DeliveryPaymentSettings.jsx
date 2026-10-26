import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { useSite } from "../../context/SiteContext.jsx";
import { FLAT_DELIVERY_CENTS, formatPrice, parseDeliveryZones } from "../../lib/delivery.js";
import { SectionHeader, useAdmin } from "./AdminUI.jsx";

// Fees are typed in dollars and saved in cents, like product prices.
const toRows = (raw) =>
    parseDeliveryZones(raw).map((z) => ({ area: z.area, fee: (z.fee_cents / 100).toFixed(2), eta: z.eta }));

const toSetting = (rows) =>
    JSON.stringify(
        rows
            .filter((r) => r.area.trim())
            .map((r) => ({
                area: r.area.trim(),
                fee_cents: Math.max(0, Math.round(Number(r.fee || 0) * 100)),
                eta: r.eta.trim(),
            }))
    );

export default function DeliveryPaymentSettings() {
    const { notify } = useAdmin();
    const { reload } = useSite();
    const [zones, setZones] = useState(null);
    const [bank, setBank] = useState("");
    const [saved, setSaved] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api("/api/settings")
            .then((data) => {
                const rows = toRows(data?.delivery_zones);
                const details = data?.bank_transfer_details ?? "";
                setZones(rows);
                setBank(details);
                setSaved({ zones: toSetting(rows), bank: details });
            })
            .catch((err) => notify(err.message, "bad"));
    }, [notify]);

    if (!zones) return <p className="admin-loading">Loading settings…</p>;

    const badFee = zones.some((z) => z.area.trim() && !(Number(z.fee) >= 0 && z.fee !== ""));
    const dirty = toSetting(zones) !== saved.zones || bank !== saved.bank;

    const setZone = (i, field, value) => setZones(zones.map((z, j) => (j === i ? { ...z, [field]: value } : z)));

    const submit = async (e) => {
        e.preventDefault();
        if (badFee) {
            notify("Every delivery area needs a fee (0 for free delivery).", "bad");
            return;
        }
        setSaving(true);
        try {
            const data = await api("/api/settings", {
                method: "PUT",
                body: { delivery_zones: toSetting(zones), bank_transfer_details: bank },
            });
            const rows = toRows(data?.delivery_zones);
            setZones(rows);
            setBank(data?.bank_transfer_details ?? "");
            setSaved({ zones: toSetting(rows), bank: data?.bank_transfer_details ?? "" });
            reload();
            notify("Saved. Checkout is updated.");
        } catch (err) {
            notify(err.message, "bad");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit}>
            <SectionHeader title="Delivery & payment" description="What customers choose from at checkout.">
                <button type="submit" className="admin-btn" disabled={!dirty || saving}>
                    {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
                </button>
            </SectionHeader>

            <section className="admin-panel admin-settings-group">
                <h2 className="admin-panel__title">Delivery areas</h2>
                <p className="admin-muted">
                    Customers pick one at checkout, and its fee is added to the order. With no areas listed,
                    every order pays a flat {formatPrice(FLAT_DELIVERY_CENTS)}.
                </p>
                {zones.map((zone, i) => (
                    <div key={i} className="admin-form-grid">
                        <label className="admin-field">
                            <span className="admin-field__label">Area</span>
                            <input
                                value={zone.area}
                                placeholder="e.g. Beirut"
                                onChange={(e) => setZone(i, "area", e.target.value)}
                            />
                        </label>
                        <label className="admin-field">
                            <span className="admin-field__label">Fee ($)</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={zone.fee}
                                onChange={(e) => setZone(i, "fee", e.target.value)}
                            />
                        </label>
                        <label className="admin-field">
                            <span className="admin-field__label">Delivery time</span>
                            <input
                                value={zone.eta}
                                placeholder="e.g. 1–2 days"
                                onChange={(e) => setZone(i, "eta", e.target.value)}
                            />
                        </label>
                        <div className="admin-field">
                            <span className="admin-field__label" aria-hidden="true">&nbsp;</span>
                            <button
                                type="button"
                                className="admin-btn admin-btn--ghost admin-btn--small"
                                onClick={() => setZones(zones.filter((_, j) => j !== i))}
                                aria-label={`Remove ${zone.area || "this area"}`}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
                <button
                    type="button"
                    className="admin-btn admin-btn--ghost admin-btn--small"
                    onClick={() => setZones([...zones, { area: "", fee: "", eta: "" }])}
                >
                    Add an area
                </button>
            </section>

            <section className="admin-panel admin-settings-group">
                <h2 className="admin-panel__title">Payment methods</h2>
                <p className="admin-muted">
                    Cash on delivery is always offered. Add your bank account details to also offer bank
                    transfer; customers see them after ordering and in their confirmation email. Tick
                    “Payment received” on the order when the money arrives, and the customer gets an email.
                </p>
                <label className="admin-field admin-field--wide">
                    <span className="admin-field__label">Bank transfer details</span>
                    <textarea
                        rows={4}
                        value={bank}
                        placeholder={"Leave empty to turn bank transfer off.\nBank, account name, account number / IBAN"}
                        onChange={(e) => setBank(e.target.value)}
                    />
                </label>
            </section>
        </form>
    );
}
