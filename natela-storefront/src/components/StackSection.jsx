import { useEffect, useRef, useState } from "react";

/* The bubble reveal-on-scroll treatment for the Store page's inline "Our
   story" and "Design" sections. A stack's heading is optional — some
   bubbles are just images and body copy. */

const CONTENT_DELAY_MS = 500;

function Bubble({ stack }) {
  const ref = useRef(null);
  const [headingVisible, setHeadingVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    let timer;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setHeadingVisible(true);
        timer = setTimeout(() => setContentVisible(true), CONTENT_DELAY_MS);
      },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return (
    <div ref={ref} className="story-bubble">
      {stack.heading && (
        <h3 className={`story-bubble__heading story-reveal${headingVisible ? " story-reveal--visible" : ""}`}>
          {stack.heading}
        </h3>
      )}

      <div
        className={`story-bubble__body story-reveal${contentVisible ? " story-reveal--visible" : ""}${
          stack.imageLayout === "side" ? " story-bubble__body--side" : ""
        }`}
        style={!stack.heading ? { marginTop: 0 } : undefined}
      >
        <div className={`story-stage__images story-stage__images--${stack.images.length}`}>
          {stack.images.map((src) => (
            <img key={src} src={src} alt="" />
          ))}
        </div>
        <p className="story-stage__body">{stack.body}</p>
      </div>
    </div>
  );
}

export default function StackSection({ id, stacks }) {
  return (
    <section
      id={id}
      className="page"
      style={{ paddingBlock: 76, display: "flex", flexDirection: "column", gap: 28 }}
    >
      {stacks.map((stack, i) => (
        <Bubble key={i} stack={stack} />
      ))}
    </section>
  );
}
