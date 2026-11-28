import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { load, save } from "../lib/localStore";
import { track } from "../lib/analytics";
import { api } from "../lib/api";

const STORAGE_KEY = "natela.cart";

/* ---------------------------------------------------------
   CartContext — the cart, and the money maths.

   Rules that came from the client brief:
     · Bundle deal: buy any 2 pairs, take $30 off (switched off for now,
       see BUNDLE_DEAL_ENABLED below)
     · Shipping is a flat $14, free once the order reaches $150
     · GST 5%, prices in CAD

   The totals the cart shows come from the server: every change to the
   cart asks order-service (POST /orders/quote) to price it with the
   real prices from the database, the same way checkout does. Until
   that answer arrives (or if it can't be reached) the cart shows a
   local estimate using the same rules. Checkout itself always
   re-prices on the server, so what Stripe charges is never the
   browser's number.
   --------------------------------------------------------- */

const CartContext = createContext(null);

/* "Any 2 pairs, $30 off". No deal is running right now, so it's switched
   off: no discount, and nothing about it shows on the site. To run it,
   set this to true AND set BUNDLE_DEAL_ENABLED=true for order-service
   (backend), so checkout charges the same as the cart shows. */
export const BUNDLE_DEAL_ENABLED = false;

const BUNDLE_MIN_ITEMS = 2;
const BUNDLE_DISCOUNT = 30;
const FLAT_SHIPPING = 14;
const FREE_SHIPPING_OVER = 150;
const TAX_RATE = 0.05;
const QUOTE_DELAY_MS = 300; // quick +/− clicks send one quote, not several
const NO_PROBLEMS = [];

/* order-service rejects more than this per cart line. */
export const MAX_QTY_PER_LINE = 20;

/* One cart line is identified by product + size, not product alone,
   so a medium and a large of the same shorts are separate lines. */
const lineKey = (productId, size) => `${productId}__${size}`;

export function CartProvider({ children }) {
  /* Kept in the browser so it survives a refresh and the trip to
     Stripe and back. Shoppers can fill it before signing in. */
  const [items, setItems] = useState(() => load(STORAGE_KEY, []));
  // Slide-over cart (CartDrawer), opened automatically whenever something
  // is added.
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    save(STORAGE_KEY, items);
  }, [items]);

  /* The server's price for the current cart: { key, totals, problems }.
     `key` says which cart it priced, so an answer for an older cart is
     never shown against a newer one. */
  const [quote, setQuote] = useState(null);
  const linesKey = JSON.stringify(items.map((i) => [i.productId, i.size, i.qty]));

  useEffect(() => {
    if (items.length === 0) {
      setQuote(null);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      api("/orders/quote", {
        method: "POST",
        body: { items: items.map(({ productId, size, qty }) => ({ productId, size, qty })) },
      })
        .then((data) => {
          if (!cancelled) setQuote({ key: linesKey, totals: data.totals, problems: [] });
        })
        .catch((err) => {
          // 409 lists what can't be ordered (sold out, removed); anything
          // else (offline…) just leaves the local estimate showing.
          if (!cancelled) {
            setQuote({ key: linesKey, totals: null, problems: err.status === 409 ? err.details ?? [] : [] });
          }
        });
    }, QUOTE_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // linesKey covers every change to items that affects the price.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linesKey]);

  /* `openDrawer: false` from the full cart page itself — popping the
     drawer open there would just cover the cart it's already showing. */
  function addItem(product, size, qty = 1, { openDrawer = true } = {}) {
    track("add_to_cart", { productId: product.id, name: product.name, price: product.price, value: product.price * qty });
    const key = lineKey(product.id, size);
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, qty: Math.min(MAX_QTY_PER_LINE, i.qty + qty) } : i
        );
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          name: product.name,
          price: product.price,
          size,
          sport: product.sport,
          image: product.image,
          qty,
        },
      ];
    });
    if (openDrawer) setDrawerOpen(true);
  }

  function removeItem(key) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  function setQty(key, qty) {
    if (qty < 1) return removeItem(key);
    const capped = Math.min(MAX_QTY_PER_LINE, qty);
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, qty: capped } : i)));
  }

  function clear() {
    setItems([]);
  }

  /* Local estimate, same rules as order-service's pricing.js. */
  const estimate = useMemo(() => {
    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
    const bundleDiscount = BUNDLE_DEAL_ENABLED && count >= BUNDLE_MIN_ITEMS ? BUNDLE_DISCOUNT : 0;
    const afterDiscount = Math.max(0, subtotal - bundleDiscount);
    const shipping = count === 0 || afterDiscount >= FREE_SHIPPING_OVER ? 0 : FLAT_SHIPPING;
    const tax = afterDiscount * TAX_RATE;
    const total = afterDiscount + shipping + tax;

    return {
      count,
      subtotal,
      bundleDiscount,
      shipping,
      tax,
      total,
    };
  }, [items]);

  const current = quote?.key === linesKey ? quote : null;
  const totals = current?.totals ?? estimate;
  // True once the shown totals are the server's for exactly this cart.
  const totalsFromServer = Boolean(current?.totals);
  // A quote for this cart is still on its way.
  const checkingPrices = items.length > 0 && !current;
  // Lines the server says can't be ordered right now (409 details).
  const cartProblems = current?.problems?.length ? current.problems : NO_PROBLEMS;

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      setQty,
      clear,
      totals,
      totalsFromServer,
      checkingPrices,
      cartProblems,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }),
    [items, totals, totalsFromServer, checkingPrices, cartProblems, drawerOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

/* Money formatter used everywhere, so CAD formatting is consistent. */
export function money(n) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(n);
}
