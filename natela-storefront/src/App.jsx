import { Routes, Route, Outlet, useLocation } from "react-router-dom";
import { usePageContent } from "./context/PageContentContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ChatWidget from "./components/ChatWidget";
import IntroGate from "./components/IntroGate";
import CartDrawer from "./components/CartDrawer";
import Store from "./pages/Store";
import Cart from "./pages/Cart";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import OurStory from "./pages/OurStory";

/* Storefront layout: top banner, header and footer around every page, plus
   the floating help/returns chat widget. IntroGate covers all of it (it's a
   fixed full-screen overlay) on a first-ever visit to "/", then gets out
   of the way for good. */

function StoreLayout() {
  const { content } = usePageContent();
  const location = useLocation();
  const top = content.top ?? {};
  // Not on checkout — that page is about finishing the order, not browsing.
  const showTopBanner = location.pathname !== "/cart";

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      {showTopBanner && (
        <div
          style={{
            textAlign: "center",
            padding: "12px 24px",
            background: "var(--brand-black)",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.02em",
            color: "var(--brand-red)",
          }}
        >
          {top.heading || "Serving to unleash the everyday warrior in you"}
        </div>
      )}
      <Header />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
      <IntroGate />
      <CartDrawer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route path="/" element={<Store />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/our-story" element={<OurStory />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
      </Route>
      <Route
        path="*"
        element={
          <div className="page empty" style={{ paddingBlock: 96 }}>
            <p style={{ fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>
              Page not found
            </p>
            <a href="/" className="btn btn--quiet">
              Back to the shop
            </a>
          </div>
        }
      />
    </Routes>
  );
}
