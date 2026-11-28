import { useEffect, useRef, useState } from "react";
import { SizeChart } from "../pages/SizeGuide";
import { CareContent } from "../pages/CareGuide";

/* "Size chart & product care" popup on the product page. Opens over the
   page (no navigation), with a tab for each. The content is the same as
   the /size-guide and /care-guide pages, so admin edits to those show
   here too. Escape, the × or a click outside closes it. */

const TABS = [
  { id: "size", label: "Size chart" },
  { id: "care", label: "Product care" },
];

export default function SizeCareModal({ onClose, initialTab = "size" }) {
  const [tab, setTab] = useState(initialTab);
  const closeRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const opener = document.activeElement;
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.(); // back to the button that opened it
    };
  }, [onClose]);

  return (
    <div className="content-modal__overlay" onClick={onClose}>
      <div
        className="content-modal size-care"
        role="dialog"
        aria-modal="true"
        aria-label="Size chart and product care"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="size-care__head">
          <div className="size-care__tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`size-care-tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls="size-care-panel"
                className={tab === t.id ? "is-active" : ""}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button ref={closeRef} type="button" className="size-care__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div id="size-care-panel" role="tabpanel" aria-labelledby={`size-care-tab-${tab}`} className="size-care__body">
          {tab === "size" ? <SizeChart /> : <CareContent />}
        </div>
      </div>
    </div>
  );
}
