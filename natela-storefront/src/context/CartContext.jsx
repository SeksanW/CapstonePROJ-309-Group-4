import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { load, save } from "../lib/localStore";

const STORAGE_KEY = "natela.cart";

/* ---------------------------------------------------------
   CartContext — the cart, and the money maths.

   Rules that came from the client brief:
     · Bundle deal: buy any 2 pairs, take $30 off
     · Free worldwide shipping once the order passes $150
     · Otherwise shipping is a flat $14
     · GST 5%, prices in CAD
     · Checkout needs a Google sign-in; shopping doesn't

   The totals below are for display only. At checkout the cart
   lines go to order-service, which looks up the real prices and
   recalculates everything on the server.
   --------------------------------------------------------- */

const CartContext = createContext(null);

const BUNDLE_MIN_ITEMS = 2;
const BUNDLE_DISCOUNT = 30;
const FREE_SHIPPING_OVER = 150;
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

  useEffect(() => {
    save(STORAGE_KEY, items);
  }, [items]);

  function addItem(product, size, qty = 1) {
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
    const bundleDiscount = count >= BUNDLE_MIN_ITEMS ? BUNDLE_DISCOUNT : 0;
    const afterDiscount = Math.max(0, subtotal - bundleDiscount);
    const shipping =
      count === 0 ? 0 : afterDiscount >= FREE_SHIPPING_OVER ? 0 : FLAT_SHIPPING;
    const tax = afterDiscount * TAX_RATE;
    const total = afterDiscount + shipping + tax;
    const awayFromFreeShipping = Math.max(0, FREE_SHIPPING_OVER - afterDiscount);
    const shippingProgress = Math.min(
      100,
      (afterDiscount / FREE_SHIPPING_OVER) * 100
    );

    return {
      count,
      subtotal,
      bundleDiscount,
      shipping,
      tax,
      total,
      awayFromFreeShipping,
      shippingProgress,
    };
  }, [items]);

  const value = useMemo(
    () => ({ items, addItem, removeItem, setQty, clear, totals }),
    [items, totals]
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
