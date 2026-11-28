import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { authErrorMessage, isVerified, useAuth } from "../context/AuthContext";
import { money } from "../context/CartContext";
import { api } from "../lib/api";
import ShortsIcon from "../components/ShortsIcon";

/* /account — the signed-in shopper's page: their details, order history
   and saved cards.

   Cards are added on Stripe's own page (like checkout), so card numbers
   never pass through this site; the backend only keeps the Stripe
   customer id. Stripe sends the shopper back here with ?card_session=,
   which is confirmed with the backend and then removed from the URL.

   Saved cards and account checkout need a verified email (Google
   accounts already are). */

const STATUS_LABEL = { paid: "Paid", shipped: "Shipped", cancelled: "Cancelled" };

const dateFmt = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "short", day: "numeric" });

export default function Account() {
  const { user, ready, version, signOut } = useAuth();
  if (!ready) return <div className="page account-page muted">Loading your account…</div>;
  if (!user) return <Navigate to="/account/sign-in?next=/account" replace />;
  return <AccountPage key={user.uid} user={user} version={version} signOut={signOut} />;
}

function AccountPage({ user, signOut }) {
  const verified = isVerified(user);
  const navigate = useNavigate();

  return (
    <div className="page account-page">
      <div className="account-head">
        <div>
          <h1 className="h1">My account</h1>
          <p className="muted">{user.displayName ? `${user.displayName} · ${user.email}` : user.email}</p>
        </div>
        <button
          className="btn btn--quiet"
          onClick={() => signOut().then(() => navigate("/", { replace: true }))}
        >
          Sign out
        </button>
      </div>

      {!verified && <VerifyNotice email={user.email} />}

      <div className="account-grid">
        <Orders user={user} />
        <div className="account-side">
          <Profile user={user} />
          <SavedCards user={user} verified={verified} />
        </div>
      </div>
    </div>
  );
}

function VerifyNotice({ email }) {
  const { resendVerification, refreshUser } = useAuth();
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function run(action) {
    setBusy(true);
    setMsg(null);
    try {
      setMsg(await action());
    } catch (err) {
      setMsg(authErrorMessage(err));
    }
    setBusy(false);
  }

  return (
    <div className="notice account-notice" role="status">
      <div>
        <strong>Check your inbox to verify {email}.</strong> Until you do, you can still shop and check out
        as a guest, but saved cards and account checkout stay off.
        <div className="account-notice__actions">
          <button
            className="btn btn--quiet"
            disabled={busy}
            onClick={() => run(async () => (await refreshUser()) ? null : "Not verified yet. Click the link in the email, then try again.")}
          >
            I've verified it
          </button>
          <button
            className="btn btn--quiet"
            disabled={busy}
            onClick={() => run(async () => (await resendVerification(), "Sent. Check your inbox (and spam folder)."))}
          >
            Resend email
          </button>
        </div>
        {msg && <div className="account-notice__msg">{msg}</div>}
      </div>
    </div>
  );
}

function Orders({ user }) {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    user
      .getIdToken()
      .then((token) => api("/orders/mine", { token }))
      .then((list) => !cancelled && setOrders(list))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <section className="panel account-card">
      <h2 className="h3">Order history</h2>
      {error ? (
        <p className="account-error">{error}</p>
      ) : !orders ? (
        <p className="muted">Loading your orders…</p>
      ) : orders.length === 0 ? (
        <div className="account-empty">
          <ShortsIcon size={48} />
          <p>No orders yet. Orders you place while signed in show up here.</p>
          <Link to="/" className="btn btn--grad">
            Shop all shorts
          </Link>
        </div>
      ) : (
        <ul className="order-list">
          {orders.map((order) => (
            <li key={order.id} className="order-row">
              <div className="order-row__head">
                <div>
                  <div className="order-row__date">{dateFmt.format(new Date(order.paidAt || order.createdAt))}</div>
                  <div className="order-row__id">Order {order.id}</div>
                </div>
                <span className={`order-status order-status--${order.status}`}>{STATUS_LABEL[order.status] ?? order.status}</span>
              </div>
              <ul className="order-row__items">
                {order.items.map((item) => (
                  <li key={`${item.productId}__${item.size}`}>
                    <div className="order-row__thumb">
                      {item.image ? <img src={item.image} alt="" /> : <ShortsIcon size={28} stroke={2} />}
                    </div>
                    <span>
                      {item.name} · size {item.size} × {item.qty}
                    </span>
                    <span>{money(item.price * item.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="order-row__foot">
                <span className="muted">
                  {order.shippingMethod ? `${order.shippingMethod.carrier} ${order.shippingMethod.service}`.trim() : ""}
                  {order.trackingUrl && (
                    <>
                      {order.shippingMethod ? " · " : ""}
                      <a href={order.trackingUrl} target="_blank" rel="noreferrer">
                        Track package
                      </a>
                    </>
                  )}
                </span>
                <strong>{money(order.totals.total)} CAD</strong>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Profile({ user }) {
  const { updateName } = useAuth();
  const [name, setName] = useState(user.displayName || "");
  const [msg, setMsg] = useState(null);
  const providers = user.providerData.map((p) => p.providerId);

  async function save(e) {
    e.preventDefault();
    try {
      await updateName(name);
      setMsg("Saved.");
    } catch (err) {
      setMsg(authErrorMessage(err));
    }
  }

  return (
    <section className="panel account-card">
      <h2 className="h3">Details</h2>
      <form onSubmit={save}>
        <label htmlFor="acct-name" className="account-field__label">
          Name
        </label>
        <div className="account-inline">
          <input id="acct-name" className="fld" value={name} onChange={(e) => (setName(e.target.value), setMsg(null))} />
          <button className="btn btn--quiet" disabled={!name.trim() || name.trim() === (user.displayName || "")}>
            Save
          </button>
        </div>
        {msg && <div className="account-field__hint">{msg}</div>}
      </form>
      <div className="account-field__hint" style={{ marginTop: 14 }}>
        Signs in with{" "}
        {[providers.includes("password") && "email + password", providers.includes("google.com") && "Google"]
          .filter(Boolean)
          .join(" and ") || "this account"}
        .
      </div>
    </section>
  );
}

function SavedCards({ user, verified }) {
  const [params, setParams] = useSearchParams();
  const cardSession = params.get("card_session");
  const [cards, setCards] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const call = useCallback(
    async (path, options = {}) => api(path, { ...options, token: await user.getIdToken() }),
    [user]
  );

  useEffect(() => {
    if (!verified) return;
    let cancelled = false;
    // Back from Stripe's "add a card" page: confirm it first, then drop
    // the session id from the URL so a refresh doesn't repeat it.
    const load = cardSession
      ? call(`/account/payment-methods/setup/${encodeURIComponent(cardSession)}/confirm`, { method: "POST" }).finally(() =>
          setParams((p) => (p.delete("card_session"), p), { replace: true })
        )
      : call("/account/payment-methods");
    load.then((list) => !cancelled && setCards(list)).catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [verified, cardSession, call, setParams]);

  async function addCard() {
    setBusy(true);
    setError(null);
    try {
      const { url } = await call("/account/payment-methods/setup", { method: "POST" });
      window.location.assign(url); // Stripe's page
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function remove(card) {
    if (!window.confirm(`Remove ${brandName(card.brand)} ending ${card.last4}?`)) return;
    setBusy(true);
    setError(null);
    try {
      await call(`/account/payment-methods/${encodeURIComponent(card.id)}`, { method: "DELETE" });
      setCards((list) => list.filter((c) => c.id !== card.id));
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  return (
    <section className="panel account-card">
      <h2 className="h3">Saved cards</h2>
      {!verified ? (
        <p className="muted">Verify your email to save a card.</p>
      ) : (
        <>
          {error && <p className="account-error">{error}</p>}
          {!cards && !error ? (
            <p className="muted">Loading…</p>
          ) : (
            cards?.length > 0 && (
              <ul className="card-list">
                {cards.map((card) => (
                  <li key={card.id}>
                    <span>
                      <strong>{brandName(card.brand)}</strong> •••• {card.last4}
                      <span className="muted"> · expires {card.expMonth}/{String(card.expYear).slice(-2)}</span>
                    </span>
                    <button className="link-btn" onClick={() => remove(card)} disabled={busy}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )
          )}
          {cards?.length === 0 && <p className="muted">No saved cards yet.</p>}
          <button className="btn btn--quiet btn--block" onClick={addCard} disabled={busy}>
            {busy ? "One moment…" : "Add a card"}
          </button>
          <p className="account-field__hint" style={{ marginTop: 12 }}>
            Cards are stored by our payment provider, Stripe, never by Natela Fit. You can also tick “save
            this card” when you check out.
          </p>
        </>
      )}
    </section>
  );
}

function brandName(brand) {
  const names = { visa: "Visa", mastercard: "Mastercard", amex: "Amex", discover: "Discover", jcb: "JCB", unionpay: "UnionPay" };
  return names[brand] || (brand ? brand[0].toUpperCase() + brand.slice(1) : "Card");
}
