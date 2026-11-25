import { useEffect, useRef, useState } from "react";

/* Shared engine behind the "Our story" and "Design" popups: a continuous,
   freely-scrollable feed of bubbles (no slideshow, no scroll-snapping) —
   think slot-machine reel, not a card deck. Each bubble's heading appears
   as soon as it scrolls into view and stays there; its image(s) and body
   text fade in shortly after, also staying — nothing already shown is
   ever removed. The koi fabric print lives outside the panel, flanking it
   over the dimmed page behind. Copy and image order are fixed brand
   content, not admin-editable like the hero/collection banners. */

const KOI = "/images/story/koi-fabric.jpg";
const CONTENT_DELAY_MS = 500;

function Bubble({ stack, rootRef, onClose, onStore }) {
  const ref = useRef(null);
  const [headingVisible, setHeadingVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    if (!ref.current || !rootRef.current) return;
    let timer;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setHeadingVisible(true);
        timer = setTimeout(() => setContentVisible(true), CONTENT_DELAY_MS);
      },
      { root: rootRef.current, threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [rootRef]);

  return (
    <div ref={ref} className="story-bubble">
      <h3 className={`story-bubble__heading story-reveal${headingVisible ? " story-reveal--visible" : ""}`}>
        {stack.heading}
      </h3>

      {stack.closing ? (
        <>
          <button
            type="button"
            className={`btn btn--grad story-stage__cta story-reveal${contentVisible ? " story-reveal--visible" : ""}`}
            onClick={onClose}
          >
            Join our fight card
          </button>
          <button
            type="button"
            className={`story-store-link story-reveal${contentVisible ? " story-reveal--visible" : ""}`}
            onClick={onStore}
          >
            Store
          </button>
        </>
      ) : (
        <div
          className={`story-bubble__body story-reveal${contentVisible ? " story-reveal--visible" : ""}${
            stack.imageLayout === "side" ? " story-bubble__body--side" : ""
          }`}
        >
          <div className={`story-stage__images story-stage__images--${stack.images.length}`}>
            {stack.images.map((src) => (
              <img key={src} src={src} alt="" />
            ))}
          </div>
          <p className="story-stage__body">{stack.body}</p>
        </div>
      )}
    </div>
  );
}

export default function BubblePopup({ stacks, label, onClose, onStore = onClose }) {
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
    <div className="story-overlay" onClick={onClose}>
      <div className="story-overlay__koi story-overlay__koi--left" style={{ backgroundImage: `url(${KOI})` }} />
      <div className="story-overlay__koi story-overlay__koi--right" style={{ backgroundImage: `url(${KOI})` }} />

      <div className="story-panel" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        <button className="content-modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="story-panel__scroll" ref={scrollRef}>
          <div className="story-panel__content">
            {stacks.map((stack, i) => (
              <Bubble key={i} stack={stack} rootRef={scrollRef} onClose={onClose} onStore={onStore} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
