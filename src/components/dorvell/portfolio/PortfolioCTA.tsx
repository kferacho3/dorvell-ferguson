import Link from "next/link";
export function PortfolioCTA() {
  return (
    <section className="pf-cta" aria-labelledby="pf-cta-title">
      <div className="pf-container pf-cta__inner">
        <h2 id="pf-cta-title">Work with Dorvell</h2>

        <div className="pf-cta__actions">
          <Link className="button-primary" href="/contact">
            Book a shoot
          </Link>
        </div>
      </div>
    </section>
  );
}
