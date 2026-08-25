import "./Footer.css";

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer__col">
                <h4>RRAND</h4>
                <a href="/our-story">About Us</a>
                <a href="/contact">Contact Us</a>
                <a href="/faq">FAQ</a>
            </div>

            <div className="footer__col">
                <h4>Help With</h4>
                <a href="/shipping">Shipping</a>
                <a href="/returns">Returns</a>
                <a href="/privacy">Privacy Policy</a>
                <a href="/terms">Terms</a>
            </div>

            <div className="footer__col">
                <h4>Connect</h4>
                <div className="footer__socials">
                    <a href="#" aria-label="Instagram">IG</a>
                    <a href="#" aria-label="TikTok">TT</a>
                    <a href="#" aria-label="Pinterest">PIN</a>
                </div>
            </div>

            <div className="footer__col footer__newsletter">
                <h4>Get first pick of new pieces</h4>
                <form
                    className="footer__form"
                    onSubmit={(e) => e.preventDefault()}
                >
                    <input type="email" placeholder="Enter your email" required />
                    <button type="submit">Subscribe</button>
                </form>
            </div>

            <div className="footer__credit">
                Done by{" "}
                <a
                    href="https://www.instagram.com/dev_oratech?igsi=MW1zeTZlNWN4dmx6dg%3D%3D&utm_source=qr"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    devoratech
                </a>
            </div>
        </footer>
    );
}