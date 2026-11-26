import { useEffect, useState } from "react";
import { GA_ID, getConsent, loadGA, setConsent } from "../lib/ga";

/* Cookie banner for Google Analytics. Shown once (until the shopper
   chooses), and again when they click "Cookie settings" in the footer.
   Only appears when GA is configured (VITE_GA_MEASUREMENT_ID). */

export const OPEN_CONSENT_EVENT = "natela:open-consent";

export default function ConsentBanner() {
  const [open, setOpen] = useState(() => Boolean(GA_ID) && !getConsent());

  // A returning shopper who already accepted: load GA straight away.
  useEffect(() => {
    loadGA();
  }, []);

  useEffect(() => {
    const show = () => GA_ID && setOpen(true);
    window.addEventListener(OPEN_CONSENT_EVENT, show);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, show);
  }, []);

  if (!open) return null;

  function choose(choice) {
    setConsent(choice);
    setOpen(false);
  }

  return (
    <div className="consent" role="dialog" aria-live="polite" aria-label="Cookie preferences">
      <p>
        We use Google Analytics cookies to understand how people use the shop and improve it. They're only set if you
        accept.
      </p>
      <div className="consent__actions">
        <button type="button" className="btn btn--outline" onClick={() => choose("denied")}>
          Decline
        </button>
        <button type="button" className="btn btn--grad" onClick={() => choose("granted")}>
          Accept
        </button>
      </div>
    </div>
  );
}
