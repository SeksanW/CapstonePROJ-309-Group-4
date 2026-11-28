import { Link } from "react-router-dom";
import { SizeChart } from "./SizeGuide";
import { CareContent } from "./CareGuide";

/* "Size chart & product care" — one page from the menu, with a toggle at
   the top to switch between the two. Each side keeps its own address
   (/size-guide, /care-guide), so links to either still land on the right
   one and the back button works. The content is the same as the product
   page's popup (SizeCareModal). */

const TABS = [
  { id: "size", label: "Size chart", to: "/size-guide" },
  { id: "care", label: "Product care", to: "/care-guide" },
];

export default function Guides({ tab }) {
  return (
    <div className="page guide">
      <nav className="guide-toggle" aria-label="Size chart or product care">
        {TABS.map((t) => (
          <Link
            key={t.id}
            to={t.to}
            replace
            className={tab === t.id ? "is-active" : ""}
            aria-current={tab === t.id ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {tab === "care" ? <CareContent /> : <SizeChart />}
    </div>
  );
}
