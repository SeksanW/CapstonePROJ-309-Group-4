import { useEffect, useRef, useState } from "react";

/* The "Our story" popup: a card-based slideshow, one card on screen at a
   time, advanced by scroll/swipe/arrow keys — not a scrollable page. Each
   "stack" is a heading card (which clears on its own) followed by a
   content card that builds in two steps (image on the left, then the text
   beside it). The koi fabric print lives outside the card, flanking it
   over the dimmed page behind — not part of the card itself. Copy and
   image order are fixed brand content, not admin-editable like the
   hero/collection banners. */

const KOI = "/images/story/koi-fabric.jpg";
const TRANSITION_MS = 320;
const BUILD_DELAY_MS = 450;

const CARDS = [
  { type: "heading", text: "Serving to unleash the everyday warrior in you" },
  {
    type: "content",
    images: ["/images/story/story-01.jpg"],
    body: `We, Natalia & Elissa are not building a community - we are part of one. As women who fell in love with the sport, we love everything Muay Thai represents - the strength, discipline, confidence, resilience and community. But when it came to fighter apparel, something was missing.`,
  },
  { type: "heading", text: "360 WARRIOR" },
  {
    type: "content",
    images: ["/images/story/story-02.jpg", "/images/story/story-03.jpg"],
    body: `We wanted shorts that celebrated and nurtured both sides of us: strong and feminine, powerful and artistic, graceful and fierce. We wanted apparel that acknowledges everyday internal and external battles we face.`,
  },
  { type: "heading", text: "We serve to unleash the everyday warrior in you!" },
  {
    type: "content",
    images: ["/images/story/story-04.jpg", "/images/story/story-05.jpg", "/images/story/story-06.jpg"],
    body: `Our vision became a women's Muay Thai brand built around thoughtful fits, beautiful materials, and original artwork. Instead of treating shorts as just another piece of training gear, we wanted each design to feel like wearable art and a badge of honour - inside and outside the ring!`,
  },
  { type: "closing", text: "We serve to unleash the everyday warrior in you!" },
];

export default function StoryModal({ onClose }) {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [built, setBuilt] = useState(false); // content/closing cards' second reveal step
  const busyRef = useRef(false);
  const touchStartY = useRef(null);

  function go(next) {
    if (busyRef.current || next < 0 || next >= CARDS.length || next === index) return;
    busyRef.current = true;
    setFading(true);
    setTimeout(() => {
      setIndex(next);
      setBuilt(false);
      setFading(false);
      busyRef.current = false;
    }, TRANSITION_MS);
  }

  /* The image (or heading, for the closing card) appears first; this
     brings in the second part — body text, or the CTA button — shortly
     after, same staged feel as the loading screen. */
  useEffect(() => {
    if (CARDS[index].type === "heading") return;
    const t = setTimeout(() => setBuilt(true), BUILD_DELAY_MS);
    return () => clearTimeout(t);
  }, [index]);

  useEffect(() => {
    function onWheel(e) {
      if (e.deltaY > 25) go(index + 1);
      else if (e.deltaY < -25) go(index - 1);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") return onClose();
      if (["ArrowDown", "PageDown", " "].includes(e.key)) go(index + 1);
      if (["ArrowUp", "PageUp"].includes(e.key)) go(index - 1);
    }
    function onTouchStart(e) {
      touchStartY.current = e.touches[0].clientY;
    }
    function onTouchEnd(e) {
      if (touchStartY.current == null) return;
      const delta = touchStartY.current - e.changedTouches[0].clientY;
      if (delta > 40) go(index + 1);
      else if (delta < -40) go(index - 1);
      touchStartY.current = null;
    }
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  const card = CARDS[index];
  const centered = card.type === "heading" || card.type === "closing";

  return (
    <div className="story-overlay" onClick={onClose}>
      <div className="story-overlay__koi story-overlay__koi--left" style={{ backgroundImage: `url(${KOI})` }} />
      <div className="story-overlay__koi story-overlay__koi--right" style={{ backgroundImage: `url(${KOI})` }} />

      <div
        className={`story-card${centered ? " story-card--center" : ""}${fading ? " story-card--fading" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Our story"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="content-modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {card.type === "heading" && <h2 className="story-stage__heading story-stage__heading--hero">{card.text}</h2>}

        {card.type === "content" && (
          <div className="story-card__content">
            <div className={`story-card__media story-reveal${built ? " story-reveal--visible" : ""}`}>
              {card.images.map((src) => (
                <img key={src} src={src} alt="" />
              ))}
            </div>
            <p className={`story-stage__body story-reveal${built ? " story-reveal--visible" : ""}`}>{card.body}</p>
          </div>
        )}

        {card.type === "closing" && (
          <>
            <h2 className="story-stage__heading story-stage__heading--hero">{card.text}</h2>
            <button
              type="button"
              className={`btn btn--grad story-stage__cta story-reveal${built ? " story-reveal--visible" : ""}`}
              onClick={onClose}
            >
              Join our fight card
            </button>
          </>
        )}

        <div className="story-card__dots">
          {CARDS.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to card ${i + 1}`}
              className={`story-card__dot${i === index ? " story-card__dot--active" : ""}`}
              onClick={() => go(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
