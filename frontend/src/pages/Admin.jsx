import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useSite } from "../context/SiteContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { AdminProvider, SectionHeader } from "../components/admin/AdminUI.jsx";
import Overview from "../components/admin/Overview.jsx";
import Analytics from "../components/admin/Analytics.jsx";
import ProductsManager from "../components/admin/ProductsManager.jsx";
import CategoriesManager from "../components/admin/CategoriesManager.jsx";
import CustomOrdersInbox from "../components/admin/CustomOrdersInbox.jsx";
import MessagesInbox from "../components/admin/MessagesInbox.jsx";
import ReviewsManager from "../components/admin/ReviewsManager.jsx";
import ContentManager from "../components/admin/ContentManager.jsx";
import SettingsManager from "../components/admin/SettingsManager.jsx";
import AdminOrders from "../components/AdminOrders.jsx";
import "./Admin.css";

const NAV = [
    {
        group: "Shop",
        items: [
            { key: "overview", label: "Overview" },
            { key: "analytics", label: "Analytics" },
            { key: "orders", label: "Orders", count: "orders" },
            { key: "products", label: "Products" },
            { key: "categories", label: "Categories" },
        ],
    },
    {
        group: "Inbox",
        items: [
            { key: "custom-orders", label: "Custom orders", count: "custom_orders" },
            { key: "messages", label: "Messages", count: "messages" },
            { key: "reviews", label: "Reviews", count: "reviews" },
        ],
    },
    {
        group: "Pages",
        items: [
            { key: "collections", label: "Collections" },
            { key: "faqs", label: "FAQs" },
            { key: "story-blocks", label: "Our Story" },
            { key: "process-steps", label: "The Process" },
            { key: "lookbook", label: "Lookbook" },
            { key: "settings", label: "Site settings" },
        ],
    },
];

const ALL_KEYS = NAV.flatMap((g) => g.items.map((i) => i.key));

export default function Admin() {
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const section = ALL_KEYS.includes(params.get("section")) ? params.get("section") : "overview";
    const [counts, setCounts] = useState({});
    const [menuOpen, setMenuOpen] = useState(false);
    const { categories, reload } = useSite();
    const { theme, toggleTheme } = useTheme();

    const refreshCounts = useCallback(() => {
        api("/api/admin/stats")
            .then((s) =>
                setCounts({
                    orders: s.orders.not_started,
                    custom_orders: s.pending.custom_orders,
                    messages: s.pending.messages,
                    reviews: s.pending.reviews,
                })
            )
            .catch(() => {});
        // Keep the public menu (categories, settings) in sync with edits.
        reload();
    }, [reload]);

    useEffect(refreshCounts, [refreshCounts]);

    const goTo = (key) => {
        setParams({ section: key });
        setMenuOpen(false);
        window.scrollTo(0, 0);
    };

    const handleLogout = async () => {
        try {
            await api("/api/auth/logout", { method: "POST" });
        } finally {
            navigate("/admin/login");
        }
    };

    const content = (() => {
        switch (section) {
            case "analytics":
                return <Analytics />;
            case "orders":
                return (
                    <>
                        <SectionHeader
                            title="Orders"
                            description="Move orders across the board as you work on them. “Customer sees” is what shows on their tracking page."
                        />
                        <AdminOrders />
                    </>
                );
            case "products":
                return <ProductsManager />;
            case "categories":
                return <CategoriesManager />;
            case "custom-orders":
                return <CustomOrdersInbox />;
            case "messages":
                return <MessagesInbox />;
            case "reviews":
                return <ReviewsManager />;
            case "collections":
                return <ContentManager type="collections" categories={categories} />;
            case "faqs":
                return <ContentManager type="faqs" categories={categories} />;
            case "story-blocks":
                return <ContentManager type="story-blocks" categories={categories} />;
            case "process-steps":
                return <ContentManager type="process-steps" categories={categories} />;
            case "lookbook":
                return <ContentManager type="lookbook" categories={categories} />;
            case "settings":
                return <SettingsManager />;
            default:
                return <Overview goTo={goTo} />;
        }
    })();

    const current = NAV.flatMap((g) => g.items).find((i) => i.key === section);

    return (
        <AdminProvider onCountsChange={refreshCounts}>
            <div className={`admin-shell${menuOpen ? " is-menu-open" : ""}`}>
                <aside className="admin-nav" aria-label="Admin sections">
                    <div className="admin-nav__brand">
                        <Link to="/" className="admin-nav__logo">
                            strand
                        </Link>
                        <span className="admin-nav__tag">Studio</span>
                    </div>

                    <nav className="admin-nav__groups">
                        {NAV.map((group) => (
                            <div key={group.group} className="admin-nav__group">
                                <p className="admin-nav__group-title">{group.group}</p>
                                {group.items.map((item) => (
                                    <button
                                        key={item.key}
                                        type="button"
                                        className={`admin-nav__item${section === item.key ? " is-active" : ""}`}
                                        aria-current={section === item.key ? "page" : undefined}
                                        onClick={() => goTo(item.key)}
                                    >
                                        {item.label}
                                        {item.count && counts[item.count] > 0 && (
                                            <span className="admin-nav__count">{counts[item.count]}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </nav>

                    <div className="admin-nav__foot">
                        <a href="/" target="_blank" rel="noopener noreferrer" className="admin-nav__item">
                            View shop ↗
                        </a>
                        <button type="button" className="admin-nav__item" onClick={toggleTheme}>
                            {theme === "dark" ? "Light mode" : "Dark mode"}
                        </button>
                        <button type="button" className="admin-nav__item" onClick={handleLogout}>
                            Log out
                        </button>
                    </div>
                </aside>

                <div className="admin-main">
                    <div className="admin-topbar">
                        <button
                            type="button"
                            className="admin-topbar__menu"
                            aria-expanded={menuOpen}
                            onClick={() => setMenuOpen((v) => !v)}
                        >
                            Menu
                        </button>
                        <span className="admin-topbar__title">{current?.label}</span>
                    </div>
                    <div className="admin-overlay" onClick={() => setMenuOpen(false)} />
                    <main className="admin-content">{content}</main>
                </div>
            </div>
        </AdminProvider>
    );
}
