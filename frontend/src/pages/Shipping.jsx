import "./InfoPage.css";

export default function Shipping() {
  return (
    <main className="info-page">
      <header className="info-page__header">
        <p className="info-page__eyebrow">Good to know</p>
        <h1 className="info-page__title">Shipping</h1>
        <p className="info-page__intro">
          Every piece is made to order or from very limited stock, so shipping timelines
          reflect the making time, not a warehouse pick-and-pack.
        </p>
      </header>

      <section className="info-page__section">
        <h2>Processing time</h2>
        <p>
          In-stock pieces ship within 3–5 business days. Custom orders follow the timeline
          quoted at the time of your request, typically 2–4 weeks.
        </p>
      </section>

      <section className="info-page__section">
        <h2>Rates</h2>
        <p>
          A flat shipping rate of $5.00 applies to every order, calculated at checkout
          alongside your subtotal.
        </p>
      </section>

      <section className="info-page__section">
        <h2>Where we ship</h2>
        <p>
          We currently ship within the country only. International shipping is on the roadmap —
          reach out on the <a href="/contact">Contact</a> page if you'd like to be notified.
        </p>
      </section>
    </main>
  );
}
