import "./InfoPage.css";
import PolicyText from "../components/PolicyText.jsx";
import { useSite } from "../context/SiteContext.jsx";

export default function Terms() {
  const custom = useSite().settings.terms_text;

  return (
    <main className="info-page">
      <header className="info-page__header">
        <h1 className="info-page__title">Terms of Service</h1>
        <p className="info-page__intro">
          The basics of buying from RRAND.
        </p>
      </header>

      {custom ? (
        <PolicyText text={custom} />
      ) : (
        <>

      <section className="info-page__section">
        <h2>Orders &amp; payment</h2>
        <p>
          Orders are currently paid by cash on delivery. Placing an order is a commitment to
          pay for it upon delivery; repeated refused deliveries may result in future orders
          being declined.
        </p>
      </section>

      <section className="info-page__section">
        <h2>Handmade variation</h2>
        <p>
          Every piece is handmade, so small variations in size, shape, and color are normal
          and part of what makes each item one of a kind — not a defect.
        </p>
      </section>

      <section className="info-page__section">
        <h2>Changes to these terms</h2>
        <p>
          We may update these terms from time to time. Continued use of the site after changes
          are posted means you accept the updated terms.
        </p>
      </section>
        </>
      )}
    </main>
  );
}
