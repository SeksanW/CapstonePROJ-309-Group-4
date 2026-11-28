import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

/* ---------------------------------------------------------
   CurrencyContext — which currency prices are DISPLAYED in.

   Prices are stored and charged in CAD (Stripe checkout is CAD).
   Choosing USD or EUR only converts what the shopper sees; the cart
   says so and shows the real CAD charge.

   Rates are live: GET /rates on the backend (order-service rates.js),
   which fetches the European Central Bank's daily rates and caches
   them. 1 CAD = rate × that currency. The `rate` values below are only
   used until that answer arrives, or if it can't be fetched.
   --------------------------------------------------------- */

export const CURRENCIES = {
  CAD: { label: "CAD", name: "Canadian dollar", rate: 1 },
  USD: { label: "USD", name: "US dollar", rate: 0.72 },
  EUR: { label: "EUR", name: "Euro", rate: 0.65 },
};

const FALLBACK_RATES = Object.fromEntries(Object.entries(CURRENCIES).map(([code, c]) => [code, c.rate]));

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
  // { rates, date, live } from the backend; fixed rates until then.
  const [rateInfo, setRateInfo] = useState({ rates: FALLBACK_RATES, date: null, live: false });

  useEffect(() => {
    let cancelled = false;
    api("/rates")
      .then((data) => {
        const ok = data?.rates && Object.keys(CURRENCIES).every((c) => Number(data.rates[c]) > 0);
        if (!cancelled && ok) setRateInfo({ rates: data.rates, date: data.date ?? null, live: Boolean(data.live) });
      })
      .catch(() => {
        /* keep the fixed rates — prices still show, just less exact */
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    const rate = Number(rateInfo.rates[currency]) || CURRENCIES[currency].rate;
    // en-CA keeps symbols unambiguous: $ (CAD), US$ (USD), € (EUR).
    const fmt = new Intl.NumberFormat("en-CA", { style: "currency", currency });
    return {
      currency,
      setCurrency,
      /** Format a CAD amount in the shopper's chosen currency. */
      money: (cad) => fmt.format(cad * rate),
      /** Day the live rates are from (YYYY-MM-DD), or null on fixed rates. */
      ratesDate: rateInfo.live ? rateInfo.date : null,
    };
  }, [currency, setCurrency, rateInfo]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside <CurrencyProvider>");
  return ctx;
}
