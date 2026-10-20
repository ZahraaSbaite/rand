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
          Every piece is handmade to order or in very small batches, so all sales are final.
        </p>
      </header>

      {custom ? (
        <PolicyText text={custom} />
      ) : (
        <>
          <section className="info-page__section">
            <h2>No returns or exchanges</h2>
            <p>
              We don't accept returns or exchanges, on custom orders or on pieces from the shop.
              Please check the colours, size and details on the product page, or ask us before you
              order.
            </p>
          </section>

          <section className="info-page__section">
            <h2>Questions before you order</h2>
            <p>
              Not sure about a size or a colour? Get in touch on the <a href="/contact">Contact</a>{" "}
              page and we'll help you choose.
            </p>
          </section>
        </>
      )}
    </main>
  );
}
