import { useState } from "react";
import { Link } from "react-router-dom";
import DesignModal from "./DesignModal";

/* "Our story" goes to the /our-story page; "Design" opens the same popup
   as the homepage hero button. */
const pages = { "Our story": "/our-story" };
const popups = { Design: "design" };

const columns = [
  {
    head: "SHOP",
    links: ["All shorts", "New arrivals", "On sale", "Bundles"],
  },
  { head: "BRAND", links: ["Our story", "Design", "Contact", "Instagram"] },
];

const payment = ["VISA", "MC", "AMEX", "APPLE PAY", "PAYPAL"];

export default function Footer() {
  const [open, setOpen] = useState(null); // "design" | null

  return (
    <>
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
                pages[l] ? (
                  <Link key={l} to={pages[l]}>
                    {l}
                  </Link>
                ) : popups[l] ? (
                  <a
                    key={l}
                    href={`#${popups[l]}`}
                    role="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setOpen(popups[l]);
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

    {/* Outside <footer> so the footer's text styles don't leak in. */}
    {open === "design" && <DesignModal onClose={() => setOpen(null)} />}
    </>
  );
}
