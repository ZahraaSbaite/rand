import { Link } from "react-router-dom";
import { useSite } from "../context/SiteContext.jsx";
import "./footer.css";

const SOCIAL_ICONS = {
    Instagram: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
        </svg>
    ),
    TikTok: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 3.5v11.2a3.8 3.8 0 11-3.8-3.8M14 3.5c.4 2.6 2.2 4.4 5 4.6" />
        </svg>
    ),
    Pinterest: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M11.2 8.4c3.6-.9 5.4 2.6 3.4 4.9-1.2 1.4-3.6 1-3.2-.9M11.6 11l-2 9" />
        </svg>
    ),
};

export default function Footer() {
    const { settings } = useSite();
    const socials = [
        ["Instagram", settings.instagram_url],
        ["TikTok", settings.tiktok_url],
        ["Pinterest", settings.pinterest_url],
    ].filter(([, url]) => url);

    return (
        <footer className="footer">
            <div className="footer__inner">
                <div className="footer__brand">
                    <p className="footer__mark">RRAND</p>
                    <p className="footer__tag">{settings.hero_tagline}. Made by hand, in small batches.</p>
                </div>

                <nav className="footer__col" aria-label="RRAND">
                    <h4>RRAND</h4>
                    <Link to="/our-story">About us</Link>
                    <Link to="/contact">Contact us</Link>
                    <Link to="/faq">FAQ</Link>
                </nav>

                <nav className="footer__col" aria-label="Help">
                    <h4>Help with</h4>
                    <Link to="/shipping">Shipping</Link>
                    <Link to="/returns">Returns</Link>
                    <Link to="/privacy">Privacy policy</Link>
                    <Link to="/terms">Terms</Link>
                </nav>

                <div className="footer__col footer__newsletter">
                    <h4>Get first pick of new pieces</h4>
                    <form className="footer__form" onSubmit={(e) => e.preventDefault()}>
                        <label className="footer__sr" htmlFor="footer-email">Email address</label>
                        <input id="footer-email" type="email" placeholder="you@example.com" required />
                        <button type="submit">Subscribe</button>
                    </form>
                    {settings.contact_email && (
                        <a className="footer__email" href={`mailto:${settings.contact_email}`}>
                            {settings.contact_email}
                        </a>
                    )}
                    {socials.length > 0 && (
                        <div className="footer__socials">
                            {socials.map(([label, url]) => (
                                <a key={label} href={url} aria-label={label} target="_blank" rel="noopener noreferrer">
                                    {SOCIAL_ICONS[label]}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="footer__credit">
                <span>© RRAND</span>
                <span>
                    Done by{" "}
                    <a
                        href="https://www.instagram.com/dev_oratech?igsi=MW1zeTZlNWN4dmx6dg%3D%3D&utm_source=qr"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        devoratech
                    </a>
                </span>
            </div>
        </footer>
    );
}
