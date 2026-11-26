/* ---------------------------------------------------------
   Google Analytics 4, loaded only with the shopper's consent.

   Set VITE_GA_MEASUREMENT_ID (G-XXXXXXX) to turn it on. With no ID, or
   until the shopper clicks "Accept" on the cookie banner, Google's script
   is never loaded and nothing is sent to Google.

   Shopping steps are sent as GA4's standard e-commerce events
   (add_to_cart, view_cart, begin_checkout, purchase) by lib/analytics.js,
   so GA4's monetisation reports work without extra setup.
   --------------------------------------------------------- */

export const GA_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID || "").trim();

const CONSENT_KEY = "natela.analyticsConsent"; // "granted" | "denied"

let loaded = false;

export function getConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

export function setConsent(choice) {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    /* storage blocked: the choice lasts for this page only */
  }
  if (choice === "granted") loadGA();
  else if (loaded) {
    // Turned off after being on: stop sending for the rest of this visit.
    window[`ga-disable-${GA_ID}`] = true;
  }
}

/* Injects gtag.js once, if configured and consented. */
export function loadGA() {
  if (loaded || !GA_ID || getConsent() !== "granted") return;
  loaded = true;
  window[`ga-disable-${GA_ID}`] = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  // Page views are sent by hand on each route change (it's a single-page app).
  window.gtag("config", GA_ID, { send_page_view: false, anonymize_ip: true });

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
}

/* Sends one GA4 event if Analytics is loaded; otherwise does nothing. */
export function gaEvent(name, params = {}) {
  if (!loaded || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", name, params);
  } catch {
    /* never let analytics break the shop */
  }
}
