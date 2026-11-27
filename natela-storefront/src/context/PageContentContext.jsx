import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

/* ---------------------------------------------------------
   PageContentContext — the homepage's editable copy (hero banner,
   collection banner, and the "Our story"/"Design" popups), loaded from
   product-service through the gateway (GET /page-content, public).

   Shared so the Store page, the intro gate and the story/design popups
   all read the same fetch instead of three separate ones, and so the
   intro gate can tell when this data (and the product catalogue) is
   actually ready before it advances past the loading screen.
   --------------------------------------------------------- */

const PageContentContext = createContext(null);

export function PageContentProvider({ children }) {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api("/page-content")
      .then((data) => {
        if (!cancelled) setContent(data ?? {});
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ content, loading, error }), [content, loading, error]);

  return <PageContentContext.Provider value={value}>{children}</PageContentContext.Provider>;
}

export function usePageContent() {
  const ctx = useContext(PageContentContext);
  if (!ctx) throw new Error("usePageContent must be used inside <PageContentProvider>");
  return ctx;
}

/* One section of the page content with built-in defaults filled in: the
   admin's value wins, but only when it's actually filled in, so an empty
   field in "Main page edits" means "use the built-in text/photo".
   Pass a module-level `defaults` object so the memo stays stable. */
export function usePageSection(name, defaults) {
  const { content } = usePageContent();
  const saved = content[name];
  return useMemo(() => {
    const out = { ...defaults };
    for (const [k, v] of Object.entries(saved || {})) {
      if (typeof v === "string" && v.trim()) out[k] = v;
    }
    return out;
  }, [saved, defaults]);
}
