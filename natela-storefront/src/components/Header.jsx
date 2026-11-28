import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { CURRENCIES, useCurrency } from "../context/CurrencyContext";
import { useProducts } from "../context/ProductsContext";

/* Site header: menu on the left, logo centred, tools on the right. It
   stays pinned to the top while scrolling (.header is sticky). The logo
   is the official Natela Fit primary logo
   (public/images/natela-logo.png); the brand guidelines forbid
   redrawing or distorting it. */

/* Menu entries. `home` goes to the top of the storefront; `section`
   scrolls to that part of the homepage (going there first from other
   pages); `children` makes an expandable group; `to` is a page link.
   `minLive` hides an entry until there are at least that many live
   products (the "Products" section on the homepage does the same). */
const MENU = [
  { label: "Home", home: true },
  {
    label: "Product",
    children: [
      { label: "All products", section: "new", minLive: 2 },
      { label: "Latest release", section: "latest" },
    ],
  },
  { label: "Size guide", to: "/size-guide" },
  { label: "Care guide", to: "/care-guide" },
  { label: "About us", to: "/about" },
];

export default function Header() {
  const { totals, openDrawer } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const { products } = useProducts();
  const liveCount = products.filter((p) => p.status === "live").length;

  // While the menu is open: Escape closes it and the page behind can't scroll.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [menuOpen]);

  function goToSection(id) {
    if (location.pathname !== "/") navigate("/");
    // The homepage may still be rendering after navigating; retry briefly.
    let tries = 0;
    const scroll = () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else if (tries++ < 30) requestAnimationFrame(scroll);
    };
    requestAnimationFrame(scroll);
  }

  function choose(item) {
    setMenuOpen(false);
    if (item.home) {
      if (location.pathname !== "/") navigate("/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (item.section) goToSection(item.section);
    else if (item.to) navigate(item.to);
  }

  return (
    <>
      <header className="header">
        <button
          type="button"
          className="header__menu-btn"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          onClick={() => setMenuOpen(true)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          <span>Menu</span>
        </button>

        <Link to="/" aria-label="Natela Fit home" className="header__logo">
          <img src="/images/natela-logo.png" alt="Natela Fit" className="brand-logo" />
        </Link>

        <div className="header__tools">
          {/* Opens the slide-in cart (CartDrawer); its Checkout button goes
              on to the full cart page. */}
          <button
            type="button"
            className="cart-link"
            aria-label={`Open cart, ${totals.count} items`}
            aria-haspopup="dialog"
            onClick={openDrawer}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8h12l-1 12H7L6 8z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
            {totals.count > 0 && <span className="cart-count">{totals.count}</span>}
          </button>

          {/* Signed in: the account page (orders, saved cards, sign out).
              Signed out: sign in / create an account. */}
          <Link
            to={user ? "/account" : "/account/sign-in"}
            aria-label={user ? `My account (${user.email})` : "Sign in or create an account"}
            title={user ? `Signed in as ${user.email}` : "Sign in"}
            style={{ display: "flex" }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={user ? "var(--brand-red)" : "#111"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Slide-in menu from the left. */}
      <div
        className={`menu-backdrop${menuOpen ? " is-open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      <nav
        id="site-menu"
        className={`menu-drawer${menuOpen ? " is-open" : ""}`}
        aria-label="Site menu"
        aria-hidden={!menuOpen}
        inert={menuOpen ? undefined : ""}
      >
        <div className="menu-drawer__top">
          <img src="/images/natela-logo.png" alt="Natela Fit" className="brand-logo brand-logo--sm" />
          <button type="button" className="menu-drawer__close" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
            ×
          </button>
        </div>
        <ul className="menu-drawer__list">
          {MENU.map((item) =>
            item.children ? (
              <li key={item.label}>
                <button
                  type="button"
                  className="menu-drawer__group"
                  aria-expanded={productOpen}
                  aria-controls="menu-product"
                  onClick={() => setProductOpen((o) => !o)}
                >
                  {item.label}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <ul id="menu-product" className="menu-drawer__sub" hidden={!productOpen}>
                  {item.children.filter((child) => liveCount >= (child.minLive ?? 0)).map((child) => (
                    <li key={child.label}>
                      <button type="button" onClick={() => choose(child)}>
                        {child.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ) : (
              <li key={item.label}>
                <button type="button" onClick={() => choose(item)}>
                  {item.label}
                </button>
              </li>
            )
          )}
        </ul>

        {/* Display currency. Prices convert across the site; checkout is
            always charged in CAD (the cart says so). */}
        <div className="menu-currency">
          <label className="menu-currency__label" htmlFor="menu-currency">
            Currency
          </label>
          <div className="menu-currency__select">
            <select id="menu-currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {Object.entries(CURRENCIES).map(([code, { name }]) => (
                <option key={code} value={code}>
                  {code} · {name}
                </option>
              ))}
            </select>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <p className="menu-currency__note">Checkout is charged in CAD.</p>
        </div>
      </nav>

    </>
  );
}
