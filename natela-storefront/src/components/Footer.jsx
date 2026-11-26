const columns = [
  {
    head: "SHOP",
    links: ["All shorts", "New arrivals", "On sale", "Bundles"],
  },
  { head: "BRAND", links: ["Our story", "Contact", "Instagram"] },
];

const payment = ["VISA", "MC", "AMEX", "APPLE PAY", "PAYPAL"];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__grid">
        <div>
          <img
            src="/images/natela-logo.png"
            alt="Natela"
            className="brand-logo brand-logo--sm"
            style={{ marginBottom: 14 }}
          />
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.6)",
              maxWidth: 260,
              marginTop: 14,
            }}
          >
            Muay Thai shorts built by fighters, shipped worldwide from Calgary.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.head}>
            <div className="footer__head">{col.head}</div>
            <div className="footer__links">
              {col.links.map((l) => (
                <a key={l} href="#help">
                  {l}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="footer__bottom">
        <span>© 2026 Natela Fit. All rights reserved.</span>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span>We accept</span>
          {payment.map((p) => (
            <span key={p} className="paychip">
              {p}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
