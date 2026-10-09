import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { EmptyState, SectionHeader, StatusPill, formatDate, formatMoney } from "./AdminUI.jsx";

const ORDER_STATUS = {
    not_started: { label: "Not started", tone: "warn" },
    in_progress: { label: "In progress", tone: "info" },
    done: { label: "Done", tone: "ok" },
};

export default function Overview({ goTo }) {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        api("/api/admin/stats")
            .then(setStats)
            .catch((err) => setError(err.message));
    }, []);

    if (error) return <EmptyState title="Couldn't load the overview">{error}</EmptyState>;
    if (!stats) return <p className="admin-loading">Loading overview…</p>;

    const openOrders = stats.orders.not_started + stats.orders.in_progress;
    const todo = [
        { count: stats.orders.not_started, label: "orders not started", section: "orders" },
        { count: stats.pending.custom_orders, label: "new custom order requests", section: "custom-orders" },
        { count: stats.pending.messages, label: "unread messages", section: "messages" },
        { count: stats.pending.reviews, label: "reviews waiting for approval", section: "reviews" },
        { count: stats.products.sold_out, label: "sold-out products", section: "products" },
    ].filter((t) => t.count > 0);

    return (
        <div className="admin-overview">
            <SectionHeader title="Overview" description="How the shop is doing, and what needs you today." />

            <div className="admin-stats">
                <div className="admin-stat">
                    <span className="admin-stat__label">Sales, last 30 days</span>
                    <strong className="admin-stat__value">{formatMoney(stats.revenue_cents.last_30)}</strong>
                    <span className="admin-stat__sub">{stats.orders.last_30} orders</span>
                </div>
                <div className="admin-stat">
                    <span className="admin-stat__label">Sales, all time</span>
                    <strong className="admin-stat__value">{formatMoney(stats.revenue_cents.all_time)}</strong>
                </div>
                <div className="admin-stat">
                    <span className="admin-stat__label">Open orders</span>
                    <strong className="admin-stat__value">{openOrders}</strong>
                    <span className="admin-stat__sub">{stats.orders.done} done</span>
                </div>
                <div className="admin-stat">
                    <span className="admin-stat__label">Products in shop</span>
                    <strong className="admin-stat__value">{stats.products.visible}</strong>
                    <span className="admin-stat__sub">
                        {stats.products.total - stats.products.visible} hidden
                    </span>
                </div>
            </div>

            <div className="admin-overview__grid">
                <section className="admin-panel">
                    <h2 className="admin-panel__title">To do</h2>
                    {todo.length === 0 ? (
                        <p className="admin-muted">All caught up.</p>
                    ) : (
                        <ul className="admin-todo">
                            {todo.map((t) => (
                                <li key={t.section + t.label}>
                                    <button type="button" onClick={() => goTo(t.section)}>
                                        <strong>{t.count}</strong> {t.label}
                                        <span aria-hidden="true">→</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="admin-panel">
                    <h2 className="admin-panel__title">Low stock</h2>
                    {stats.low_stock.length === 0 ? (
                        <p className="admin-muted">Every product has 3 or more in stock.</p>
                    ) : (
                        <ul className="admin-list">
                            {stats.low_stock.map((p) => (
                                <li key={p.id}>
                                    <span>
                                        {p.name}
                                        <small>{p.category}</small>
                                    </span>
                                    <StatusPill tone={p.stock_quantity <= 0 ? "bad" : "warn"}>
                                        {p.stock_quantity <= 0 ? "Sold out" : `${p.stock_quantity} left`}
                                    </StatusPill>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="admin-panel admin-panel--wide">
                    <div className="admin-panel__head">
                        <h2 className="admin-panel__title">Recent orders</h2>
                        <button type="button" className="admin-link-btn" onClick={() => goTo("orders")}>
                            All orders
                        </button>
                    </div>
                    {stats.recent_orders.length === 0 ? (
                        <p className="admin-muted">No orders yet.</p>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Customer</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th className="admin-table__num">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recent_orders.map((o) => (
                                    <tr key={o.id}>
                                        <td>#{o.id}</td>
                                        <td>{o.customer_name}</td>
                                        <td>{formatDate(o.created_at)}</td>
                                        <td>
                                            <StatusPill tone={ORDER_STATUS[o.status]?.tone}>
                                                {ORDER_STATUS[o.status]?.label || o.status}
                                            </StatusPill>
                                        </td>
                                        <td className="admin-table__num">{formatMoney(o.total_cents)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>

                <section className="admin-panel">
                    <h2 className="admin-panel__title">Best sellers</h2>
                    {stats.top_sellers.length === 0 ? (
                        <p className="admin-muted">Shows up after the first orders.</p>
                    ) : (
                        <ol className="admin-list admin-list--ranked">
                            {stats.top_sellers.map((p) => (
                                <li key={p.id}>
                                    <span>{p.name}</span>
                                    <span className="admin-muted">{p.sold} sold</span>
                                </li>
                            ))}
                        </ol>
                    )}
                </section>
            </div>
        </div>
    );
}
