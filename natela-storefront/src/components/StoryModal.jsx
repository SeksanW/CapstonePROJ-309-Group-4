import { useEffect, useRef, useState } from "react";

/* The "Our story" popup: a short scrollytelling sequence (not the simple
   single-blurb ContentModal used for "Design & process") — framed by the
   koi fabric print sticking to both sides of the scroll column. Each
   stage reveals its own parts one at a time as it's scrolled to (heading,
   then image, then body text) — the same staged-reveal feel as the
   loading screen, rather than a single fade for the whole block. Copy and
   image order are fixed brand content, not admin-editable like the
   hero/collection banners. */

const KOI = "/images/story/koi-fabric.jpg";
const REVEAL_STEP_MS = 400;

const STAGES = [
  { kind: "hero", parts: [{ type: "heading", text: "Serving to unleash the everyday warrior in you" }] },
  {
    kind: "text",
    parts: [
      { type: "images", srcs: ["/images/story/story-01.jpg"] },
      {
        type: "body",
        text: `We, Natalia & Elissa are not building a community - we are part of one. As women who fell in love with the sport, we love everything Muay Thai represents - the strength, discipline, confidence, resilience and community. But when it came to fighter apparel, something was missing.`,
      },
    ],
  },
  {
    kind: "text",
    parts: [
      { type: "eyebrow", text: "360 WARRIOR" },
      { type: "images", srcs: ["/images/story/story-02.jpg", "/images/story/story-03.jpg"] },
      {
        type: "body",
        text: `We wanted shorts that celebrated and nurtured both sides of us: strong and feminine, powerful and artistic, graceful and fierce. We wanted apparel that acknowledges everyday internal and external battles we face.`,
      },
    ],
  },
  {
    kind: "text",
    parts: [
      { type: "eyebrow", text: "We serve to unleash the everyday warrior in you!" },
      { type: "images", srcs: ["/images/story/story-04.jpg", "/images/story/story-05.jpg", "/images/story/story-06.jpg"] },
      {
        type: "body",
        text: `Our vision became a women's Muay Thai brand built around thoughtful fits, beautiful materials, and original artwork. Instead of treating shorts as just another piece of training gear, we wanted each design to feel like wearable art and a badge of honour - inside and outside the ring!`,
      },
    ],
  },
  {
    kind: "closing",
    parts: [
      { type: "heading", text: "We serve to unleash the everyday warrior in you!" },
      { type: "cta" },
    ],
  },
];

function Part({ part, onClose }) {
  switch (part.type) {
    case "heading":
      return <h2 className="story-stage__heading story-stage__heading--hero">{part.text}</h2>;
    case "eyebrow":
      return <div className="eyebrow story-stage__eyebrow">{part.text}</div>;
    case "body":
      return <p className="story-stage__body">{part.text}</p>;
    case "images":
      return (
        <div className={`story-stage__images story-stage__images--${part.srcs.length}`}>
          {part.srcs.map((src) => (
            <img key={src} src={src} alt="" />
          ))}
        </div>
      );
    case "cta":
      return (
        <button type="button" className="btn btn--grad story-stage__cta" onClick={onClose}>
          Join our fight card
        </button>
      );
    default:
      return null;
  }
}

/* Reveals `parts` one at a time, starting once the stage scrolls into
   view within `rootRef`'s scroll container. */
function RevealStage({ parts, rootRef, className = "", onClose }) {
  const ref = useRef(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!ref.current || !rootRef.current) return;
    let timers = [];
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        timers = parts.map((_, i) =>
          setTimeout(() => setStep((s) => Math.max(s, i + 1)), i * REVEAL_STEP_MS + 80)
        );
      },
      { root: rootRef.current, threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
    // `parts` is a stable literal from STAGES, not re-created per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootRef]);

  return (
    <div ref={ref} className={`story-stage ${className}`}>
      {parts.map((part, i) => (
        <div key={i} className={`story-reveal${step > i ? " story-reveal--visible" : ""}`}>
          <Part part={part} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}

export default function StoryModal({ onClose }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className="content-modal__overlay" onClick={onClose}>
      <div className="story-modal" role="dialog" aria-modal="true" aria-label="Our story" onClick={(e) => e.stopPropagation()}>
        <button className="content-modal__close story-modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="story-modal__scroll" ref={scrollRef}>
          <div className="story-modal__grid">
            <div className="story-modal__side story-modal__side--left" style={{ backgroundImage: `url(${KOI})` }} />

            <div className="story-modal__content">
              {STAGES.map((stage, i) => (
                <RevealStage
                  key={i}
                  parts={stage.parts}
                  rootRef={scrollRef}
                  onClose={onClose}
                  className={stage.kind === "hero" || stage.kind === "closing" ? "story-stage--hero" : ""}
                />
              ))}
            </div>

            <div className="story-modal__side story-modal__side--right" style={{ backgroundImage: `url(${KOI})` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
