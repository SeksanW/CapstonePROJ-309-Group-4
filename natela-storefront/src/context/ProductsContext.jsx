import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

/* Old builds kept their own copy of the catalogue here. The server
   owns it now, so throw that copy away. */
const OLD_STORAGE_KEY = "natela.products";

/* ---------------------------------------------------------
   ProductsContext — the catalogue, loaded from product-service
   through the gateway (GET /products, live products only).

   Every screen reads from here, so this is the only file that
   knows where products come from.

   Read-only for now: the backend has no endpoints for adding or
   editing products yet. Products are loaded with `npm run seed`
   in the backend repo.
   --------------------------------------------------------- */

const ProductsContext = createContext(null);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      window.localStorage.removeItem(OLD_STORAGE_KEY);
    } catch {
      /* blocked storage — nothing to clean up */
    }

    let cancelled = false;
    api("/products")
      .then((data) => {
        if (!cancelled) setProducts(data);
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

  const value = useMemo(() => ({ products, loading, error }), [products, loading, error]);

  return (
    <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used inside <ProductsProvider>");
  return ctx;
}
