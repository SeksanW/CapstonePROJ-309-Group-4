import { useEffect } from "react";
import { Routes, Route, Outlet, useLocation } from "react-router-dom";
import { track } from "./lib/analytics";
import { usePageContent } from "./context/PageContentContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ChatWidget from "./components/ChatWidget";
import CartDrawer from "./components/CartDrawer";
import ConsentBanner from "./components/ConsentBanner";
import Store from "./pages/Store";
import Cart from "./pages/Cart";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Product from "./pages/Product";
import About from "./pages/About";
import Guides from "./pages/Guides";
import RefundPolicy from "./pages/RefundPolicy";
import Contact from "./pages/Contact";
import SignIn from "./pages/SignIn";
import Account from "./pages/Account";

/* Storefront layout: header and footer around every page, plus the
   floating help/returns chat widget. The site opens straight on the
   store (no intro / loading screen). */

const TOP_BANNER_DEFAULT = "Serving to unleash the everyday warrior in you";

function StoreLayout() {
  // Announcement bar text: admin → Main page edits → Top banner.
  const { content } = usePageContent();
  const topText = content.top?.heading?.trim() || TOP_BANNER_DEFAULT;

  // Anonymous analytics: which page each visit is on (where they leave).
  const { pathname } = useLocation();
  useEffect(() => {
    track("page_view");
  }, [pathname]);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div className="topbar">{topText}</div>
      <Header />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
      <CartDrawer />
      <ConsentBanner />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route path="/" element={<Store />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/about" element={<About />} />
        <Route path="/size-guide" element={<Guides tab="size" />} />
        <Route path="/care-guide" element={<Guides tab="care" />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/account" element={<Account />} />
        <Route path="/account/sign-in" element={<SignIn />} />
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
