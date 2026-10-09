import { useEffect, useMemo, useState } from "react";
import "./AdminOrders.css";

const API_URL =
    import.meta.env.VITE_API_URL || "";

const columns = [
    { key: "not_started", label: "Not started" },
    { key: "in_progress", label: "In progress" },
    { key: "done", label: "Done" },
];

const TRACKING_STAGES = [
    { key: "received", label: "Received" },
    { key: "preparing", label: "Preparing" },
    { key: "crocheting", label: "Crocheting" },
    { key: "quality_check", label: "Quality check" },
    { key: "ready", label: "Ready" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
];

const topColumns = columns.filter((c) => c.key !== "done");
const doneColumn = columns.find((c) => c.key === "done");

const emptyFilters = {
    search: "",
    dateFrom: "",
    dateTo: "",
};

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        not_started: { ...emptyFilters },
        in_progress: { ...emptyFilters },
        done: { ...emptyFilters },
    });

    const loadOrders = () => {
        setLoading(true);

        fetch(`${API_URL}/api/orders`, {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => {
                setOrders(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const grouped = useMemo(() => {
        const byStatus = {
            not_started: [],
            in_progress: [],
            done: [],
        };

        for (const order of orders) {
            (byStatus[order.status] ?? byStatus.not_started).push(order);
        }

        for (const key of Object.keys(byStatus)) {
            const { search, dateFrom, dateTo } = filters[key];

            let list = byStatus[key];

            if (search.trim()) {
                const q = search.trim().toLowerCase();

                list = list.filter(
                    (o) =>
                        o.customer_name
                            .toLowerCase()
                            .includes(q) ||
                        o.customer_phone
                            .toLowerCase()
                            .includes(q) ||
                        o.items.some((item) =>
                            item.product_name
                                .toLowerCase()
                                .includes(q)
                        )
                );
            }

            if (dateFrom || dateTo) {
                const from = dateFrom
                    ? new Date(dateFrom).getTime()
                    : -Infinity;

                const to = dateTo
                    ? new Date(dateTo).setHours(
                        23,
                        59,
                        59,
                        999
                    )
                    : Infinity;

                list = list.filter((o) => {
                    const created = new Date(
                        o.created_at
                    ).getTime();

                    return created >= from && created <= to;
                });
            }

            // Oldest first, so the longest-waiting order surfaces at the top.
            byStatus[key] = [...list].sort(
                (a, b) =>
                    new Date(a.created_at) -
                    new Date(b.created_at)
            );
        }

        return byStatus;
    }, [orders, filters]);

    const handleStatusChange = async (orderId, status) => {
        setOrders((prev) =>
            prev.map((o) =>
                o.id === orderId
                    ? { ...o, status }
                    : o
            )
        );

        try {
            const res = await fetch(
                `${API_URL}/api/orders/${orderId}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({ status }),
                }
            );

            if (!res.ok) {
                throw new Error("Update failed");
            }
        } catch (err) {
            console.error(err);
            alert(
                "Couldn't update the order status. Reloading."
            );
            loadOrders();
        }
    };

    const handleTrackingChange = async (orderId, tracking_stage) => {
        const previous = orders;
        setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, tracking_stage } : o))
        );

        try {
            const res = await fetch(`${API_URL}/api/orders/${orderId}/tracking`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ tracking_stage }),
            });
            if (!res.ok) throw new Error("Update failed");
        } catch (err) {
            console.error(err);
            alert("Couldn't update what the customer sees. Try again.");
            setOrders(previous);
        }
    };

    const handleDelete = async (orderId) => {
        if (!confirm("Delete this order? This can't be undone.")) {
            return;
        }

        const previousOrders = orders;
        setOrders((prev) => prev.filter((o) => o.id !== orderId));

        try {
            const res = await fetch(
                `${API_URL}/api/orders/${orderId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!res.ok) {
                throw new Error("Delete failed");
            }
        } catch (err) {
            console.error(err);
            alert("Couldn't delete that order. Reloading.");
            setOrders(previousOrders);
        }
    };

    const daysWaiting = (createdAt) => {
        const diff =
            Date.now() - new Date(createdAt).getTime();

        return Math.floor(
            diff / (1000 * 60 * 60 * 24)
        );
    };

    const updateFilter = (key, field, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value,
            },
        }));
    };

    const clearFilter = (key) => {
        setFilters((prev) => ({
            ...prev,
            [key]: { ...emptyFilters },
        }));
    };

    const renderColumn = (col) => {
        const f = filters[col.key];

        const hasActiveFilter =
            f.search ||
            f.dateFrom ||
            f.dateTo;

        return (
            <div
                className="admin-orders-column"
                key={col.key}
            >
                <div
                    className={`admin-orders-column__header admin-orders-column__header--${col.key}`}
                >
                    <span>{col.label}</span>

                    <span className="admin-orders-column__count">
                        {grouped[col.key].length}
                    </span>
                </div>

                <div className="admin-orders-column__filters">
                    <input
                        type="search"
                        placeholder="Search name, phone, item"
                        value={f.search}
                        onChange={(e) =>
                            updateFilter(
                                col.key,
                                "search",
                                e.target.value
                            )
                        }
                    />

                    <div className="admin-orders-column__date-row">
                        <input
                            type="date"
                            value={f.dateFrom}
                            onChange={(e) =>
                                updateFilter(
                                    col.key,
                                    "dateFrom",
                                    e.target.value
                                )
                            }
                            aria-label="From date"
                        />

                        <span>–</span>

                        <input
                            type="date"
                            value={f.dateTo}
                            onChange={(e) =>
                                updateFilter(
                                    col.key,
                                    "dateTo",
                                    e.target.value
                                )
                            }
                            aria-label="To date"
                        />
                    </div>

                    {hasActiveFilter && (
                        <button
                            className="admin-orders-column__clear"
                            onClick={() =>
                                clearFilter(col.key)
                            }
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                <div className="admin-orders-column__list">
                    {grouped[col.key].length === 0 ? (
                        <p className="admin-orders-column__empty">
                            {hasActiveFilter
                                ? "No matches"
                                : "Nothing here"}
                        </p>
                    ) : (
                        grouped[col.key].map((order) => {
                            const waiting =
                                daysWaiting(
                                    order.created_at
                                );

                            return (
                                <div
                                    className="admin-orders__card"
                                    key={order.id}
                                >
                                    <div className="admin-orders__card-top">
                                        <p className="admin-orders__customer">
                                            {
                                                order.customer_name
                                            }
                                        </p>

                                        <div className="admin-orders__card-top-actions">
                                            {col.key !== "done" &&
                                                waiting >= 2 && (
                                                    <span className="admin-orders__overdue">
                                                        {waiting}d
                                                    </span>
                                                )}

                                            <button
                                                type="button"
                                                className="admin-orders__delete"
                                                onClick={() =>
                                                    handleDelete(order.id)
                                                }
                                                aria-label={`Delete order #${order.id}`}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    <p className="admin-orders__meta">
                                        #{order.id} ·{" "}
                                        <a href={`mailto:${order.customer_email}`}>
                                            {order.customer_email}
                                        </a>
                                    </p>

                                    <p className="admin-orders__meta">
                                        <a href={`tel:${order.customer_phone}`}>
                                            {order.customer_phone}
                                        </a>{" "}
                                        ·{" "}
                                        {new Date(
                                            order.created_at
                                        ).toLocaleDateString()}
                                    </p>

                                    <p className="admin-orders__address">
                                        {
                                            order.customer_address
                                        }
                                    </p>

                                    <ul className="admin-orders__items">
                                        {order.items.map(
                                            (item, i) => (
                                                <li key={i}>
                                                    {
                                                        item.quantity
                                                    }{" "}
                                                    ×{" "}
                                                    {
                                                        item.product_name
                                                    }
                                                </li>
                                            )
                                        )}
                                    </ul>

                                    <p className="admin-orders__total">
                                        $
                                        {(
                                            order.total_cents /
                                            100
                                        ).toFixed(2)}
                                    </p>

                                    <label className="admin-orders__tracking">
                                        Customer sees
                                        <select
                                            value={order.tracking_stage || "received"}
                                            onChange={(e) =>
                                                handleTrackingChange(order.id, e.target.value)
                                            }
                                        >
                                            {TRACKING_STAGES.map((s) => (
                                                <option key={s.key} value={s.key}>
                                                    {s.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="admin-orders__tracking">
                                        Board column
                                    <select
                                        className="admin-orders__move"
                                        value={
                                            order.status
                                        }
                                        onChange={(e) =>
                                            handleStatusChange(
                                                order.id,
                                                e.target.value
                                            )
                                        }
                                    >
                                        {columns.map(
                                            (c) => (
                                                <option
                                                    key={
                                                        c.key
                                                    }
                                                    value={
                                                        c.key
                                                    }
                                                >
                                                    {
                                                        c.label
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                    </label>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return <p>Loading orders…</p>;
    }

    if (orders.length === 0) {
        return <p className="admin-muted">No orders yet. They appear here as soon as someone checks out.</p>;
    }

    return (
        <div className="admin-orders-board">
            <div className="admin-orders-board__row">
                {topColumns.map(renderColumn)}
            </div>

            <div className="admin-orders-board__row admin-orders-board__row--done">
                {renderColumn(doneColumn)}
            </div>
        </div>
    );
}