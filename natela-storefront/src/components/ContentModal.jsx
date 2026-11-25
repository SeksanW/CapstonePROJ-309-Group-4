import { useEffect } from "react";

/* A scrollable popup for long-form page content ("Our story", "Design &
   process") edited from the admin's "Main page edits" screen. Shared by
   both so there's one place that knows how to lay this out. */

export default function ContentModal({ eyebrow, heading, image, body, onClose }) {
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

  const paragraphs = (body || "").split(/\n{2,}/).filter(Boolean);

  return (
    <div className="content-modal__overlay" onClick={onClose}>
      <div
        className="content-modal"
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="content-modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>
        {image && <img src={image} alt="" className="content-modal__image" />}
        <div className="content-modal__body">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2 className="h2" style={{ marginTop: 10, marginBottom: 18 }}>
            {heading}
          </h2>
          {paragraphs.map((para, i) => (
            <p key={i} style={{ marginBottom: 16 }}>
              {para}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
