import { API_URL } from "./api";

/* ---------------------------------------------------------
   Anonymous shopper analytics (order-service /analytics/events).

   Each browser visit gets a random id, kept in localStorage and renewed
   after 30 quiet minutes, so the owners can see how far visits get and
   where they leave. No names, emails or other personal details are
   sent — just the step and the page path.

   Fire-and-forget: it never throws, never blocks the page, and keeps
   working as the page unloads (keepalive).
   --------------------------------------------------------- */

const KEY = "natela.visit";
const VISIT_GAP_MS = 30 * 60 * 1000;

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/* The current visit id (a new one after 30 quiet minutes). */
export function visitId() {
  const now = Date.now();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    const id = saved && now - saved.lastAt < VISIT_GAP_MS ? saved.id : newId();
    localStorage.setItem(KEY, JSON.stringify({ id, lastAt: now }));
    return id;
  } catch {
    // Storage blocked: still count the event, just not across pages.
    return newId();
  }
}

/* type: page_view | store_view | add_to_cart | cart_view | checkout_start | checkout_paid */
export function track(type, extra = {}) {
  try {
    const body = JSON.stringify({
      sessionId: visitId(),
      type,
      path: window.location.pathname,
      ...extra,
    });
    fetch(`${API_URL}/analytics/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never let analytics break the shop */
  }
}
