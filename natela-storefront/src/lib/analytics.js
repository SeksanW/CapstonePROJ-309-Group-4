import { API_URL } from "./api";
import { gaEvent } from "./ga";

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

/* Our steps → GA4's standard event names (and their parameters). */
function sendToGA(type, extra) {
  const items = extra.productId ? [{ item_id: String(extra.productId), item_name: extra.name, price: extra.price }] : undefined;
  const money = extra.value != null ? { currency: "CAD", value: extra.value } : {};
  switch (type) {
    case "page_view":
      return gaEvent("page_view", { page_path: window.location.pathname, page_title: document.title });
    case "store_view":
      return gaEvent("view_item_list", { item_list_name: "Store" });
    case "add_to_cart":
      return gaEvent("add_to_cart", { ...money, items });
    case "cart_view":
      return gaEvent("view_cart", money);
    case "checkout_start":
      return gaEvent("begin_checkout", money);
    case "checkout_paid":
      return gaEvent("purchase", { transaction_id: extra.orderId, ...money });
    default:
      return undefined;
  }
}

/* type: page_view | store_view | add_to_cart | cart_view | checkout_start | checkout_paid
   extra: productId / orderId go to our backend too; name / price / value
   are only used for Google Analytics (our backend ignores them). */
export function track(type, extra = {}) {
  sendToGA(type, extra);
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
