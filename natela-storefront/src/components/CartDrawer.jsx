import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart, money } from "../context/CartContext";
import ShortsIcon from "./ShortsIcon";
import BuyAnotherSize from "./BuyAnotherSize";

/* The slide-over cart preview that opens automatically whenever something
   is added to the cart (see CartContext's addItem). "Checkout" below just
   hands off to the full /cart page, where payment actually happens. */

export default function CartDrawer() {
  const { items, totals, drawerOpen, closeDrawer, setQty, removeItem } = useCart();

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e) => e.key === "Escape" && closeDrawer();
    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  return (
    <div className="cart-drawer-overlay" onClick={closeDrawer}>
      <div
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cart-drawer__head">
          <h2 className="h3" style={{ marginBottom: 0 }}>
            Your cart
          </h2>
          <button type="button" className="cart-drawer__close" onClick={closeDrawer} aria-label="Close">
            ×
          </button>
        </div>

        <div className="cart-drawer__items">
          {items.length === 0 ? (
            <p className="muted" style={{ padding: "32px 0", textAlign: "center" }}>
              Your cart is empty.
            </p>
          ) : (
            items.map((item) => (
              <div key={item.key} className="cart-item" style={{ padding: "16px 0" }}>
                <div className="cart-thumb" style={{ width: 72, height: 86 }}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <ShortsIcon size={34} stroke={2.4} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{item.name}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap" }}>
                      {money(item.price * item.qty)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: "auto" }}>
                    Size {item.size}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 10,
                    }}
                  >
                    <div className="qty">
                      <button onClick={() => setQty(item.key, item.qty - 1)} aria-label="Decrease quantity">
                        −
                      </button>
                      <span>{item.qty}</span>
                      <button onClick={() => setQty(item.key, item.qty + 1)} aria-label="Increase quantity">
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.key)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        fontSize: 11.5,
                        color: "var(--ink-muted)",
                        textDecoration: "underline",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <BuyAnotherSize item={item} />
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-drawer__footer">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 14.5,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              <span>Subtotal</span>
              <span>{money(totals.subtotal)}</span>
            </div>
            <Link to="/cart" className="btn btn--grad btn--block" onClick={closeDrawer}>
              Checkout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
