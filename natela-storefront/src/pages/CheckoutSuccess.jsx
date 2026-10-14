import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart, money } from "../context/CartContext";
import { useAuth, isSignInCancelled } from "../context/AuthContext";
import { api } from "../lib/api";

/* Stripe sends the shopper here after paying, with ?session_id=cs_...
   order-service checks the payment with Stripe and marks the order
   paid, so this page — not the redirect alone — is what confirms it.
   Asking again is safe: the server only takes the stock once. */

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { user, ready, signIn } = useAuth();
  const { clear } = useCart();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId || !ready || !user) return;
    let cancelled = false;
    setError(null);
    user
      .getIdToken()
      .then((token) => api(`/orders/checkout/${encodeURIComponent(sessionId)}`, { token }))
      .then((result) => {
        if (cancelled) return;
        setOrder(result);
        if (result.status === "paid") clear();
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
    // `clear` is left out on purpose: it is recreated every render, so
    // listing it would refetch in a loop.
  }, [sessionId, ready, user]);

  let body;
  if (!sessionId) {
    body = <Message title="No order to show" text="This page is opened from the payment page after checkout." />;
  } else if (!ready || (user && !order && !error)) {
    body = <Message title="Confirming your payment…" />;
  } else if (!user) {
    body = (
      <Message
        title="Sign in to see your order"
        text={error || "Use the same Google account you checked out with."}
        action={
          <button
            className="btn btn--grad"
            onClick={() => signIn().catch((err) => !isSignInCancelled(err) && setError(err.message))}
          >
            Continue with Google
          </button>
        }
      />
    );
  } else if (error) {
    body = <Message title="We couldn't confirm this order" text={error} />;
  } else if (order.status !== "paid") {
    body = (
      <Message
        title="Payment still processing"
        text="Stripe hasn't confirmed the payment yet. Refresh this page in a minute."
      />
    );
  } else {
    body = (
      <Message
        title="Thanks — your order is confirmed"
        text={`Total paid: ${money(order.totals.total)} CAD · ${order.email}`}
      >
        <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 6 }}>
          Order {order.id}
        </div>
      </Message>
    );
  }

  return (
    <div className="page" style={{ paddingBlock: 64 }}>
      <h1 className="h1" style={{ fontSize: "2rem", marginBottom: 8 }}>
        Checkout
      </h1>
      {body}
    </div>
  );
}

function Message({ title, text, action, children }) {
  return (
    <div className="panel empty" style={{ marginTop: 32 }}>
      <p style={{ fontWeight: 500, marginBottom: 6, color: "var(--ink)" }}>{title}</p>
      {text && <p style={{ fontSize: 13.5, marginBottom: 22 }}>{text}</p>}
      {children}
      <div style={{ marginTop: 18 }}>
        {action ?? (
          <Link to="/" className="btn btn--quiet">
            Back to the shop
          </Link>
        )}
      </div>
    </div>
  );
}
