import { useMemo } from "react";
import { useProducts } from "../context/ProductsContext";
import { usePageContent } from "../context/PageContentContext";
import { helpLinks } from "../data/products";
import { STORY_STACKS } from "../data/storyStacks";
import { DESIGN_STACKS } from "../data/designStacks";
import ProductCard from "../components/ProductCard";
import StackSection from "../components/StackSection";
import ShortsIcon from "../components/ShortsIcon";

/* SCRUM-8 — Store page.
   The main page: hero, product grid, sale row,
   design & story sections, help links. */

export default function Store() {
  const { products } = useProducts();
  const { content } = usePageContent();

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
            <a
              href="#design"
              className="btn"
              style={{
                background: "#fff",
                color: "#000",
                border: "2px solid var(--brand-orange)",
                padding: "13px",
                fontSize: 13,
                lineHeight: 1,
              }}
            >
              {hero.primaryLabel || "Design"}
            </a>
            <a
              href="#story"
              className="btn"
              style={{
                background: "#fff",
                color: "#000",
                border: "2px solid var(--brand-orange)",
                padding: "13px",
                fontSize: 13,
                lineHeight: 1,
              }}
            >
              {hero.secondaryLabel || "Our story"}
            </a>
          </div>
        </div>
      </section>

      {/* ---------- FEATURED PRODUCT ---------- */}
      {featured && (
        <section className="page" style={{ paddingTop: 64 }}>
          <div style={{ maxWidth: 320, margin: "0 auto" }}>
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

      {/* ---------- OUR STORY ---------- */}
      <StackSection id="story" stacks={STORY_STACKS} />

      {/* ---------- DESIGN ---------- */}
      <StackSection id="design" stacks={DESIGN_STACKS} />

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
