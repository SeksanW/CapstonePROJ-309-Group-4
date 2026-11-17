import { useState, useMemo } from "react";
import { useProducts } from "../context/ProductsContext";
import { money } from "../context/CartContext";
import { sports, helpLinks, lookbook } from "../data/products";
import ProductCard from "../components/ProductCard";

/* SCRUM-8 — Store page.
   The main page: hero, shop by sport, product grid, campaign band,
   sale row, collection story, lookbook, bundle deal, help links.

   Rebuilt around the client's photography. The pictures carry the
   page now, so the drawn placeholders are gone and the chrome gets
   out of the way. Photos are in public/images/natela/. */

export default function Store() {
  const { products, loading, error } = useProducts();
  const [sportFilter, setSportFilter] = useState(null);

  /* The API only returns live products; the filter stays as a guard. */
  const live = useMemo(
    () => products.filter((p) => p.status === "live"),
    [products]
  );

  const visible = useMemo(
    () => (sportFilter ? live.filter((p) => p.sport === sportFilter) : live),
    [live, sportFilter]
  );

  const onSale = useMemo(
    () => live.filter((p) => p.comparePrice && p.comparePrice > p.price),
    [live]
  );

  const countBySport = (name) => live.filter((p) => p.sport === name).length;

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="hero">
        <div className="hero__copy">
          <span className="hero__eyebrow">THE KOI COLLECTION</span>
          <h1 className="hero__title">
            Built for
            <br />
            the ring.
          </h1>
          <p className="hero__sub">
            Hand-painted koi on satin-finish white. Made in Calgary, shipped
            worldwide, built to take a beating.
          </p>
          <div className="hero__actions">
            <a href="#new" className="btn btn--grad">
              Shop the collection
            </a>
            <a href="#lookbook" className="btn btn--outline">
              See the lookbook
            </a>
          </div>
        </div>
        <div className="hero__media">
          <img
            src="/images/natela/hero.jpg"
            alt="Two athletes in Natela Fit koi shorts on an outdoor court"
            fetchpriority="high"
          />
        </div>
      </section>

      {/* ---------- SHOP BY SPORT ---------- */}
      <section id="sports" className="page" style={{ paddingTop: 72 }}>
        <div className="row-between" style={{ marginBottom: 26 }}>
          <h2 className="h2">Shop by sport</h2>
          {sportFilter && (
            <button className="btn btn--quiet" onClick={() => setSportFilter(null)}>
              Clear filter
            </button>
          )}
        </div>

        <div className="chips">
          <button
            className={`chip${sportFilter === null ? " chip--on" : ""}`}
            onClick={() => setSportFilter(null)}
          >
            All
          </button>
          {sports.map((s) => (
            <button
              key={s.slug}
              className={`chip${sportFilter === s.name ? " chip--on" : ""}`}
              onClick={() => setSportFilter(sportFilter === s.name ? null : s.name)}
            >
              {s.name}
              <span className="chip__count">{countBySport(s.name)}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ---------- PRODUCT GRID ---------- */}
      <section id="new" className="page" style={{ paddingTop: 40, paddingBottom: 72 }}>
        <div className="row-between" style={{ marginBottom: 26 }}>
          <h2 className="h2">
            {sportFilter ? `${sportFilter}` : "The collection"}
          </h2>
          {!loading && !error && (
            <span className="muted">
              {visible.length} {visible.length === 1 ? "piece" : "pieces"}
            </span>
          )}
        </div>

        {loading ? (
          <div className="empty panel">
            <p style={{ fontWeight: 500 }}>Loading products…</p>
          </div>
        ) : error ? (
          <div className="empty panel">
            <p style={{ fontWeight: 500, marginBottom: 6 }}>
              Couldn't load products
            </p>
            <p style={{ fontSize: 13.5 }}>
              Check your connection and{" "}
              <button
                className="btn btn--quiet"
                style={{ marginLeft: 6 }}
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="empty panel">
            <p style={{ fontWeight: 500, marginBottom: 6 }}>Nothing here yet</p>
            <p style={{ fontSize: 13.5 }}>
              No products in this category.{" "}
              <button
                className="btn btn--quiet"
                style={{ marginLeft: 6 }}
                onClick={() => setSportFilter(null)}
              >
                Show everything
              </button>
            </p>
          </div>
        ) : (
          <div className="grid grid--4">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* ---------- CAMPAIGN BAND ---------- */}
      <section className="band">
        <img
          src="/images/natela/action-wide.jpg"
          alt="Pad work in Natela Fit kit, downtown Calgary"
          loading="lazy"
        />
        <div className="band__overlay">
          <p className="band__quote">
            Light, brightness
            <br />
            and hope.
          </p>
          <p className="band__attr">Natela — from the Aramaic</p>
        </div>
      </section>

      {/* ---------- ON SALE ---------- */}
      {onSale.length > 0 && (
        <section
          id="sale"
          style={{ background: "var(--surface-soft)", paddingBlock: 56 }}
        >
          <div className="page">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
              }}
            >
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

      {/* ---------- COLLECTION STORY ---------- */}
      <section id="collection" className="page section">
        <div className="story">
          <div className="story__media">
            <img
              src="/images/natela/story-wide.jpg"
              alt="Natela Fit kit against a graffiti wall in Calgary"
              loading="lazy"
            />
          </div>
          <div className="story__copy">
            <span className="eyebrow">THE COLLECTION</span>
            <h2 className="story__title">Shot where we train.</h2>
            <p className="story__text">
              Natela takes its name from the Aramaic word for light. Every piece
              in the koi series was photographed on the rooftops, courts and turf
              we actually use — no studio, no stand-ins. The print is
              hand-painted, so no two pairs sit exactly the same.
            </p>
            <a href="#new" className="btn btn--dark">
              Explore the series
            </a>
          </div>
        </div>
      </section>

      {/* ---------- LOOKBOOK ---------- */}
      <section id="lookbook" className="page section">
        <div className="row-between" style={{ marginBottom: 26 }}>
          <h2 className="h2">Lookbook</h2>
          <a href="#new" className="link-underline">
            Shop the looks
          </a>
        </div>
        <div className="lookbook">
          {lookbook.map((shot) => (
            <figure className="look" key={shot.src}>
              <img src={shot.src} alt={shot.alt} loading="lazy" />
            </figure>
          ))}
        </div>
      </section>

      {/* ---------- BUNDLE ---------- */}
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
              Any two pieces — save {money(30)}
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
            Build your kit
          </a>
        </div>
      </section>

      {/* ---------- HELP ---------- */}
      <section id="help" className="page" style={{ paddingBottom: 72 }}>
        <div className="grid grid--4" style={{ gap: 20 }}>
          {helpLinks.map((h) => (
            <a
              key={h.title}
              href="#help"
              className="panel"
              style={{ padding: 22, display: "block" }}
            >
              <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 5 }}>
                {h.title}
              </div>
              <div
                style={{ fontSize: 12.5, color: "var(--ink-muted)", lineHeight: 1.5 }}
              >
                {h.sub}
              </div>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
