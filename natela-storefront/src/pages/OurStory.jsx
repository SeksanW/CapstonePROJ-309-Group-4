import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { STORY } from "../data/storyStacks";
import DesignModal from "../components/DesignModal";
import KoiTransition from "../components/KoiTransition";

/* /our-story — the "about us" page. Reached from the homepage hero's
   "Our story" button, the footer, and the intro screen's pill.

   A still row of photos fills the background; the story sits on a frosted
   panel in front so it stays readable. */

export default function OurStory() {
  const [designOpen, setDesignOpen] = useState(false);
  const [koiPlaying, setKoiPlaying] = useState(false);

  // Land at the top, not wherever the previous page was scrolled to.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section className="story-page">
      <div className="story-page__marquee" aria-hidden="true">
        <div className="story-page__track">
          {STORY.photos.map((src) => (
            <img key={src} src={src} alt="" />
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
        <div className="story-page__actions">
          <Link to="/" className="btn btn--grad">
            Join our fight card
          </Link>
          {/* Koi transition first, then the same "Design" popup as the
              homepage hero and footer. */}
          <button type="button" className="btn btn--outline" onClick={() => setKoiPlaying(true)}>
            Design
          </button>
        </div>
      </article>

      {designOpen && <DesignModal onClose={() => setDesignOpen(false)} />}
      {koiPlaying && (
        <KoiTransition onReveal={() => setDesignOpen(true)} onDone={() => setKoiPlaying(false)} />
      )}
    </section>
  );
}
