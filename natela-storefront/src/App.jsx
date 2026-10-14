import { Routes, Route, Outlet } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Store from "./pages/Store";
import Cart from "./pages/Cart";
import CheckoutSuccess from "./pages/CheckoutSuccess";

/* Storefront layout: header and footer around every page. */

function StoreLayout() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route path="/" element={<Store />} />
        <Route path="/cart" element={<Cart />} />
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
