import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../context/ProductsContext";
import { usePageContent } from "../context/PageContentContext";
import { useCurrency } from "../context/CurrencyContext";
import { BUNDLE_DEAL_ENABLED } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import ShortsIcon from "../components/ShortsIcon";

/* SCRUM-8 — Store page.
   The main page: hero, product grid, sale row, bundle deal (when on). */

export default function Store() {
  const { products } = useProducts();
  const { content } = usePageContent();
  const { money } = useCurrency();
  const [productsOpen, setProductsOpen] = useState(true);

  /* The hero section is edited through the admin's "Main
     page edits" screen (GET /page-content) — not tied to any product, so
     a product's photo should never end up here. */
  const hero = content.hero ?? {};

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
      {/* Just the hero photo, full width. No text or buttons — "Our story"
          and "Design" live in the header menu and the footer. */}
      <section
        style={{
          position: "relative",
          // Fills the first screen under the announcement bar and header.
          height: "calc(100vh - var(--topbar-h) - var(--header-h))",
          minHeight: 520,
          background: "var(--surface-grey)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {hero.image ? (
          <img
            src={hero.image}
            alt=""
            style={{
              /* Hard top edge: the banner always starts at a fixed line on
                 the photo (34.7% down — just above the koi, below the
                 waistband), shifted up by that much of its own height.
                 It's at least full width; on tall/narrow screens it widens
                 so the part below the line still fills the banner (the
                 1.532 is 1 / (1 - 0.347) for this square photo). Tuned for
                 the current hero photo; retune if the admin uploads
                 a different one. */
              position: "absolute",
              top: 0,
              left: "50%",
              width: "max(100%, calc(max(100vh - var(--header-h), 520px) * 1.532))",
              height: "auto",
              maxWidth: "none",
              transform: "translate(-50%, -34.7%)",
            }}
          />
        ) : (
          <ShortsIcon size={360} color="#DCDCD7" stroke={1.1} />
        )}
        {/* Fades the bottom of the photo into the light grey page below, starting
            at the koi's tail. Eased stops (slow start, fast finish) so the
            fade has no visible start line; it runs 1px past the edge so no
            seam shows against the page. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: -1,
            height: "18%",
            background:
              "linear-gradient(to bottom, rgba(244,244,241,0) 0%, rgba(244,244,241,0.04) 15%, rgba(244,244,241,0.13) 30%, rgba(244,244,241,0.28) 45%, rgba(244,244,241,0.47) 60%, rgba(244,244,241,0.69) 75%, rgba(244,244,241,0.88) 88%, var(--surface-grey) 100%)",
            pointerEvents: "none",
          }}
        />
        {/* Text in the fade at the bottom of the photo — the "Heading" and
            "Body text" from the admin's Main page edits → Hero banner.
            Leave both empty there to show nothing. */}
        {(hero.heading || hero.body) && (
          <div className="hero-caption">
            {hero.heading && <h1 className="hero-caption__heading">{hero.heading}</h1>}
            {hero.body && <p className="hero-caption__body">{hero.body}</p>}
          </div>
        )}
      </section>

      {/* ---------- LATEST RELEASE ---------- */}
      {/* The two newest products, side by side (one on its own is centred at
          the same size). Older ones are in the full grid below. */}
      {latest.length > 0 && (
        <section id="latest" className="page latest">
          <h2 className="latest__title">Latest release</h2>
          <div className="latest__grid">
            {latest.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ---------- ALL PRODUCTS ---------- */}
      {/* "Products" title like "Latest release"; click it to collapse or
          expand the grid (starts open). */}
      {live.length > 0 && (
        <section id="new" className="page products">
          <h2 className="latest__title">
            <button
              type="button"
              className="products__toggle"
              aria-expanded={productsOpen}
              aria-controls="products-grid"
              onClick={() => setProductsOpen((o) => !o)}
            >
              Products
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
              <h2 className="h2">On sale</h2>
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
                UP TO 30% OFF
              </span>
            </div>
            <p className="muted" style={{ marginBottom: 26 }}>
              End of season — while stock lasts.
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
