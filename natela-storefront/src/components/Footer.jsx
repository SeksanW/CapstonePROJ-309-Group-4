import { useLocation, useNavigate } from "react-router-dom";

/* Footer links that jump to the homepage's "Our story" / "Design"
   sections (#story, #design), from any page. */
const sections = { "Our story": "story", Design: "design" };

const columns = [
  {
    head: "SHOP",
    links: ["All shorts", "New arrivals", "On sale", "Bundles"],
  },
  { head: "BRAND", links: ["Our story", "Design", "Contact", "Instagram"] },
];

const payment = ["VISA", "MC", "AMEX", "APPLE PAY", "PAYPAL"];

export default function Footer() {
  const location = useLocation();
  const navigate = useNavigate();

  function goTo(id) {
    if (location.pathname !== "/") navigate("/");
    // The homepage may still be rendering after navigating; retry briefly.
    let tries = 0;
    const scroll = () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else if (tries++ < 30) requestAnimationFrame(scroll);
    };
    requestAnimationFrame(scroll);
  }

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
              {col.links.map((l) =>
                sections[l] ? (
                  <a
                    key={l}
                    href={`/#${sections[l]}`}
                    onClick={(e) => {
                      e.preventDefault();
                      goTo(sections[l]);
                    }}
                  >
                    {l}
                  </a>
                ) : (
                  <a key={l} href="#help">
                    {l}
                  </a>
                )
              )}
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
