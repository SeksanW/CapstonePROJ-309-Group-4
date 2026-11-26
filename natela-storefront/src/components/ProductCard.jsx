import { useEffect, useRef, useState } from "react";
import { SIZES } from "../data/products";
import { useCart, money } from "../context/CartContext";
import Stars from "./Stars";
import ShortsIcon from "./ShortsIcon";

/* One product tile. Reused on the store grid and anywhere else
   products are listed — this is the most repeated piece in the app.

   The client asked for size buttons that show stock per size, so
   an out-of-stock size renders disabled and struck through. */

export default function ProductCard({ product }) {
  const [selectedSize, setSelectedSize] = useState(null);
  // "idle" → "filling" (bar sweeps left to right) → "added", then the
  // cart panel opens. Timings match .add-sweep in global.css.
  const [addState, setAddState] = useState("idle");
  const timers = useRef([]);
  const { addItem, openDrawer } = useCart();

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const onSale = product.comparePrice && product.comparePrice > product.price;
  const totalStock = Object.values(product.stock).reduce((a, b) => a + b, 0);
  const soldOut = totalStock === 0;

  function handleAdd() {
    if (!selectedSize || addState === "filling") return;
    addItem(product, selectedSize, 1, { openDrawer: false });
    timers.current.forEach(clearTimeout);
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setAddState("added");
      openDrawer();
      timers.current = [setTimeout(() => setAddState("idle"), 2000)];
      return;
    }
    setAddState("filling");
    timers.current = [
      setTimeout(() => setAddState("added"), 600),
      setTimeout(openDrawer, 1050),
      setTimeout(() => setAddState("idle"), 3200),
    ];
  }

  const tag = soldOut ? "SOLD OUT" : onSale ? "SALE" : product.tag;
  const tagBg = soldOut
    ? "var(--ink-faint)"
    : onSale || product.tag !== "NEW"
    ? "var(--brand-red)"
    : "var(--ink)";

  return (
    <div className="card">
      <div className="card__media">
        <div className="card__ph">
          {product.image ? (
            <img src={product.image} alt={product.name} />
          ) : (
            <ShortsIcon />
          )}
        </div>
        {tag && (
          <span className="card__tag" style={{ background: tagBg }}>
            {tag}
          </span>
        )}
      </div>

      <Stars rating={product.rating} reviews={product.reviews} />

      <div className="card__name-price">
        <span className="card__name">{product.name}</span>
        <span className="card__price">
          {onSale ? (
            <>
              <span style={{ color: "var(--brand-red)", fontWeight: 600 }}>
                {money(product.price)}
              </span>{" "}
              <span
                style={{
                  color: "var(--ink-faint)",
                  textDecoration: "line-through",
                  fontSize: 13,
                }}
              >
                {money(product.comparePrice)}
              </span>
            </>
          ) : (
            money(product.price)
          )}
        </span>
      </div>

      <div className="sizes">
        {SIZES.map((size) => {
          const inStock = product.stock[size] > 0;
          return (
            <button
              key={size}
              className={`size-btn${selectedSize === size ? " is-selected" : ""}`}
              disabled={!inStock}
              onClick={() => setSelectedSize(size)}
              aria-label={
                inStock ? `Select size ${size}` : `Size ${size} is out of stock`
              }
            >
              {size}
            </button>
          );
        })}
      </div>

      <button
        className={`btn btn--dark btn--block add-sweep add-sweep--${addState}`}
        style={{ marginTop: 10, padding: "11px 0", fontSize: 13 }}
        disabled={soldOut || !selectedSize}
        onClick={handleAdd}
        aria-live="polite"
      >
        <span className="add-sweep__fill" aria-hidden="true" />
        <span className="add-sweep__label">
          {soldOut
            ? "Sold out"
            : addState === "added"
            ? "Added to cart ✓"
            : addState === "filling"
            ? "Adding…"
            : "Add to cart"}
        </span>
      </button>
    </div>
  );
}
