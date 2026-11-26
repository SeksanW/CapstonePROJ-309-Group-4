import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { load, save } from "../lib/localStore";

const STORAGE_KEY = "natela.cart";

/* ---------------------------------------------------------
   CartContext — the cart, and the money maths.

   Rules that came from the client brief:
     · Bundle deal: buy any 2 pairs, take $30 off (switched off for now,
       see BUNDLE_DEAL_ENABLED below)
     · Shipping is a flat $14
     · GST 5%, prices in CAD
     · Checkout needs a Google sign-in; shopping doesn't

   The totals below are for display only. At checkout the cart
   lines go to order-service, which looks up the real prices and
   recalculates everything on the server.
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
const TAX_RATE = 0.05;

/* order-service rejects more than this per cart line. */
export const MAX_QTY_PER_LINE = 20;

/* One cart line is identified by product + size, not product alone,
   so a medium and a large of the same shorts are separate lines. */
const lineKey = (productId, size) => `${productId}__${size}`;

export function CartProvider({ children }) {
  /* Kept in the browser so it survives a refresh and the trip to
     Stripe and back. Shoppers can fill it before signing in. */
  const [items, setItems] = useState(() => load(STORAGE_KEY, []));
  // Slide-over cart preview, opened automatically whenever something is
  // added — the standard "added to cart" pattern, instead of a button
  // label that briefly changes to confirm it.
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    save(STORAGE_KEY, items);
  }, [items]);

  /* `openDrawer: false` from the full cart page itself — popping the
     drawer open there would just cover the cart it's already showing. */
  function addItem(product, size, qty = 1, { openDrawer = true } = {}) {
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

  const totals = useMemo(() => {
    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
    const bundleDiscount = BUNDLE_DEAL_ENABLED && count >= BUNDLE_MIN_ITEMS ? BUNDLE_DISCOUNT : 0;
    const afterDiscount = Math.max(0, subtotal - bundleDiscount);
    const shipping = count === 0 ? 0 : FLAT_SHIPPING;
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

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      setQty,
      clear,
      totals,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }),
    [items, totals, drawerOpen]
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
