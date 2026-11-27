import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../context/ProductsContext";
import { usePageSection } from "../context/PageContentContext";
import { useCurrency } from "../context/CurrencyContext";
import { BUNDLE_DEAL_ENABLED } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import ShortsIcon from "../components/ShortsIcon";
import { track } from "../lib/analytics";

/* SCRUM-8 — Store page.
   The main page: hero, product grid, sale row, bundle deal (when on).

   The hero's text and photo, and the section titles below it, are edited
   in the admin's "Main page edits" (page content `hero` and `home`).
   Empty fields there fall back to these built-in defaults — keep them in
   sync with the admin's DEFAULTS. */

export const HERO_DEFAULTS = {
  badge: "Koi Fish Series",
  heading: "Built for the ring. Made to last.",
  body: "Hand-finished Muay Thai shorts with a four-way stretch panel and a waistband that stays put through every round.",
  primaryLabel: "About us",
  image: "",
};

export const HOME_DEFAULTS = {
  latestTitle: "Latest release",
  productsTitle: "Products",
  saleTitle: "On sale",
  saleBadge: "UP TO 30% OFF",
  saleNote: "End of season — while stock lasts.",
};

export default function Store() {
  useEffect(() => {
    track("store_view");
  }, []);
  const { products } = useProducts();
  const { money } = useCurrency();
  const [productsOpen, setProductsOpen] = useState(true);

  /* Page content, not tied to any product — a product's photo should
     never end up in the hero. */
  const hero = usePageSection("hero", HERO_DEFAULTS);
  const home = usePageSection("home", HOME_DEFAULTS);

  /* The API only returns live products; the filter stays as a guard. */
  const live = useMemo(
    () => products.filter((p) => p.status === "live"),
    [products]
  );

  const onSale = useMemo(
    () => live.filter((p) => p.comparePrice && p.comparePrice > p.price),
    [live]
  );

  /* "Latest release": the two newest live products (newest first). */
  const latest = useMemo(
    () =>
      [...live]
        .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")) || b.id - a.id)
        .slice(0, 2),
    [live]
  );

  return (
    // Light grey page background below the hero (the hero fades into it).
    <div style={{ background: "var(--surface-grey)" }}>
      {/* ---------- HERO ---------- */}
      {/* Split down the middle of the page: text centred in the left half,
          photo filling the right half edge to edge. Stacks on narrow screens. */}
      <section
        style={{
          minHeight: 520,
          background: "var(--surface-grey)",
          display: "flex",
          flexWrap: "wrap",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: "1 1 50%",
            minWidth: 320,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
          }}
        >
          <div style={{ maxWidth: 480 }}>
          <span
            style={{
              display: "inline-block",
              background: "var(--brand-gradient)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              padding: "6px 14px",
              borderRadius: "var(--radius)",
              marginBottom: 22,
            }}
          >
            {hero.badge}
          </span>
          <h1 className="h1" style={{ marginBottom: 20 }}>
            {hero.heading}
          </h1>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: "var(--ink-soft)",
              maxWidth: 400,
              marginBottom: 32,
            }}
          >
            {hero.body}
          </p>
          <Link to="/about" className="btn btn--grad">
            {hero.primaryLabel}
          </Link>
          </div>
        </div>

        <div
          style={{
            flex: "1 1 50%",
            minWidth: 320,
            minHeight: 520,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {hero.image ? (
            <img
              src={hero.image}
              alt=""
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <ShortsIcon size={360} color="#DCDCD7" stroke={1.1} />
          )}
        </div>
      </section>

      {/* ---------- LATEST RELEASE ---------- */}
      {/* The two newest products, side by side (one on its own is centred at
          the same size). Older ones are in the full grid below. */}
      {latest.length > 0 && (
        <section id="latest" className="page latest">
          <h2 className="latest__title">{home.latestTitle}</h2>
          <div className="latest__grid">
            {latest.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ---------- ALL PRODUCTS ---------- */}
      {/* "Products" title like "Latest release"; click it to collapse or
          expand the grid (starts open). Hidden until there are 2+ products. */}
      {live.length >= 2 && (
        <section id="new" className="page products">
          <h2 className="latest__title">
            <button
              type="button"
              className="products__toggle"
              aria-expanded={productsOpen}
              aria-controls="products-grid"
              onClick={() => setProductsOpen((o) => !o)}
            >
              {home.productsTitle}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </h2>
          <div id="products-grid" className={`products__collapse${productsOpen ? " is-open" : ""}`}>
            <div className="products__inner" inert={productsOpen ? undefined : ""}>
              <div className="grid grid--3">
                {live.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ---------- ON SALE ---------- */}
      {onSale.length > 0 && (
        <section
          id="sale"
          style={{
            marginTop: 72,
            background: "var(--surface-soft)",
            paddingBlock: 56,
          }}
        >
          <div className="page">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <h2 className="h2">{home.saleTitle}</h2>
              <span
                style={{
                  background: "var(--brand-gradient)",
                  color: "#fff",
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  padding: "5px 11px",
                  borderRadius: "var(--radius)",
                }}
              >
                {home.saleBadge}
              </span>
            </div>
            <p className="muted" style={{ marginBottom: 26 }}>
              {home.saleNote}
            </p>

            <div className="grid grid--3">
              {onSale.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- BUNDLE ---------- */}
      {/* Hidden while the bundle deal is switched off (CartContext). */}
      {BUNDLE_DEAL_ENABLED && (
      <section className="page" style={{ paddingBottom: 76 }}>
        <div
          style={{
            background: "var(--brand-gradient)",
            borderRadius: "var(--radius-lg)",
            padding: "38px 44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 28,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.85)",
                marginBottom: 10,
              }}
            >
              BUNDLE DEAL
            </div>
            <h3
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "-0.02em",
                marginBottom: 6,
              }}
            >
              Any two pairs — save {money(30)}
            </h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.9)" }}>
              Mix any colours or sizes. Applied automatically in your cart.
            </p>
          </div>
          <a
            href="#new"
            className="btn"
            style={{ background: "#fff", color: "var(--ink)", whiteSpace: "nowrap" }}
          >
            Build your bundle
          </a>
        </div>
      </section>
      )}

    </div>
  );
}
