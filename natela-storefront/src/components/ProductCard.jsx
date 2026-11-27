import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { SIZES } from "../data/products";
import ShortsIcon from "./ShortsIcon";

/* One product tile. Reused on the store grid and anywhere else
   products are listed — this is the most repeated piece in the app.

   Photo, name and price (sale price shown with the old price struck
   through), all linking to the product page. A small "+" square on the
   photo's bottom-right corner is a quick add: hover it (tap on touch
   screens) to show the sizes, click a size to add one to the cart.
   The square sits beside the links, not inside them — a button can't
   live inside a link. */

export default function ProductCard({ product }) {
  const { money } = useCurrency();
  const { addItem } = useCart();
  const [quickOpen, setQuickOpen] = useState(false);

  const onSale = product.comparePrice && product.comparePrice > product.price;
  const href = `/product/${product.id}`;
  const stockFor = (s) => product.stock?.[s] ?? 0;
  const soldOut = SIZES.every((s) => stockFor(s) === 0);

  function quickAdd(size) {
    addItem(product, size, 1); // opens the cart panel
    setQuickOpen(false);
  }

  return (
    <div className="card card--link">
      <div className="card__media">
        <Link to={href} className="card__photo-link" aria-label={product.name}>
          <div className="card__ph">
            {product.image ? <img src={product.image} alt={product.name} /> : <ShortsIcon />}
          </div>
        </Link>

        {!soldOut && (
          <div
            className={`quick-add${quickOpen ? " is-open" : ""}`}
            onMouseEnter={() => setQuickOpen(true)}
            onMouseLeave={() => setQuickOpen(false)}
          >
            <div className="quick-add__sizes" role="group" aria-label={`Quick add ${product.name}`}>
              {SIZES.map((s) => {
                const inStock = stockFor(s) > 0;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={!inStock}
                    tabIndex={quickOpen ? 0 : -1}
                    aria-label={inStock ? `Add size ${s} to cart` : `Size ${s} is sold out`}
                    onClick={() => quickAdd(s)}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="quick-add__toggle"
              aria-label={quickOpen ? "Hide sizes" : `Quick add ${product.name}: choose a size`}
              aria-expanded={quickOpen}
              onClick={() => setQuickOpen((o) => !o)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <Link to={href} className="card__text-link">
        <div className="card__name">{product.name}</div>

        <div className="card__price">
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
        </div>
      </Link>
    </div>
  );
}
