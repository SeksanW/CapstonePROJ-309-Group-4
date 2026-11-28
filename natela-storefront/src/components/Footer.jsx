import { useState } from "react";
import { Link } from "react-router-dom";
import DesignModal from "./DesignModal";
import { GA_ID } from "../lib/ga";
import { OPEN_CONSENT_EVENT } from "./ConsentBanner";
import { usePageSection } from "../context/PageContentContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

/* Outside links. Editable in the admin's "Main page edits" → Links (page
   content `links`); empty falls back to these. */
export const LINKS_DEFAULTS = {
  instagram: "https://www.instagram.com/natelafitwear/",
};

/* Footer links that open the same "Our story" / "Design" popups as the
   homepage hero buttons. */
const pages = {
  "Our story": "/about",
  "Refund policy": "/refund-policy",
  Contact: "/contact",
  "Size chart & care": "/size-guide",
};
const popups = { Design: "design" };

const columns = [
  {
    head: "SHOP",
    links: ["All shorts", "New arrivals", "On sale", "Bundles"],
  },
  // "Cookie settings" reopens the analytics consent banner (only when GA is on).
  { head: "BRAND", links: ["Our story", "Design", "Instagram", ...(GA_ID ? ["Cookie settings"] : [])] },
  { head: "HELP", links: ["Refund policy", "Contact", "Size chart & care"] },
];


export default function Footer() {
  const [open, setOpen] = useState(null); // "story" | "design" | null
  const links = usePageSection("links", LINKS_DEFAULTS);

  return (
    <>
    <footer className="footer">
      <FightCardSignup />
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
                ) : l === "Cookie settings" ? (
                  <a
                    key={l}
                    href="#cookies"
                    role="button"
                    onClick={(e) => {
                      e.preventDefault();
                      window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));
                    }}
                  >
                    {l}
                  </a>
                ) : l === "Instagram" ? (
                  <a key={l} href={links.instagram} target="_blank" rel="noopener noreferrer" className="footer__social">
                    <InstagramIcon />
                    {l}
                  </a>
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

    </footer>

    {/* Outside <footer> so the footer's text styles don't leak in. */}
    {open === "design" && <DesignModal onClose={() => setOpen(null)} />}
    </>
  );
}

/* "Join Our Fight Card" — the newsletter sign-up. Anyone can join with
   an email. If it's the email of an account, it shows as subscribed on
   that account's Subscription tab; either way it lands in the admin's
   Subscribers tab. */
function FightCardSignup() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | done | error
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setState("sending");
    setError(null);
    try {
      // Signed in: send the token too, so it's linked to their account.
      const token = user ? await user.getIdToken() : undefined;
      await api("/newsletter/subscribe", { method: "POST", body: { email: email.trim() }, token });
      setState("done");
    } catch (err) {
      setError(err.status === 400 ? "That email doesn't look right." : err.message);
      setState("error");
    }
  }

  return (
    <section className="fightcard" aria-labelledby="fightcard-title">
      <div>
        <h2 id="fightcard-title" className="fightcard__title">
          Join Our Fight Card
        </h2>
        <p className="fightcard__sub">Be the first to know about new collections and exclusive offers.</p>
      </div>
      {state === "done" ? (
        <p className="fightcard__done" role="status">
          You're on the card. Welcome to the team!
        </p>
      ) : (
        <form className="fightcard__form" onSubmit={submit} noValidate>
          <label htmlFor="fightcard-email" className="visually-hidden">
            Email
          </label>
          <input
            id="fightcard-email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => (setEmail(e.target.value), state === "error" && setState("idle"))}
            required
          />
          <button type="submit" disabled={state === "sending" || !email.trim()} aria-label="Join the Fight Card">
            {state === "sending" ? (
              "…"
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            )}
          </button>
          {error && (
            <p className="fightcard__error" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  );
}

function InstagramIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}
