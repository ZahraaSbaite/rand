import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useCustomerAuth } from "../context/CustomerAuthContext.jsx";
import "./Navbar.css";

const SHOP_CATEGORIES = [
    { slug: "bags", label: "Bags" },
    { slug: "flowers", label: "Flowers" },
    { slug: "plushies", label: "Plushies" },
];

const MENU_LINKS = [
    { to: "/collections", label: "Collections" },
    { to: "/custom-orders", label: "Custom Orders" },
    { to: "/journal", label: "Journal" },
    { to: "/our-story", label: "Our Story" },
    { to: "/the-process", label: "The Process" },
    { to: "/reviews", label: "Reviews" },
    { to: "/faq", label: "FAQ" },
    { to: "/contact", label: "Contact" },
];

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [shopExpanded, setShopExpanded] = useState(false);
    const { cartRefs } = useCart();
    const { wishlistIds } = useWishlist();
    const { theme, toggleTheme } = useTheme();
    const { customer, logout } = useCustomerAuth();
    const cartCount = cartRefs.reduce((sum, r) => sum + r.quantity, 0);
    const wishlistCount = wishlistIds.length;

    const searchParams = new URLSearchParams(location.search);
    const query = location.pathname === "/shop" ? searchParams.get("search") || "" : "";

    const handleChange = (e) => {
        const value = e.target.value;
        const params = new URLSearchParams();
        if (value) params.set("search", value);
        const search = params.toString();
        navigate(`/shop${search ? `?${search}` : ""}`, {
            replace: location.pathname === "/shop",
        });
    };

    const closeDrawer = () => setDrawerOpen(false);

    useEffect(() => {
        closeDrawer();
    }, [location.pathname]);

    useEffect(() => {
        document.body.style.overflow = drawerOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [drawerOpen]);

    useEffect(() => {
        if (!drawerOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") closeDrawer();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [drawerOpen]);

    return (
        <>
        <header className="navbar">
            <div className="navbar__top">
                <button
                    type="button"
                    className="navbar__hamburger"
                    aria-label="Open menu"
                    aria-expanded={drawerOpen}
                    onClick={() => setDrawerOpen(true)}
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 6h18M3 12h18M3 18h18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>

                <button
                    type="button"
                    className="navbar__icon-link navbar__theme-toggle"
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    onClick={toggleTheme}
                >
                    {theme === "dark" ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="2" />
                            <path
                                d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                d="M20.5 14.5A8.5 8.5 0 019.5 3.5a8.5 8.5 0 1011 11z"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinejoin="round"
                            />
                        </svg>
                    )}
                </button>

                <NavLink to="/" className="navbar__logo">
                    <span className="navbar__logo-mark">RRAND</span>
                    <span className="navbar__logo-sub">archive</span>
                </NavLink>

                <form className="navbar__search" onSubmit={(e) => e.preventDefault()}>
                    <svg viewBox="0 0 24 24" className="navbar__search-icon" aria-hidden="true">
                        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <input
                        type="search"
                        placeholder="Search pieces"
                        aria-label="Search products"
                        value={query}
                        onChange={handleChange}
                    />
                </form>

                <nav className="navbar__icons">
                    <NavLink to="/wishlist" className="navbar__icon-link" aria-label="Wishlist">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                d="M12 21s-7.5-4.6-10-9.2C.5 8.5 2 5 5.5 5c2 0 3.5 1.2 4.5 2.7C11 6.2 12.5 5 14.5 5 18 5 19.5 8.5 18 11.8 15.5 16.4 12 21 12 21z"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinejoin="round"
                            />
                        </svg>
                        {wishlistCount > 0 && <span className="navbar__badge">{wishlistCount}</span>}
                    </NavLink>

                    {customer ? (
                        <button
                            type="button"
                            className="navbar__icon-link"
                            aria-label={`Log out (${customer.name})`}
                            onClick={async () => {
                                await logout();
                                navigate("/");
                            }}
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
                                <path
                                    d="M4.5 20c1.4-4 5-6.5 7.5-6.5s6.1 2.5 7.5 6.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>
                    ) : (
                        <NavLink to="/login" className="navbar__icon-link" aria-label="Log in">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
                                <path
                                    d="M4.5 20c1.4-4 5-6.5 7.5-6.5s6.1 2.5 7.5 6.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </NavLink>
                    )}

                    <NavLink to="/cart" className="navbar__icon-link" aria-label="Cart">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                d="M6 6h15l-1.5 9h-12z M6 6L5 3H2 M9 20a1 1 0 100-2 1 1 0 000 2z M18 20a1 1 0 100-2 1 1 0 000 2z"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        {cartCount > 0 && <span className="navbar__badge">{cartCount}</span>}
                    </NavLink>
                </nav>
            </div>

            <nav className="navbar__menu" aria-label="Primary">
                <NavLink to="/" end className="navbar__menu-link">
                    Home
                </NavLink>

                <div className="navbar__dropdown">
                    <NavLink to="/shop" className="navbar__menu-link navbar__dropdown-trigger">
                        Shop
                        <svg viewBox="0 0 24 24" className="navbar__dropdown-caret" aria-hidden="true">
                            <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </NavLink>
                    <div className="navbar__dropdown-menu">
                        {SHOP_CATEGORIES.map((cat) => (
                            <NavLink key={cat.slug} to={`/shop/${cat.slug}`} className="navbar__dropdown-item">
                                {cat.label}
                            </NavLink>
                        ))}
                    </div>
                </div>

                {MENU_LINKS.map((link) => (
                    <NavLink key={link.to} to={link.to} className="navbar__menu-link">
                        {link.label}
                    </NavLink>
                ))}
            </nav>
        </header>

        <div className={`navbar__drawer-overlay${drawerOpen ? " is-open" : ""}`} onClick={closeDrawer} />

        <aside className={`navbar__drawer${drawerOpen ? " is-open" : ""}`} aria-hidden={!drawerOpen}>
                <div className="navbar__drawer-header">
                    <span className="navbar__drawer-title">Menu</span>
                    <button
                        type="button"
                        className="navbar__drawer-close"
                        aria-label="Close menu"
                        onClick={closeDrawer}
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <nav className="navbar__drawer-nav" aria-label="Mobile">
                    <NavLink to="/" end className="navbar__drawer-link">
                        Home
                    </NavLink>

                    <div className="navbar__drawer-group">
                        <div className="navbar__drawer-group-row">
                            <NavLink to="/shop" className="navbar__drawer-link navbar__drawer-link--grow">
                                Shop
                            </NavLink>
                            <button
                                type="button"
                                className={`navbar__drawer-caret${shopExpanded ? " is-open" : ""}`}
                                aria-label={shopExpanded ? "Collapse shop categories" : "Expand shop categories"}
                                aria-expanded={shopExpanded}
                                onClick={() => setShopExpanded((v) => !v)}
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                        {shopExpanded && (
                            <div className="navbar__drawer-submenu">
                                {SHOP_CATEGORIES.map((cat) => (
                                    <NavLink key={cat.slug} to={`/shop/${cat.slug}`} className="navbar__drawer-sublink">
                                        {cat.label}
                                    </NavLink>
                                ))}
                            </div>
                        )}
                    </div>

                    {MENU_LINKS.map((link) => (
                        <NavLink key={link.to} to={link.to} className="navbar__drawer-link">
                            {link.label}
                        </NavLink>
                    ))}

                    <NavLink to="/wishlist" className="navbar__drawer-link">
                        Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                    </NavLink>

                    {customer ? (
                        <button
                            type="button"
                            className="navbar__drawer-link"
                            onClick={async () => {
                                await logout();
                                navigate("/");
                            }}
                        >
                            Log out ({customer.name})
                        </button>
                    ) : (
                        <NavLink to="/login" className="navbar__drawer-link">
                            Log in
                        </NavLink>
                    )}

                    <NavLink to="/cart" className="navbar__drawer-link">
                        Cart {cartCount > 0 && `(${cartCount})`}
                    </NavLink>

                    <button
                        type="button"
                        className="navbar__drawer-link navbar__drawer-theme"
                        onClick={toggleTheme}
                    >
                        Switch to {theme === "dark" ? "light" : "dark"} mode
                    </button>
                </nav>
        </aside>
        </>
    );
}
