import { useEffect, useMemo, useState } from "react";
import "./AdminOrders.css";

const API_URL =
    import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const columns = [
    { key: "not_started", label: "Not started" },
    { key: "in_progress", label: "In progress" },
    { key: "done", label: "Done" },
];

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

    if (loading) {
        return <p>Loading orders…</p>;
    }

    if (orders.length === 0) {
        return <p>No orders yet.</p>;
    }

    return (
        <div className="admin-orders-board">
            {columns.map((col) => {
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
                                                        aria-label="Delete order"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>

                                            <p className="admin-orders__meta">
                                                {
                                                    order.customer_phone
                                                }{" "}
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
                                                            Move to{" "}
                                                            {
                                                                c.label
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

