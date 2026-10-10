import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { api } from "../../lib/api.js";
import { EmptyState, SectionHeader, formatMoney } from "./AdminUI.jsx";

const RANGES = [
    { value: "7", label: "7 days", previous: "previous 7 days" },
    { value: "30", label: "30 days", previous: "previous 30 days" },
    { value: "90", label: "90 days", previous: "previous 90 days" },
    { value: "365", label: "12 months", previous: "previous 12 months" },
    { value: "all", label: "All time" },
];

const STAGE_LABELS = {
    received: "Received",
    preparing: "Preparing",
    crocheting: "Crocheting",
    quality_check: "Quality check",
    ready: "Ready",
    shipped: "Shipped",
    delivered: "Delivered",
};

const UNIT_NAMES = { day: "Daily", week: "Weekly", month: "Monthly" };

export default function Analytics() {
    const [range, setRange] = useState("30");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        api(`/api/admin/analytics?days=${range}`)
            .then((d) => {
                if (cancelled) return;
                setData(d);
                setError(null);
            })
            .catch((err) => !cancelled && setError(err.message))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [range]);

    const rangeInfo = RANGES.find((r) => r.value === range);

    return (
        <div className="admin-analytics">
            <SectionHeader title="Analytics" description="Sales, best sellers and fulfilment over the period you pick." />

            {/* One filter row; everything below follows it. */}
            <div className="admin-tabs" role="group" aria-label="Date range">
                {RANGES.map((r) => (
                    <button
                        key={r.value}
                        type="button"
                        className={`admin-tabs__tab${range === r.value ? " is-active" : ""}`}
                        aria-pressed={range === r.value}
                        onClick={() => setRange(r.value)}
                    >
                        {r.label}
                    </button>
                ))}
            </div>

            {error && !data && <EmptyState title="Couldn't load analytics">{error}</EmptyState>}
            {!data && !error && <p className="admin-loading">Loading analytics…</p>}

            {data && (
                // While a new range loads, keep the old numbers on screen, dimmed.
                <div className={`admin-analytics__body${loading ? " is-refreshing" : ""}`} aria-busy={loading}>
                    <Kpis data={data} previousLabel={rangeInfo?.previous} />

                    <section className="admin-panel admin-analytics__wide">
                        <ChartHead
                            title={`${UNIT_NAMES[data.range.unit]} revenue`}
                            note={`${formatRangeDate(data.range.from)} – ${formatRangeDate(data.range.to)}`}
                        />
                        {data.totals.orders === 0 ? (
                            <p className="admin-muted">No orders in this period.</p>
                        ) : (
                            <RevenueChart series={data.series} unit={data.range.unit} from={data.range.from} />
                        )}
                    </section>

                    <div className="admin-analytics__grid">
                        <section className="admin-panel">
                            <ChartHead title="Sales by category" note="Revenue" />
                            {data.by_category.length === 0 ? (
                                <p className="admin-muted">No sales in this period.</p>
                            ) : (
                                <BarList
                                    label="Revenue by category"
                                    rows={data.by_category.map((c) => ({
                                        key: c.category,
                                        label: c.category,
                                        value: c.revenue_cents,
                                        display: formatMoney(c.revenue_cents),
                                        detail: `${c.units} sold`,
                                    }))}
                                />
                            )}
                        </section>

                        <section className="admin-panel">
                            <ChartHead title="Where this period's orders are" note="Orders" />
                            {data.totals.orders === 0 ? (
                                <p className="admin-muted">No orders in this period.</p>
                            ) : (
                                <BarList
                                    label="Orders by fulfilment stage"
                                    rows={data.stages.map((s) => ({
                                        key: s.stage,
                                        label: STAGE_LABELS[s.stage] || s.stage,
                                        value: s.orders,
                                        display: s.orders.toLocaleString(),
                                    }))}
                                />
                            )}
                        </section>

                        <section className="admin-panel">
                            <ChartHead title="Best sellers" note="By pieces sold" />
                            {data.top_products.length === 0 ? (
                                <p className="admin-muted">No sales in this period.</p>
                            ) : (
                                <table className="admin-table admin-analytics__table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th className="admin-table__num">Sold</th>
                                            <th className="admin-table__num">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.top_products.map((p) => (
                                            <tr key={p.id}>
                                                <td>{p.name}</td>
                                                <td className="admin-table__num">{p.units}</td>
                                                <td className="admin-table__num">{formatMoney(p.revenue_cents)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </section>

                        <section className="admin-panel">
                            <ChartHead title="Inbox" note="New in this period" />
                            <dl className="admin-analytics__inbox">
                                <div>
                                    <dt>Custom order requests</dt>
                                    <dd>{data.inbox.custom_orders}</dd>
                                </div>
                                <div>
                                    <dt>Messages</dt>
                                    <dd>{data.inbox.messages}</dd>
                                </div>
                                <div>
                                    <dt>Reviews</dt>
                                    <dd>{data.inbox.reviews}</dd>
                                </div>
                                <div>
                                    <dt>Average rating</dt>
                                    <dd>
                                        {data.inbox.average_rating == null
                                            ? "—"
                                            : `${data.inbox.average_rating.toFixed(1)} / 5`}
                                    </dd>
                                </div>
                            </dl>
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
}

function ChartHead({ title, note }) {
    return (
        <div className="admin-panel__head">
            <h2 className="admin-panel__title">{title}</h2>
            {note && <span className="admin-muted admin-analytics__note">{note}</span>}
        </div>
    );
}

/* ---------- Headline numbers ---------- */

function Kpis({ data, previousLabel }) {
    const { totals, previous } = data;
    const tiles = [
        { label: "Revenue", value: formatMoney(totals.revenue_cents), now: totals.revenue_cents, before: previous?.revenue_cents },
        { label: "Orders", value: totals.orders.toLocaleString(), now: totals.orders, before: previous?.orders },
        {
            label: "Average order",
            value: formatMoney(totals.average_order_cents),
            now: totals.average_order_cents,
            before: previous?.average_order_cents,
        },
        { label: "Pieces sold", value: totals.items_sold.toLocaleString(), now: totals.items_sold, before: previous?.items_sold },
    ];

    return (
        <div className="admin-stats">
            {tiles.map((t) => (
                <div key={t.label} className="admin-stat">
                    <span className="admin-stat__label">{t.label}</span>
                    <strong className="admin-stat__value admin-analytics__figure">{t.value}</strong>
                    {previous && <Delta now={t.now} before={t.before} label={previousLabel} />}
                </div>
            ))}
        </div>
    );
}

/** Change vs the previous period, as an arrow plus words, so it never relies on colour. */
function Delta({ now, before, label }) {
    if (!before) {
        return <span className="admin-stat__sub">{now ? `None in the ${label}` : `None in the ${label} either`}</span>;
    }
    const change = Math.round(((now - before) / before) * 100);
    const arrow = change > 0 ? "▲" : change < 0 ? "▼" : "■";
    const words = change === 0 ? "Same as" : `${Math.abs(change)}% ${change > 0 ? "up on" : "down on"}`;
    return (
        <span className="admin-stat__sub">
            <span aria-hidden="true">{arrow} </span>
            {words} {label}
        </span>
    );
}

/* ---------- Revenue column chart ---------- */

const CHART = { height: 220, top: 16, bottom: 28, left: 52, right: 8, maxBar: 24, radius: 4 };

function RevenueChart({ series, unit, from }) {
    const [wrapRef, width] = useWidth();
    const [active, setActive] = useState(null);
    const [showTable, setShowTable] = useState(false);

    const rows = series.map((s) => {
        // The first week/month bucket can start before the range; label it from the range start.
        const start = s.start < from ? from : s.start;
        return { ...s, label: bucketLabel(start, unit), tick: tickLabel(start, unit) };
    });

    const plotW = Math.max(0, width - CHART.left - CHART.right);
    const plotH = CHART.height - CHART.top - CHART.bottom;
    const { max, ticks } = niceScale(Math.max(...rows.map((r) => r.revenue_cents)));
    const band = rows.length ? plotW / rows.length : 0;
    const barW = Math.max(2, Math.min(CHART.maxBar, band - 2));
    const labelEvery = Math.max(1, Math.ceil(rows.length / Math.max(1, Math.floor(plotW / 64))));
    const y = (v) => CHART.top + plotH - (max ? (v / max) * plotH : 0);

    const activeRow = active == null ? null : rows[active];
    const tipX = active == null ? 0 : CHART.left + band * active + band / 2;

    return (
        <div className="admin-chart">
            <div ref={wrapRef} className="admin-chart__plot" onPointerLeave={() => setActive(null)}>
                {width > 0 && (
                    <svg width={width} height={CHART.height} role="img" aria-label="Revenue over time. Use the table view for exact values.">
                        {ticks.map((t) => (
                            <g key={t}>
                                <line
                                    className="admin-chart__grid"
                                    x1={CHART.left}
                                    x2={width - CHART.right}
                                    y1={y(t)}
                                    y2={y(t)}
                                />
                                <text className="admin-chart__tick" x={CHART.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
                                    {compactMoney(t)}
                                </text>
                            </g>
                        ))}

                        {rows.map((r, i) => {
                            const x = CHART.left + band * i + (band - barW) / 2;
                            const top = y(r.revenue_cents);
                            const h = CHART.top + plotH - top;
                            return (
                                <g key={r.start}>
                                    {h > 0 && (
                                        <path
                                            className={`admin-chart__bar${active === i ? " is-active" : ""}`}
                                            d={roundedTopBar(x, top, barW, h, CHART.radius)}
                                        />
                                    )}
                                    {/* The hit area is the whole column, not just the painted bar. */}
                                    <rect
                                        className="admin-chart__hit"
                                        x={CHART.left + band * i}
                                        y={CHART.top}
                                        width={band}
                                        height={plotH}
                                        tabIndex={0}
                                        aria-label={`${r.label}: ${formatMoney(r.revenue_cents)}, ${r.orders} orders`}
                                        onPointerEnter={() => setActive(i)}
                                        onFocus={() => setActive(i)}
                                        onBlur={() => setActive(null)}
                                    />
                                    {i % labelEvery === 0 && (
                                        <text
                                            className="admin-chart__tick"
                                            x={CHART.left + band * i + band / 2}
                                            y={CHART.height - 8}
                                            textAnchor="middle"
                                        >
                                            {r.tick}
                                        </text>
                                    )}
                                </g>
                            );
                        })}

                        <line
                            className="admin-chart__axis"
                            x1={CHART.left}
                            x2={width - CHART.right}
                            y1={CHART.top + plotH}
                            y2={CHART.top + plotH}
                        />
                    </svg>
                )}

                {activeRow && (
                    <div
                        className="admin-chart__tooltip"
                        style={{
                            left: Math.min(Math.max(tipX, 80), width - 80),
                            top: Math.max(0, y(activeRow.revenue_cents) - 8),
                        }}
                    >
                        <strong>{formatMoney(activeRow.revenue_cents)}</strong>
                        <span>
                            {activeRow.orders} {activeRow.orders === 1 ? "order" : "orders"}
                        </span>
                        <span className="admin-chart__tooltip-label">{activeRow.label}</span>
                    </div>
                )}
            </div>

            <button type="button" className="admin-link-btn admin-chart__toggle" onClick={() => setShowTable((v) => !v)}>
                {showTable ? "Hide table" : "Show as table"}
            </button>
            {showTable && (
                <div className="admin-table-wrap admin-chart__table">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>{unit === "day" ? "Day" : unit === "week" ? "Week" : "Month"}</th>
                                <th className="admin-table__num">Orders</th>
                                <th className="admin-table__num">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.start}>
                                    <td>{r.label}</td>
                                    <td className="admin-table__num">{r.orders}</td>
                                    <td className="admin-table__num">{formatMoney(r.revenue_cents)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

/* ---------- Horizontal bars (values printed, so no table view needed) ---------- */

function BarList({ rows, label }) {
    const max = Math.max(...rows.map((r) => r.value), 0);
    return (
        <ul className="admin-barlist" aria-label={label}>
            {rows.map((r) => (
                <li key={r.key} className="admin-barlist__row">
                    <span className="admin-barlist__label">
                        {r.label}
                        {r.detail && <small>{r.detail}</small>}
                    </span>
                    <span className="admin-barlist__track">
                        {r.value > 0 && (
                            <span className="admin-barlist__bar" style={{ width: `${(r.value / max) * 100}%` }} />
                        )}
                    </span>
                    <span className="admin-barlist__value">{r.display}</span>
                </li>
            ))}
        </ul>
    );
}

/* ---------- Helpers ---------- */

function useWidth() {
    const ref = useRef(null);
    const [width, setWidth] = useState(0);
    useLayoutEffect(() => {
        const node = ref.current;
        if (!node) return undefined;
        const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
        observer.observe(node);
        setWidth(Math.floor(node.getBoundingClientRect().width));
        return () => observer.disconnect();
    }, []);
    return [ref, width];
}

/** A clean axis: 0 plus 3–5 round steps (1, 2, 2.5 or 5 × a power of ten). */
function niceScale(maxValue) {
    if (!maxValue) return { max: 100, ticks: [0] };
    const rough = maxValue / 4;
    const power = 10 ** Math.floor(Math.log10(rough));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= rough);
    const max = Math.ceil(maxValue / step) * step;
    const ticks = [];
    for (let t = 0; t <= max + step / 2; t += step) ticks.push(t);
    return { max, ticks };
}

function roundedTopBar(x, y, w, h, r) {
    const rr = Math.min(r, h, w / 2);
    return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

function compactMoney(cents) {
    const dollars = cents / 100;
    if (dollars >= 1000) return `$${(dollars / 1000).toFixed(dollars >= 10000 ? 0 : 1).replace(/\.0$/, "")}K`;
    return `$${Math.round(dollars)}`;
}

// Bucket dates are plain YYYY-MM-DD in UTC; format them without a timezone shift.
function parseDay(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
}

function formatRangeDate(iso) {
    return parseDay(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function bucketLabel(iso, unit) {
    const date = parseDay(iso);
    if (unit === "month") return date.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
    const day = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
    return unit === "week" ? `Week of ${day}` : day;
}

function tickLabel(iso, unit) {
    const date = parseDay(iso);
    if (unit === "month") {
        return date.toLocaleDateString(undefined, {
            month: "short",
            ...(date.getUTCMonth() === 0 ? { year: "2-digit" } : {}),
            timeZone: "UTC",
        });
    }
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}
