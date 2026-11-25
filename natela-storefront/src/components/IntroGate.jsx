import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useProducts } from "../context/ProductsContext";
import { usePageContent } from "../context/PageContentContext";
import ContentModal from "./ContentModal";
import { blobPath, easeInOutCubic, frameRadii, makeBlobAngles, panelRadii } from "./introBlob";

/* ---------------------------------------------------------
   IntroGate — the first-visit homepage sequence:

     loading   flat white, "Loading" typed out, waiting on the real
               product + page-content fetches (1s floor so it never
               feels instant/janky on a fast connection)
     flowing   the white morphs (liquid journey, clean rounded-panel
               rest state) down to a centered panel, revealing a
               product photo behind it
     gate      logo + "Our story" / "Design" over the product photo;
               any scroll/touch/key advances
     exiting   fades out, then unmounts for good

   Plays once per browser (localStorage) and only when the visit starts
   on "/" — client-side navigation back to "/" later doesn't replay it.
   --------------------------------------------------------- */

const INTRO_SEEN_KEY = "natela.introSeen";
const MIN_LOADING_MS = 1000;
const FLOW_MS = 900;
const EXIT_MS = 500;
const TYPED_WORD = "Loading";

export default function IntroGate() {
  const location = useLocation();
  const { products, loading: productsLoading } = useProducts();
  const { content, loading: contentLoading } = usePageContent();

  const [active] = useState(() => {
    if (location.pathname !== "/") return false;
    try {
      return localStorage.getItem(INTRO_SEEN_KEY) !== "1";
    } catch {
      return true;
    }
  });
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
    try {
      localStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      /* Private mode or blocked storage — it'll just replay next visit. */
    }
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
      const radii = frameRadii(angles, eased, phaseOffsets.current);
      pathRef.current?.setAttribute("d", blobPath(angles, radii, 50, 50));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setPhase("gate");
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, phase, angles]);

  /* Draws the resting panel directly when there's no morph to arrive from
     (reduced motion). Harmless to also re-run after the morph — same shape. */
  useEffect(() => {
    if (!active || phase !== "gate" || !pathRef.current) return;
    pathRef.current.setAttribute("d", blobPath(angles, panelRadii(angles), 50, 50));
  }, [active, phase, angles]);

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

  const story = content.story ?? {};
  const design = content.design ?? {};

  return (
    <>
      <div className={`intro-overlay${phase === "exiting" ? " intro-overlay--exiting" : ""}`}>
        {featuredImage && (
          <div className="intro-bg" style={{ backgroundImage: `url(${featuredImage})` }} />
        )}

        {phase === "loading" ? (
          <div className="intro-flat" />
        ) : (
          <svg
            className={`intro-blob${phase === "gate" ? " intro-blob--idle" : ""}`}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
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

        {(phase === "gate" || phase === "exiting") && (
          <div className="intro-gate">
            <span className="logo" style={{ fontSize: 34, marginBottom: 22 }}>
              NATELA
            </span>
            <div className="intro-gate__links">
              <button type="button" onClick={() => setOpenModal("story")}>
                Our story
              </button>
              <button type="button" onClick={() => setOpenModal("design")}>
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

      {openModal === "story" && (
        <ContentModal
          eyebrow="OUR STORY"
          heading={story.heading || "Our story"}
          image={story.image || null}
          body={story.body || ""}
          onClose={() => setOpenModal(null)}
        />
      )}
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
