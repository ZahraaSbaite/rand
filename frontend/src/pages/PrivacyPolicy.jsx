import "./InfoPage.css";
import PolicyText from "../components/PolicyText.jsx";
import { useSite } from "../context/SiteContext.jsx";

export default function PrivacyPolicy() {
  const custom = useSite().settings.privacy_text;

  return (
    <main className="info-page">
      <header className="info-page__header">
        <h1 className="info-page__title">Privacy Policy</h1>
        <p className="info-page__intro">
          A plain-language summary of what we collect and how it's used.
        </p>
      </header>

      {custom ? (
        <PolicyText text={custom} />
      ) : (
        <>

      <section className="info-page__section">
        <h2>What we collect</h2>
        <p>
          When you place an order, request a custom piece, or contact us, we collect the
          details you provide — name, email, phone, and shipping address — solely to fulfill
          and communicate about your order.
        </p>
      </section>

      <section className="info-page__section">
        <h2>How it's used</h2>
        <p>
          Your information is used to process orders, respond to inquiries, and — only if you
          opt in via the newsletter form — send occasional updates about new pieces. We do not
          sell or share your information with third parties for marketing purposes.
        </p>
      </section>

      <section className="info-page__section">
        <h2>Contact</h2>
        <p>
          Questions about your data? Reach out on the <a href="/contact">Contact</a> page.
        </p>
      </section>
        </>
      )}
    </main>
  );
}
