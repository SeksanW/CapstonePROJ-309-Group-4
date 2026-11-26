import { createContext, useCallback, useContext, useMemo, useState } from "react";

/* ---------------------------------------------------------
   CurrencyContext — which currency prices are DISPLAYED in.

   Prices are stored and charged in CAD (Stripe checkout is CAD).
   Choosing USD or EUR only converts what the shopper sees, using the
   fixed rates below; the cart says so and shows the real CAD charge.

   The rates are fixed placeholders — update them here (or swap in a
   live rates feed later). 1 CAD = rate × that currency.
   --------------------------------------------------------- */

export const CURRENCIES = {
  CAD: { label: "CAD", name: "Canadian dollar", rate: 1 },
  USD: { label: "USD", name: "US dollar", rate: 0.73 },
  EUR: { label: "EUR", name: "Euro", rate: 0.67 },
};

const STORAGE_KEY = "natela-currency";

function readSaved() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && CURRENCIES[saved] ? saved : "CAD";
  } catch {
    return "CAD";
  }
}

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(readSaved);

  const setCurrency = useCallback((code) => {
    if (!CURRENCIES[code]) return;
    setCurrencyState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* private mode etc. — the choice just won't be remembered */
    }
  }, []);

  const value = useMemo(() => {
    const { rate } = CURRENCIES[currency];
    // en-CA keeps symbols unambiguous: $ (CAD), US$ (USD), € (EUR).
    const fmt = new Intl.NumberFormat("en-CA", { style: "currency", currency });
    return {
      currency,
      setCurrency,
      /** Format a CAD amount in the shopper's chosen currency. */
      money: (cad) => fmt.format(cad * rate),
    };
  }, [currency, setCurrency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside <CurrencyProvider>");
  return ctx;
}
