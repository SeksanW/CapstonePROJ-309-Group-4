import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../context/ProductsContext";
import { money } from "../context/CartContext";
import { sports, helpLinks } from "../data/products";
import ProductCard from "../components/ProductCard";
import ShortsIcon from "../components/ShortsIcon";

/* SCRUM-8 — Store page.
   The main page: hero, shop by sport, product grid, sale row,
   collection story, bundle deal, help links. */

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
      <section
        style={{
          position: "relative",
          minHeight: 520,
          background: "var(--surface-grey)",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: 80,
          }}
        >
          <ShortsIcon size={360} color="#DCDCD7" stroke={1.1} />
        </div>

        <div
          className="page"
          style={{ position: "relative", maxWidth: 600, paddingBlock: 48 }}
        >
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
            NEW — FLAME SERIES
          </span>
          <h1 className="h1" style={{ marginBottom: 20 }}>
            Built for the
            <br />
            ring. Made
            <br />
            to last.
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
            Hand-finished Muay Thai shorts with a four-way stretch panel and a
            waistband that stays put through every round.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="#new" className="btn btn--grad">
              Shop the collection
            </a>
            <a href="#help" className="btn btn--outline">
              Find your size
            </a>
          </div>
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

        <div className="grid grid--4" style={{ gap: 16 }}>
          {sports.map((s) => {
            const active = sportFilter === s.name;
            return (
              <button
                key={s.slug}
                onClick={() => setSportFilter(active ? null : s.name)}
                style={{
                  background: active ? "var(--ink)" : "#fff",
                  color: active ? "#fff" : "var(--ink)",
                  border: `1px solid ${active ? "var(--ink)" : "var(--line)"}`,
                  borderRadius: "var(--radius-lg)",
                  padding: "26px 22px",
                  minHeight: 130,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  textAlign: "left",
                  transition: "transform .2s ease, background .2s ease",
                }}
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={active ? "#fff" : "var(--brand-red)"}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 3v18M3 12h18" />
                </svg>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>
                    {s.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: active ? "rgba(255,255,255,0.7)" : "var(--ink-muted)",
                    }}
                  >
                    {countBySport(s.name)} items
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---------- PRODUCT GRID ---------- */}
      <section id="new" className="page" style={{ paddingTop: 64 }}>
        <div className="row-between" style={{ marginBottom: 26 }}>
          <h2 className="h2">
            {sportFilter ? `${sportFilter} shorts` : "New arrivals"}
          </h2>
          {!loading && !error && (
            <span className="muted">
              {visible.length} {visible.length === 1 ? "item" : "items"}
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
            <p style={{ fontWeight: 500, marginBottom: 6 }}>
              Nothing here yet
            </p>
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

      {/* ---------- COLLECTION STORY ---------- */}
      <section id="collection" className="page" style={{ paddingBlock: 76 }}>
        <div
          className="panel"
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "var(--surface-grey)",
              minHeight: 340,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShortsIcon size={150} stroke={1.3} />
          </div>
          <div
            style={{
              padding: "48px 44px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <span className="eyebrow" style={{ marginBottom: 16 }}>
              THE COLLECTION
            </span>
            <h2
              style={{
                fontSize: "1.85rem",
                fontWeight: 700,
                letterSpacing: "-0.025em",
                lineHeight: 1.12,
                marginBottom: 16,
              }}
            >
              Light, brightness
              <br />
              and hope.
            </h2>
            <p
              style={{
                fontSize: 14.5,
                lineHeight: 1.68,
                color: "var(--ink-soft)",
                marginBottom: 26,
              }}
            >
              Natela takes its name from the Aramaic word for light. Every pair
              in the Flame series carries the gradient — a reminder that the
              work happens long before the fight.
            </p>
            <a href="#new" className="btn btn--dark" style={{ alignSelf: "flex-start" }}>
              Explore the series
            </a>
          </div>
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
              <div style={{ fontSize: 12.5, color: "var(--ink-muted)", lineHeight: 1.5 }}>
                {h.sub}
              </div>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
