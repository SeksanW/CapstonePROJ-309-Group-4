import { NavLink, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

/* Site header. The logo is a Poppins stand-in for the real
   wordmark — swap in the supplied logo file before the client
   sees this. Their guidelines forbid redrawing or distorting it. */

export default function Header() {
  const { totals } = useCart();

  return (
    <>
      <div className="announce">
        Free worldwide shipping on orders over $150 CAD
      </div>

      <header className="header">
        <Link to="/" aria-label="Natela Fit home" style={{ display: "flex", gap: 3 }}>
          <span className="logo">NATELA</span>
          <span
            style={{
              fontSize: 8,
              fontWeight: 600,
              color: "#999",
              alignSelf: "flex-start",
              marginTop: 4,
            }}
          >
            ™
          </span>
        </Link>

        <nav className="header__nav">
          <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")} end>
            Shop
          </NavLink>
          <a href="#sports">By Sport</a>
          <a href="#sale">On Sale</a>
          <a href="#collection">Collections</a>
          <a href="#help">Help</a>
        </nav>

        <div className="header__tools">
          <div className="currency">
            CAD
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          <button
            aria-label="Search"
            style={{ background: "none", border: "none", padding: 0, display: "flex" }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          <Link to="/cart" className="cart-link" aria-label={`Cart, ${totals.count} items`}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8h12l-1 12H7L6 8z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
            {totals.count > 0 && <span className="cart-count">{totals.count}</span>}
          </Link>

          <button
            aria-label="Sign in"
            style={{ background: "none", border: "none", padding: 0, display: "flex" }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
          </button>
        </div>
      </header>
    </>
  );
}
