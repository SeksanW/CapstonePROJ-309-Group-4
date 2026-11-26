import { useState } from "react";
import { SIZES } from "../data/products";
import { useProducts } from "../context/ProductsContext";
import { useCart } from "../context/CartContext";

/* A toggle on a cart line that reveals the same size buttons as the
   product card, so a shopper can add another size of the same product
   (e.g. an S and an XL) without leaving the cart to go find it again.
   Shown in both the cart drawer and the full cart page. */

export default function BuyAnotherSize({ item, openDrawer = true }) {
  const [open, setOpen] = useState(false);
  const { products } = useProducts();
  const { addItem } = useCart();

  const product = products.find((p) => p.id === item.productId);
  if (!product) return null; // e.g. no longer live

  function pick(size) {
    addItem(product, size, 1, { openDrawer });
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          marginTop: 16,
          fontSize: 11.5,
          color: "var(--brand-black)",
          textDecoration: "underline",
        }}
      >
        Buy a different size
      </button>
    );
  }

  return (
    <div className="panel" style={{ marginTop: 16, padding: 12 }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-muted)", marginBottom: 8 }}>
        CHOOSE A SIZE
      </div>
      <div className="sizes">
        {SIZES.map((size) => {
          const inStock = product.stock[size] > 0;
          return (
            <button
              key={size}
              className="size-btn"
              disabled={!inStock}
              onClick={() => pick(size)}
              aria-label={inStock ? `Add size ${size} to cart` : `Size ${size} is out of stock`}
            >
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );
}
