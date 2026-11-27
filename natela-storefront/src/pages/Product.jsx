import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useProducts } from "../context/ProductsContext";
import { useCart, MAX_QTY_PER_LINE } from "../context/CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { SIZES } from "../data/products";
import ShortsIcon from "../components/ShortsIcon";
import ProductDescription from "../components/ProductDescription";

/* /product/:id — one product. Reached by clicking a product card.

   Layout: breadcrumb on top; the big photo with a scrollable "more
   photos" strip on its right; details on the right (name, price, sizes
   with stock, quantity, low-stock note, Add to cart, description).

   Photos = the main `image` first, then `images` (added in the admin's
   "More photos"). The strip only shows when there's more than one. */

const LOW_STOCK = 5; // show "Low stock" at or below this many in the chosen size

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, loading } = useProducts();
  const { addItem, openDrawer } = useCart();
  const { money, currency } = useCurrency();

  const product = products.find((p) => String(p.id) === String(id) && p.status === "live");

  const photos = useMemo(() => {
    if (!product) return [];
    // Main photo first, then the extra ones from the admin's "More photos".
    const extra = Array.isArray(product.images) ? product.images : [];
    return [...new Set([product.image, ...extra].filter(Boolean))];
  }, [product]);

  const [photo, setPhoto] = useState(0);
  const [size, setSize] = useState(null);
  const [qty, setQty] = useState(1);
  // Add-to-cart button: "idle" → "filling" (bar sweeps left to right) →
  // "added" ("Added to cart ✓"), then the cart panel opens.
  const [addState, setAddState] = useState("idle");
  const addTimers = useRef([]);

  const thumbsRef = useRef(null);

  // New product → start fresh, at the top of the page.
  useEffect(() => {
    setPhoto(0);
    setSize(null);
    setQty(1);
    setAddState("idle");
    window.scrollTo(0, 0);
  }, [id]);

  // Cancel a running add animation if the page goes away.
  useEffect(() => () => addTimers.current.forEach(clearTimeout), []);

  /* Previous / next photo, wrapping round at either end. Used by tapping
     the left/right half of the big photo and by the ← → keys. */
  const count = photos.length;
  const step = (dir) => setPhoto((i) => (i + dir + count) % count);

  useEffect(() => {
    if (count < 2) return;
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft") setPhoto((i) => (i - 1 + count) % count);
      if (e.key === "ArrowRight") setPhoto((i) => (i + 1) % count);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count]);

  // Keep the current thumbnail in view in the strip.
  useEffect(() => {
    const strip = thumbsRef.current;
    const active = strip?.children[photo];
    if (!strip || !active) return;
    const vertical = strip.scrollHeight > strip.clientHeight;
    if (vertical) {
      const top = active.offsetTop - strip.offsetTop;
      if (top < strip.scrollTop || top + active.offsetHeight > strip.scrollTop + strip.clientHeight) {
        strip.scrollTo({ top: top - (strip.clientHeight - active.offsetHeight) / 2, behavior: "smooth" });
      }
    } else {
      const left = active.offsetLeft - strip.offsetLeft;
      strip.scrollTo({ left: left - (strip.clientWidth - active.offsetWidth) / 2, behavior: "smooth" });
    }
  }, [photo]);

  if (loading) {
    return <div className="page pdp-empty">Loading…</div>;
  }
  if (!product) {
    return (
      <div className="page pdp-empty">
        <p>This product isn't available.</p>
        <Link to="/" className="btn btn--outline">
          Back to the shop
        </Link>
      </div>
    );
  }

  const onSale = product.comparePrice && product.comparePrice > product.price;
  const stockFor = (s) => product.stock?.[s] ?? 0;
  const soldOut = SIZES.every((s) => stockFor(s) === 0);
  const left = size ? stockFor(size) : null;
  const maxQty = size ? Math.min(MAX_QTY_PER_LINE, left) : MAX_QTY_PER_LINE;

  function chooseSize(s) {
    setSize(s);
    if (addState === "added") setAddState("idle");
    setQty((q) => Math.max(1, Math.min(q, Math.min(MAX_QTY_PER_LINE, stockFor(s)))));
  }

  /* Adds straight away, then plays the button animation before opening
     the cart panel (so the panel doesn't cover it). Timings match
     .pdp__add in global.css. */
  function handleAdd() {
    if (!size || addState === "filling") return;
    addItem(product, size, qty, { openDrawer: false });
    addTimers.current.forEach(clearTimeout);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setAddState("added");
      openDrawer();
      return;
    }
    setAddState("filling");
    addTimers.current = [
      setTimeout(() => setAddState("added"), 600),
      setTimeout(openDrawer, 1050),
      setTimeout(() => setAddState("idle"), 3200),
    ];
  }

  function goToProducts(e) {
    e.preventDefault();
    navigate("/");
    let tries = 0;
    const scroll = () => {
      const el = document.getElementById("new");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else if (tries++ < 30) requestAnimationFrame(scroll);
    };
    requestAnimationFrame(scroll);
  }

  return (
    <div className="page pdp">
      <nav className="pdp__crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <a href="/#new" onClick={goToProducts}>
          Products
        </a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="pdp__layout">
        {/* ---------- photos ---------- */}
        {/* Main photo, with a scrollable strip of more photos on its right
            (only when the product has more than one). */}
        <div className={`pdp__gallery${photos.length > 1 ? " has-thumbs" : ""}`}>
          <div className="pdp__main-photo">
            {photos[photo] ? <img src={photos[photo]} alt={product.name} /> : <ShortsIcon size={200} />}
            {/* Tap/click the left or right half to go back / forward. */}
            {count > 1 && (
              <>
                <button type="button" className="pdp__nav pdp__nav--prev" aria-label="Previous photo" onClick={() => step(-1)}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button type="button" className="pdp__nav pdp__nav--next" aria-label="Next photo" onClick={() => step(1)}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <span className="pdp__count" aria-live="polite">
                  {photo + 1} / {count}
                </span>
              </>
            )}
          </div>
          {photos.length > 1 && (
            <div className="pdp__thumbs" role="list" aria-label="More photos" ref={thumbsRef}>
              {photos.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  role="listitem"
                  className={i === photo ? "is-active" : ""}
                  aria-label={`Show photo ${i + 1} of ${photos.length}`}
                  aria-pressed={i === photo}
                  onClick={() => setPhoto(i)}
                >
                  <img src={src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ---------- details ---------- */}
        <div className="pdp__info">
          <h1 className="pdp__name">{product.name}</h1>

          {/* "Regular price $110.00 CAD" (or "Sale price … was …"), in the
              shopper's chosen currency with its code after it. */}
          <div className="pdp__price">
            <span className="pdp__price-label">{onSale ? "Sale price" : "Regular price"}</span>
            {onSale ? (
              <>
                <span className="pdp__price-sale">
                  {money(product.price)} {currency}
                </span>
                <span className="pdp__price-was">{money(product.comparePrice)}</span>
              </>
            ) : (
              <span>
                {money(product.price)} {currency}
              </span>
            )}
          </div>

          <div className="pdp__block">
            <span className="pdp__label" id="pdp-size-label">
              Size{size ? `: ${size}` : ""}
            </span>
            <div className="pdp__sizes" role="group" aria-labelledby="pdp-size-label">
              {SIZES.map((s) => {
                const inStock = stockFor(s) > 0;
                return (
                  <button
                    key={s}
                    type="button"
                    className={`pdp__size${size === s ? " is-selected" : ""}`}
                    disabled={!inStock}
                    aria-pressed={size === s}
                    aria-label={inStock ? `Size ${s}` : `Size ${s}, sold out`}
                    onClick={() => chooseSize(s)}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pdp__block">
            <span className="pdp__label" id="pdp-qty-label">
              Quantity
            </span>
            <div className="pdp__qty" role="group" aria-labelledby="pdp-qty-label">
              <button type="button" aria-label="One fewer" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)}>
                −
              </button>
              <span aria-live="polite">{qty}</span>
              <button type="button" aria-label="One more" disabled={qty >= maxQty} onClick={() => setQty((q) => q + 1)}>
                +
              </button>
            </div>
          </div>

          {size && left > 0 && left <= LOW_STOCK && (
            <p className="pdp__low">
              <span aria-hidden="true" />
              Low stock · {left} left in {size}
            </p>
          )}

          <button
            type="button"
            className={`btn btn--dark btn--block pdp__add pdp__add--${addState}`}
            disabled={soldOut || !size}
            onClick={handleAdd}
            aria-live="polite"
          >
            <span className="pdp__add-fill" aria-hidden="true" />
            <span className="pdp__add-label">
              {soldOut
                ? "Sold out"
                : addState === "added"
                ? "Added to cart ✓"
                : addState === "filling"
                ? "Adding…"
                : size
                ? "Add to cart"
                : "Choose a size"}
            </span>
          </button>

          <ProductDescription text={product.description} />
        </div>
      </div>
    </div>
  );
}
