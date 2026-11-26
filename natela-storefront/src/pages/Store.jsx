import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../context/ProductsContext";
import { usePageContent } from "../context/PageContentContext";
import ProductCard from "../components/ProductCard";
import DesignModal from "../components/DesignModal";
import ShortsIcon from "../components/ShortsIcon";

/* SCRUM-8 — Store page.
   The main page: hero, product grid, sale row, help links. */

export default function Store() {
  const { products } = useProducts();
  const { content } = usePageContent();
  const navigate = useNavigate();
  const [designOpen, setDesignOpen] = useState(false);

  /* The hero section is edited through the admin's "Main page edits"
     screen (GET /page-content) — not tied to any product, so a
     product's photo should never end up here. */
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

  /* The featured product below the hero is the only spot that's
     deliberately tied to a real product, not page content. */
  const featured = live[0] ?? null;

  return (
    <>
      {/* ---------- HERO ---------- */}
      {/* Full-bleed photo behind the copy, like a magazine cover — not a
          split layout. A bottom-up scrim keeps the overlaid text readable
          over any photo. */}
      <section
        style={{
          position: "relative",
          minHeight: "88vh",
          display: "flex",
          alignItems: "flex-end",
          overflow: "hidden",
          background: "var(--surface-grey)",
        }}
      >
        {hero.image ? (
          <img
            src={hero.image}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShortsIcon size={360} color="#DCDCD7" stroke={1.1} />
          </div>
        )}

        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0) 60%)",
          }}
        />

        <div
          className="page"
          style={{ position: "relative", maxWidth: 600, paddingBlock: 56, color: "#fff" }}
        >
          <h1 className="h1" style={{ marginBottom: 20, color: "var(--brand-orange)" }}>
            {hero.heading || "Built for the ring. Made to last."}
          </h1>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: "var(--brand-orange)",
              maxWidth: 400,
              marginBottom: 32,
            }}
          >
            {hero.body ||
              "Hand-finished Muay Thai shorts with a four-way stretch panel and a waistband that stays put through every round."}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn"
              style={{
                background: "#fff",
                color: "#000",
                border: "2px solid var(--brand-orange)",
                padding: "13px",
                fontSize: 13,
                lineHeight: 1,
              }}
              onClick={() => setDesignOpen(true)}
            >
              {hero.primaryLabel || "Design"}
            </button>
            <button
              type="button"
              className="btn"
              style={{
                background: "#fff",
                color: "#000",
                border: "2px solid var(--brand-orange)",
                padding: "13px",
                fontSize: 13,
                lineHeight: 1,
              }}
              onClick={() => navigate("/our-story")}
            >
              {hero.secondaryLabel || "Our story"}
            </button>
          </div>
        </div>
      </section>

      {/* ---------- FEATURED PRODUCT ---------- */}
      {featured && (
        <section
          className="page"
          style={{ paddingBlock: 64, position: "relative", background: "#E6F2FB" }}
        >
          <div
            className="featured-card"
            style={{ maxWidth: 640, margin: "0 auto", position: "relative", zIndex: 1 }}
          >
            <ProductCard product={featured} />
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

      {designOpen && <DesignModal onClose={() => setDesignOpen(false)} />}
    </>
  );
}
