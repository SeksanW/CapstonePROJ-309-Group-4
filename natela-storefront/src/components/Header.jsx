import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth, isSignInCancelled } from "../context/AuthContext";

/* Site header. The logo is a Poppins stand-in for the real
   wordmark — swap in the supplied logo file before the client
   sees this. Their guidelines forbid redrawing or distorting it. */

export default function Header() {
  const { totals, openDrawer } = useCart();
  const { user, signIn, signOut } = useAuth();

  function handleAccountClick() {
    if (user) {
      signOut();
    } else {
      signIn().catch((err) => {
        if (!isSignInCancelled(err)) console.error(err);
      });
    }
  }

  return (
    <>
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

        <div className="header__tools">
          <div className="currency">
            CAD
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

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

          <button
            aria-label={user ? `Sign out (${user.email})` : "Sign in"}
            title={user ? `Signed in as ${user.email}` : "Sign in"}
            onClick={handleAccountClick}
            style={{ background: "none", border: "none", padding: 0, display: "flex" }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={user ? "var(--brand-red)" : "#111"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
          </button>
        </div>
      </header>
    </>
  );
}
