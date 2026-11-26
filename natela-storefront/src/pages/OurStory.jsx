import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { STORY } from "../data/storyStacks";

/* /our-story — the "about us" page. Reached from the homepage hero's
   "Our story" button, the footer, and the intro screen's pill.

   The photos slide slowly left → right across the whole background on a
   loop; the story sits on a frosted panel in front so it stays readable. */

// Two copies back to back: the strip slides one copy's width, then
// restarts invisibly on the second, so the loop has no seam.
const strip = [...STORY.photos, ...STORY.photos];

// How long the photos keep sliding after the last scroll.
const IDLE_MS = 900;

export default function OurStory() {
  const pageRef = useRef(null);

  // Land at the top, not wherever the previous page was scrolled to.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  /* The photo strip only slides while the visitor is scrolling; it pauses
     where it is once they stop. Toggles a class directly (no re-render on
     every scroll event). */
  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    let timer;
    const wake = () => {
      page.classList.add("is-moving");
      clearTimeout(timer);
      timer = setTimeout(() => page.classList.remove("is-moving"), IDLE_MS);
    };
    // Scrolling only. "wheel" and "touchmove" count too, so it still
    // responds when the page is short enough that it can't actually scroll.
    const events = ["scroll", "wheel", "touchmove"];
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, wake));
      clearTimeout(timer);
    };
  }, []);

  return (
    <section className="story-page" ref={pageRef}>
      <div className="story-page__marquee" aria-hidden="true">
        <div className="story-page__track">
          {strip.map((src, i) => (
            <img key={i} src={src} alt="" />
          ))}
        </div>
      </div>

      <article className="story-page__panel">
        <h1 className="story-page__title">{STORY.title}</h1>
        <h2>{STORY.heading}</h2>
        {STORY.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <p className="story-page__closing">{STORY.closing}</p>
        <Link to="/" className="btn btn--grad story-page__cta">
          Join our fight card
        </Link>
      </article>
    </section>
  );
}
