import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useProducts } from "../context/ProductsContext";
import { usePageContent } from "../context/PageContentContext";
import ContentModal from "./ContentModal";
import StoryModal from "./StoryModal";
import { blobPath, easeInOutCubic, frameRadii, makeBlobAngles } from "./introBlob";

/* ---------------------------------------------------------
   IntroGate — the homepage sequence, on every load of "/":

     loading   flat white, "Loading" typed out, waiting on the real
               product + page-content fetches (1s floor so it never
               feels instant/janky on a fast connection)
     flowing   the white morphs (liquid journey) down toward a wide,
               short pill shape, revealing a product photo behind it
     gate      a frosted-glass pill bar — "Our story" / logo / "Design"
               — over the product photo; any scroll/touch/key advances
     exiting   fades out, then unmounts for good

   Only runs when the visit starts on "/" — client-side navigation back
   to "/" later (without a reload) doesn't replay it. */

const MIN_LOADING_MS = 1000;
const FLOW_MS = 900;
const EXIT_MS = 500;
const TYPED_WORD = "Loading";

/* The pill's on-screen size — used both for the real CSS pill at rest and
   (converted to viewBox units) as the liquid morph's target shape, so the
   handoff between the two is seamless. */
function pillPixelSize() {
  return {
    width: Math.min(Math.max(window.innerWidth * 0.58, 360), 760),
    height: Math.min(Math.max(window.innerHeight * 0.1, 62), 86),
  };
}

export default function IntroGate() {
  const location = useLocation();
  const { products, loading: productsLoading } = useProducts();
  const { content, loading: contentLoading } = usePageContent();

  const [active] = useState(() => location.pathname === "/");
  const [phase, setPhase] = useState("loading"); // loading | flowing | gate | exiting | done
  const [typedCount, setTypedCount] = useState(0);
  const [openModal, setOpenModal] = useState(null); // "story" | "design" | null

  const prefersReducedMotion = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const angles = useMemo(() => makeBlobAngles(), []);
  const phaseOffsets = useRef(angles.map(() => Math.random() * Math.PI * 2));
  const pathRef = useRef(null);
  const [minDelayDone, setMinDelayDone] = useState(false);

  // Viewport-relative pixel size, converted to viewBox units (the viewBox
  // is stretched non-uniformly to fill the screen, so x and y each need
  // their own px-per-unit factor).
  const pill = useMemo(() => pillPixelSize(), []);
  const panelRw = pill.width / 2 / (window.innerWidth / 100);
  const panelRh = pill.height / 2 / (window.innerHeight / 100);

  const dataReady = !productsLoading && !contentLoading;
  const featuredImage = products.find((p) => p.status === "live" && p.image)?.image ?? null;

  /* Minimum time the loading screen stays up, so a cached/instant fetch
     doesn't make it flash by. */
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setMinDelayDone(true), MIN_LOADING_MS);
    return () => clearTimeout(t);
  }, [active]);

  /* Types "Loading" out one letter at a time. */
  useEffect(() => {
    if (!active || phase !== "loading" || prefersReducedMotion) return;
    if (typedCount >= TYPED_WORD.length) return;
    const t = setTimeout(() => setTypedCount((n) => n + 1), 110);
    return () => clearTimeout(t);
  }, [active, phase, typedCount, prefersReducedMotion]);

  /* Advances once the real data is in AND the minimum delay has passed. */
  useEffect(() => {
    if (!active || phase !== "loading" || !dataReady || !minDelayDone) return;
    setPhase(prefersReducedMotion ? "gate" : "flowing");
  }, [active, phase, dataReady, minDelayDone, prefersReducedMotion]);

  /* The liquid morph: drives the path's `d` imperatively via rAF rather
     than React state, so it isn't re-rendering 60 times a second. */
  useEffect(() => {
    if (!active || phase !== "flowing") return;
    let raf;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / FLOW_MS);
      const eased = easeInOutCubic(t);
      const radii = frameRadii(angles, eased, phaseOffsets.current, panelRw, panelRh);
      pathRef.current?.setAttribute("d", blobPath(angles, radii, 50, 50));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setPhase("gate");
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, phase, angles, panelRw, panelRh]);

  /* Any scroll, touch or "forward" key moves past the gate screen. */
  useEffect(() => {
    if (!active || phase !== "gate") return;
    function advance() {
      setPhase("exiting");
    }
    function onWheel(e) {
      if (e.deltaY > 0) advance();
    }
    function onKeyDown(e) {
      if (["ArrowDown", "PageDown", "Enter", " "].includes(e.key)) advance();
    }
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchmove", advance, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", advance);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [active, phase]);

  /* Fades out, then unmounts for good. */
  useEffect(() => {
    if (!active || phase !== "exiting") return;
    const t = setTimeout(() => setPhase("done"), EXIT_MS);
    return () => clearTimeout(t);
  }, [active, phase]);

  /* Locks background scroll for every phase except the final one. */
  useEffect(() => {
    if (!active) return;
    if (phase === "done") {
      document.body.style.overflow = "";
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active, phase]);

  if (!active || phase === "done") return null;

  const design = content.design ?? {};
  const settled = phase === "gate" || phase === "exiting";

  return (
    <>
      <div className={`intro-overlay${phase === "exiting" ? " intro-overlay--exiting" : ""}`}>
        {featuredImage && (
          <div className="intro-bg" style={{ backgroundImage: `url(${featuredImage})` }} />
        )}

        {phase === "loading" ? (
          <div className="intro-flat" />
        ) : (
          <svg className="intro-blob" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path ref={pathRef} fill="var(--surface)" />
          </svg>
        )}

        {phase === "loading" && (
          <div className="intro-loading">
            <div className="intro-loading__row">
              <span className="intro-loading__word">
                {prefersReducedMotion ? TYPED_WORD : TYPED_WORD.slice(0, typedCount)}
              </span>
              <span className="intro-loading__cursor" aria-hidden="true" />
            </div>
          </div>
        )}

        {settled && (
          <div className="intro-gate">
            <div
              className="intro-pill"
              style={{ width: pill.width, height: pill.height }}
            >
              <button
                type="button"
                className="intro-pill__link intro-pill__link--left"
                onClick={() => setOpenModal("story")}
              >
                Our story
              </button>
              <img src="/images/natela-logo.png" alt="Natela" className="intro-pill__logo" />
              <button
                type="button"
                className="intro-pill__link intro-pill__link--right"
                onClick={() => setOpenModal("design")}
              >
                Design
              </button>
            </div>
            <div className="intro-gate__hint" aria-hidden="true">
              <span>Scroll to enter</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {openModal === "story" && <StoryModal onClose={() => setOpenModal(null)} />}
      {openModal === "design" && (
        <ContentModal
          eyebrow="DESIGN & PROCESS"
          heading={design.heading || "Design & process"}
          image={design.image || null}
          body={design.body || ""}
          onClose={() => setOpenModal(null)}
        />
      )}
    </>
  );
}
