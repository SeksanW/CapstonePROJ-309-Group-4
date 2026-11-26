/* ---------------------------------------------------------
   Google Analytics 4 with Google Consent Mode.

   Set VITE_GA_MEASUREMENT_ID (G-XXXXXXX) to turn it on; with no ID
   nothing loads at all.

   The Google tag loads on every visit (so Google's "test installation"
   check can find it), but starts with every consent DENIED: no analytics
   or advertising cookies, only anonymous cookieless pings that Google
   uses to model visits. When the shopper clicks "Accept" on the cookie
   banner, analytics cookies are switched on. "Decline" keeps them off.
   Advertising consent is never granted — the shop doesn't run Google Ads.

   Shopping steps are sent as GA4's standard e-commerce events
   (add_to_cart, view_cart, begin_checkout, purchase) by lib/analytics.js.
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

function analyticsConsent(choice) {
  return { analytics_storage: choice === "granted" ? "granted" : "denied" };
}

/* Loads the Google tag once (if configured), consent denied by default,
   or granted straight away for a returning shopper who already accepted. */
export function loadGA() {
  if (loaded || !GA_ID) return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  // Must come before "config" so no cookie is set before consent.
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    ...analyticsConsent(getConsent()),
  });
  window.gtag("js", new Date());
  // Page views are sent by hand on each route change (it's a single-page app).
  window.gtag("config", GA_ID, { send_page_view: false });

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
}

/* The shopper's choice from the cookie banner. */
export function setConsent(choice) {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    /* storage blocked: the choice lasts for this page only */
  }
  loadGA();
  if (typeof window.gtag === "function") window.gtag("consent", "update", analyticsConsent(choice));
}

/* Sends one GA4 event if the tag is loaded; otherwise does nothing. */
export function gaEvent(name, params = {}) {
  if (!loaded || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", name, params);
  } catch {
    /* never let analytics break the shop */
  }
}
