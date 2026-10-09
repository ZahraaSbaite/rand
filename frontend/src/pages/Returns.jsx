import "./InfoPage.css";
import PolicyText from "../components/PolicyText.jsx";
import { useSite } from "../context/SiteContext.jsx";

export default function Returns() {
  const custom = useSite().settings.returns_text;

  return (
    <main className="info-page">
      <header className="info-page__header">
        <h1 className="info-page__title">Returns</h1>
        <p className="info-page__intro">
          Because every piece is handmade to order or in very limited quantity, our returns
          policy is narrower than a mass-market shop's — here's exactly how it works.
        </p>
      </header>

      {custom ? (
        <PolicyText text={custom} />
      ) : (
        <>

      <section className="info-page__section">
        <h2>Damaged or defective items</h2>
        <p>
          If your order arrives damaged or with a manufacturing defect, contact us within 7 days
          of delivery with a photo and we'll arrange a replacement or refund.
        </p>
      </section>

      <section className="info-page__section">
        <h2>Change of mind</h2>
        <p>
          Since most pieces are made specifically for your order, we aren't able to accept
          change-of-mind returns on custom orders. In-stock, unused items may be returned
          within 14 days at the buyer's shipping cost.
        </p>
      </section>

      <section className="info-page__section">
        <h2>How to start a return</h2>
        <p>
          Reach out via the <a href="/contact">Contact</a> page with your order number and
          we'll walk you through the next steps.
        </p>
      </section>
        </>
      )}
    </main>
  );
}
