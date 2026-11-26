import { GA_ID } from "../lib/ga";
import { OPEN_CONSENT_EVENT } from "./ConsentBanner";
import { useState } from "react";
import StoryModal from "./StoryModal";
import DesignModal from "./DesignModal";

/* Footer links that open the same "Our story" / "Design" popups as the
   homepage hero buttons. */
const popups = { "Our story": "story", Design: "design" };

const columns = [
  {
    head: "SHOP",
    links: ["All shorts", "New arrivals", "On sale", "Bundles"],
  },
  { head: "BRAND", links: ["Our story", "Design", "Contact", "Instagram"] },
];

const payment = ["VISA", "MC", "AMEX", "APPLE PAY", "PAYPAL"];

export default function Footer() {
  const [open, setOpen] = useState(null); // "story" | "design" | null

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
                popups[l] ? (
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
        <span>
          © 2026 Natela Fit. All rights reserved.
          {GA_ID && (
            <>
              {" · "}
              <button type="button" className="footer__link-btn" onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}>
                Cookie settings
              </button>
            </>
          )}
        </span>
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
    {open === "story" && <StoryModal onClose={() => setOpen(null)} />}
    {open === "design" && <DesignModal onClose={() => setOpen(null)} />}
    </>
  );
}
