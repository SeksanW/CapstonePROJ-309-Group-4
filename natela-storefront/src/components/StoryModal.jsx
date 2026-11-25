import { useEffect, useRef, useState } from "react";

/* The "Our story" popup: a short scrollytelling sequence (not the simple
   single-blurb ContentModal used for "Design & process") — each stage
   fades in as it's scrolled to, framed by the koi fabric print sticking to
   both sides of the scroll column. Copy and image order are fixed brand
   content, not admin-editable like the hero/collection banners. */

const KOI = "/images/story/koi-fabric.jpg";

const STAGES = [
  { kind: "hero", heading: "Serving to unleash the everyday warrior in you" },
  {
    kind: "text",
    body: `We, Natalia & Elissa are not building a community - we are part of one. As women who fell in love with the sport, we love everything Muay Thai represents - the strength, discipline, confidence, resilience and community. But when it came to fighter apparel, something was missing.`,
    images: ["/images/story/story-01.jpg"],
  },
  {
    kind: "text",
    eyebrow: "360 WARRIOR",
    body: `We wanted shorts that celebrated and nurtured both sides of us: strong and feminine, powerful and artistic, graceful and fierce. We wanted apparel that acknowledges everyday internal and external battles we face.`,
    images: ["/images/story/story-02.jpg", "/images/story/story-03.jpg"],
  },
  {
    kind: "text",
    eyebrow: "We serve to unleash the everyday warrior in you!",
    body: `Our vision became a women's Muay Thai brand built around thoughtful fits, beautiful materials, and original artwork. Instead of treating shorts as just another piece of training gear, we wanted each design to feel like wearable art and a badge of honour - inside and outside the ring!`,
    images: ["/images/story/story-04.jpg", "/images/story/story-05.jpg", "/images/story/story-06.jpg"],
  },
  { kind: "closing", heading: "We serve to unleash the everyday warrior in you!" },
];

function FadeStage({ children, rootRef, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current || !rootRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { root: rootRef.current, threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [rootRef]);

  return (
    <div ref={ref} className={`story-stage${visible ? " story-stage--visible" : ""} ${className}`}>
      {children}
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
                <FadeStage
                  key={i}
                  rootRef={scrollRef}
                  className={stage.kind === "hero" || stage.kind === "closing" ? "story-stage--hero" : ""}
                >
                  {(stage.kind === "hero" || stage.kind === "closing") && (
                    <h2 className="story-stage__heading story-stage__heading--hero">{stage.heading}</h2>
                  )}

                  {stage.kind === "text" && (
                    <>
                      {stage.eyebrow && <div className="eyebrow story-stage__eyebrow">{stage.eyebrow}</div>}
                      <p className="story-stage__body">{stage.body}</p>
                      <div className={`story-stage__images story-stage__images--${stage.images.length}`}>
                        {stage.images.map((src) => (
                          <img key={src} src={src} alt="" />
                        ))}
                      </div>
                    </>
                  )}

                  {stage.kind === "closing" && (
                    <button type="button" className="btn btn--grad story-stage__cta" onClick={onClose}>
                      Join our fight card
                    </button>
                  )}
                </FadeStage>
              ))}
            </div>

            <div className="story-modal__side story-modal__side--right" style={{ backgroundImage: `url(${KOI})` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
