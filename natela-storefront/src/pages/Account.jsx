import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { authErrorMessage, isSignInCancelled, isVerified, useAuth } from "../context/AuthContext";
import { money } from "../context/CartContext";
import { api } from "../lib/api";
import ShortsIcon from "../components/ShortsIcon";

/* /account — the signed-in shopper's page. A sidebar of tabs on the left,
   the chosen tab on the right, and "Delete account" in the bottom-right
   corner.

     Account information   email, name, phone (optional), saved addresses,
                         saved cards
     Order history         every past order
     Subscription          newsletter / email updates on or off

   The tab is in the URL (?tab=orders), so it survives a refresh and can be
   linked to. Cards are added on Stripe's own page, so card numbers never
   pass through this site; Stripe sends the shopper back with
   ?card_session=, which is confirmed and then removed from the URL.

   Saved cards and the newsletter need a verified email (Google accounts
   already are). */

const TABS = [
  { id: "info", label: "Account information" },
  { id: "orders", label: "Order history" },
  { id: "subscription", label: "Subscription" },
];

const STATUS_LABEL = { paid: "Paid", shipped: "Shipped", cancelled: "Cancelled" };

// Same list as the backend's SHIPPING_COUNTRIES (order-service schemas.js).
const COUNTRIES = [
  ["CA", "Canada"],
  ["US", "United States"],
  ["GB", "United Kingdom"],
  ["AU", "Australia"],
  ["NZ", "New Zealand"],
  ["TH", "Thailand"],
  ["IE", "Ireland"],
  ["FR", "France"],
  ["DE", "Germany"],
  ["NL", "Netherlands"],
];
const MAX_ADDRESSES = 5;

const dateFmt = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "short", day: "numeric" });

export default function Account() {
  const { user, ready, version } = useAuth();
  if (!ready) return <div className="page account-page muted">Loading your account…</div>;
  if (!user) return <Navigate to="/account/sign-in?next=/account" replace />;
  return <AccountPage key={user.uid} user={user} version={version} />;
}

function AccountPage({ user }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const verified = isVerified(user);
  const tab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "info";

  // Shared by every tab: a call to the backend as this shopper.
  const call = useCallback(
    async (path, options = {}) => api(path, { ...options, token: await user.getIdToken() }),
    [user]
  );

  function chooseTab(id) {
    setParams(id === "info" ? {} : { tab: id }, { replace: true });
  }

  return (
    <div className="page account-page">
      <div className="account-head">
        <div>
          <h1 className="h1">My account</h1>
          <p className="muted">{user.displayName ? `${user.displayName} · ${user.email}` : user.email}</p>
        </div>
        <button className="btn btn--quiet" onClick={() => signOut().then(() => navigate("/", { replace: true }))}>
          Sign out
        </button>
      </div>

      {!verified && <VerifyNotice email={user.email} />}

      <div className="panel account-shell">
        <nav className="account-nav" aria-label="Account sections">
          <div className="account-nav__title">Account</div>
          <ul role="tablist" aria-orientation="vertical">
            {TABS.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  role="tab"
                  id={`acct-tab-${t.id}`}
                  aria-selected={tab === t.id}
                  aria-controls="acct-panel"
                  className={tab === t.id ? "is-active" : ""}
                  onClick={() => chooseTab(t.id)}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="account-main" id="acct-panel" role="tabpanel" aria-labelledby={`acct-tab-${tab}`}>
          {tab === "info" && (
            <>
              <h2 className="h3 account-main__title">Account information</h2>
              <Details user={user} call={call} />
              <Addresses call={call} />
              <SavedCards call={call} verified={verified} />
            </>
          )}
          {tab === "orders" && (
            <>
              <h2 className="h3 account-main__title">Order history</h2>
              <Orders call={call} />
            </>
          )}
          {tab === "subscription" && (
            <>
              <h2 className="h3 account-main__title">Subscription</h2>
              <Subscription call={call} verified={verified} email={user.email} />
            </>
          )}
        </div>

        <div className="account-shell__foot">
          <DeleteAccount user={user} call={call} />
        </div>
      </div>
    </div>
  );
}

/* ---------- unverified email ---------- */

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
        as a guest, but saved cards, account checkout and the newsletter stay off.
        <div className="account-notice__actions">
          <button
            className="btn btn--quiet"
            disabled={busy}
            onClick={() => run(async () => ((await refreshUser()) ? null : "Not verified yet. Click the link in the email, then try again."))}
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

/* ---------- tab 1: account information ---------- */

function Section({ title, children, aside }) {
  return (
    <section className="account-section">
      <div className="account-section__head">
        <h3>{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Details({ user, call }) {
  const { updateName, resetPassword } = useAuth();
  const [name, setName] = useState(user.displayName || "");
  const [msg, setMsg] = useState(null);
  const [changingEmail, setChangingEmail] = useState(false);
  const providers = user.providerData.map((p) => p.providerId);
  const hasPassword = providers.includes("password");

  async function save(e) {
    e.preventDefault();
    try {
      await updateName(name);
      setMsg("Name saved.");
    } catch (err) {
      setMsg(authErrorMessage(err));
    }
  }

  async function changePassword() {
    try {
      await resetPassword(user.email);
      setMsg(`We've emailed ${user.email} a link to ${hasPassword ? "change" : "set"} your password.`);
    } catch (err) {
      setMsg(authErrorMessage(err));
    }
  }

  return (
    <Section title="Email & name">
      <dl className="account-facts">
        <dt>Email</dt>
        <dd>
          {user.email}{" "}
          <span className={`account-badge${user.emailVerified ? " is-ok" : ""}`}>
            {user.emailVerified ? "Verified" : "Not verified"}
          </span>
          {!changingEmail && (
            <>
              {" · "}
              <button type="button" className="link-btn" onClick={() => (setChangingEmail(true), setMsg(null))}>
                Change email
              </button>
            </>
          )}
          {changingEmail && (
            <ChangeEmail
              user={user}
              hasPassword={hasPassword}
              onDone={(note) => (setChangingEmail(false), setMsg(note))}
            />
          )}
        </dd>
        <dt>Password</dt>
        <dd>
          {hasPassword ? "••••••••" : "Not set (signs in with Google)"}
          {" · "}
          <button type="button" className="link-btn" onClick={changePassword}>
            {hasPassword ? "Change password" : "Add a password"}
          </button>
        </dd>
      </dl>
      <form onSubmit={save} className="account-name-form">
        <label htmlFor="acct-name" className="account-field__label">
          Name
        </label>
        <div className="account-inline">
          <input id="acct-name" className="fld" value={name} onChange={(e) => (setName(e.target.value), setMsg(null))} />
          <button className="btn btn--quiet" disabled={!name.trim() || name.trim() === (user.displayName || "")}>
            Save
          </button>
        </div>
      </form>
      <PhoneForm call={call} onSaved={setMsg} />
      {msg && <div className="account-field__hint">{msg}</div>}
    </Section>
  );
}

/* Optional phone number, kept with the account (and on Stripe for
   receipts). Leave empty to remove it. */
function PhoneForm({ call, onSaved }) {
  const [saved, setSaved] = useState(null);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    call("/account/profile")
      .then((p) => !cancelled && (setSaved(p.phone), setPhone(p.phone)))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [call]);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await call("/account/phone", { method: "PUT", body: { phone } });
      setSaved(result.phone);
      setPhone(result.phone);
      onSaved(result.phone ? "Phone number saved." : "Phone number removed.");
    } catch (err) {
      setError(err.details?.[0]?.message || err.message);
    }
    setBusy(false);
  }

  return (
    <form onSubmit={save} className="account-name-form" style={{ marginTop: 14 }}>
      <label htmlFor="acct-phone" className="account-field__label">
        <span>
          Phone <span className="muted">(optional)</span>
        </span>
      </label>
      <div className="account-inline">
        <input
          id="acct-phone"
          type="tel"
          className="fld"
          placeholder="+1 403 555 0123"
          value={phone}
          onChange={(e) => (setPhone(e.target.value), setError(null), onSaved(null))}
          autoComplete="tel"
          disabled={saved === null}
        />
        <button className="btn btn--quiet" disabled={busy || saved === null || phone.trim() === saved}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <div className="account-error" style={{ marginTop: 6 }}>{error}</div>}
    </form>
  );
}

const EMPTY_ADDRESS = { label: "", name: "", line1: "", line2: "", city: "", region: "", postalCode: "", country: "CA", phone: "" };

function Addresses({ call }) {
  const [addresses, setAddresses] = useState(null);
  const [editing, setEditing] = useState(null); // an address being added/edited
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    call("/account/profile")
      .then((p) => !cancelled && setAddresses(p.addresses))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [call]);

  // The whole list is saved each time; the first one is the default.
  async function saveList(next) {
    setBusy(true);
    setError(null);
    try {
      setAddresses(await call("/account/addresses", { method: "PUT", body: { addresses: next } }));
      setEditing(null);
    } catch (err) {
      setError(err.details?.[0]?.message || err.message);
    }
    setBusy(false);
  }

  function submit(e) {
    e.preventDefault();
    const exists = addresses.some((a) => a.id === editing.id);
    saveList(exists ? addresses.map((a) => (a.id === editing.id ? editing : a)) : [...addresses, editing]);
  }

  const makeDefault = (a) => saveList([a, ...addresses.filter((x) => x.id !== a.id)]);
  const remove = (a) => window.confirm("Remove this address?") && saveList(addresses.filter((x) => x.id !== a.id));
  const set = (key) => (e) => setEditing((a) => ({ ...a, [key]: e.target.value }));

  return (
    <Section
      title="Addresses"
      aside={
        addresses && !editing && addresses.length < MAX_ADDRESSES && (
          <button type="button" className="link-btn" onClick={() => setEditing({ ...EMPTY_ADDRESS, id: crypto.randomUUID() })}>
            + Add address
          </button>
        )
      }
    >
      {error && <p className="account-error">{error}</p>}
      {!addresses && !error && <p className="muted">Loading…</p>}
      {addresses?.length === 0 && !editing && <p className="muted">No saved addresses yet.</p>}

      {addresses?.length > 0 && (
        <ul className="address-list">
          {addresses.map((a, i) => (
            <li key={a.id}>
              <div>
                <div className="address-list__top">
                  {a.label && <strong>{a.label}</strong>}
                  {i === 0 && <span className="account-badge is-ok">Default</span>}
                </div>
                <address>
                  {a.name}
                  <br />
                  {a.line1}
                  {a.line2 && `, ${a.line2}`}
                  <br />
                  {[a.city, a.region, a.postalCode].filter(Boolean).join(", ")}
                  <br />
                  {COUNTRIES.find(([c]) => c === a.country)?.[1] ?? a.country}
                  {a.phone && ` · ${a.phone}`}
                </address>
              </div>
              <div className="address-list__actions">
                <button type="button" className="link-btn" disabled={busy} onClick={() => setEditing(a)}>
                  Edit
                </button>
                {i > 0 && (
                  <button type="button" className="link-btn" disabled={busy} onClick={() => makeDefault(a)}>
                    Make default
                  </button>
                )}
                <button type="button" className="link-btn" disabled={busy} onClick={() => remove(a)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <form className="address-form" onSubmit={submit}>
          <div className="address-form__grid">
            <AddrField label="Label (optional)" value={editing.label} onChange={set("label")} placeholder="Home, Work…" />
            <AddrField label="Full name" value={editing.name} onChange={set("name")} required autoComplete="name" />
            <AddrField label="Address" value={editing.line1} onChange={set("line1")} required autoComplete="address-line1" wide />
            <AddrField label="Apt, suite (optional)" value={editing.line2} onChange={set("line2")} autoComplete="address-line2" wide />
            <AddrField label="City" value={editing.city} onChange={set("city")} required autoComplete="address-level2" />
            <AddrField label="Province / state" value={editing.region} onChange={set("region")} autoComplete="address-level1" />
            <AddrField label="Postal code" value={editing.postalCode} onChange={set("postalCode")} required autoComplete="postal-code" />
            <label className="address-form__field">
              <span>Country</span>
              <select className="fld" value={editing.country} onChange={set("country")} autoComplete="country">
                {COUNTRIES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <AddrField label="Phone (optional)" value={editing.phone} onChange={set("phone")} autoComplete="tel" />
          </div>
          <div className="address-form__actions">
            <button type="button" className="btn btn--quiet" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </button>
            <button className="btn btn--grad" disabled={busy}>
              {busy ? "Saving…" : "Save address"}
            </button>
          </div>
        </form>
      )}
    </Section>
  );
}

function AddrField({ label, wide, ...input }) {
  return (
    <label className={`address-form__field${wide ? " is-wide" : ""}`}>
      <span>{label}</span>
      <input className="fld" {...input} />
    </label>
  );
}

/* Firebase emails a link to the new address and only switches the
   account over once it's clicked. Needs the password (or Google) again
   first, the same as deleting the account. */
function ChangeEmail({ user, hasPassword, onDone }) {
  const { reauthenticate, changeEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const valid = /^\S+@\S+\.\S+$/.test(email.trim()) && email.trim().toLowerCase() !== user.email.toLowerCase();

  // Not async before reauthenticate, so a Google popup isn't blocked.
  function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const next = email.trim();
    reauthenticate(password)
      .then(() => changeEmail(next))
      .then(() =>
        onDone(
          `We've sent a link to ${next}. Your email changes once you click it; you'll then be signed out and can sign in with the new address. Until then, keep using ${user.email}.`
        )
      )
      .catch((err) => {
        if (!isSignInCancelled(err)) setError(authErrorMessage(err));
        setBusy(false);
      });
  }

  return (
    <form className="address-form account-email-form" onSubmit={submit}>
      <div className="address-form__grid">
        <label className="address-form__field is-wide">
          <span>New email</span>
          <input type="email" className="fld" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus />
        </label>
        {hasPassword ? (
          <label className="address-form__field is-wide">
            <span>Current password</span>
            <input
              type="password"
              className="fld"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
        ) : (
          <p className="account-field__hint is-wide">You'll be asked to confirm with Google first.</p>
        )}
      </div>
      {error && <p className="account-error" style={{ marginTop: 12 }}>{error}</p>}
      <div className="address-form__actions">
        <button type="button" className="btn btn--quiet" onClick={() => onDone(null)} disabled={busy}>
          Cancel
        </button>
        <button className="btn btn--grad" disabled={busy || !valid || (hasPassword && !password)}>
          {busy ? "Sending…" : "Send confirmation link"}
        </button>
      </div>
    </form>
  );
}

function SavedCards({ call, verified }) {
  const [params, setParams] = useSearchParams();
  const cardSession = params.get("card_session");
  const [cards, setCards] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

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
    <Section
      title="Payment methods"
      aside={
        verified && (
          <button type="button" className="link-btn" onClick={addCard} disabled={busy}>
            {busy ? "One moment…" : "+ Add a card"}
          </button>
        )
      }
    >
      {!verified ? (
        <p className="muted">Verify your email to save a card.</p>
      ) : (
        <>
          {error && <p className="account-error">{error}</p>}
          {!cards && !error && <p className="muted">Loading…</p>}
          {cards?.length === 0 && <p className="muted">No saved cards yet.</p>}
          {cards?.length > 0 && (
            <ul className="card-list">
              {cards.map((card) => (
                <li key={card.id}>
                  <span>
                    <strong>{brandName(card.brand)}</strong> •••• {card.last4}
                    <span className="muted">
                      {" "}
                      · expires {card.expMonth}/{String(card.expYear).slice(-2)}
                    </span>
                  </span>
                  <button className="link-btn" onClick={() => remove(card)} disabled={busy}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="account-field__hint">
            Cards are stored by our payment provider, Stripe, never by Natela Fit. You can also tick “save this
            card” when you check out.
          </p>
        </>
      )}
    </Section>
  );
}

function brandName(brand) {
  const names = { visa: "Visa", mastercard: "Mastercard", amex: "Amex", discover: "Discover", jcb: "JCB", unionpay: "UnionPay" };
  return names[brand] || (brand ? brand[0].toUpperCase() + brand.slice(1) : "Card");
}

/* ---------- tab 2: order history ---------- */

function Orders({ call }) {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    call("/orders/mine")
      .then((list) => !cancelled && setOrders(list))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [call]);

  if (error) return <p className="account-error">{error}</p>;
  if (!orders) return <p className="muted">Loading your orders…</p>;
  if (orders.length === 0) {
    return (
      <div className="account-empty">
        <ShortsIcon size={48} />
        <p>No orders yet. Orders you place while signed in show up here.</p>
        <Link to="/" className="btn btn--grad">
          Shop all shorts
        </Link>
      </div>
    );
  }

  return (
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
  );
}

/* ---------- tab 3: subscription ---------- */

function Subscription({ call, verified, email }) {
  const [subscribed, setSubscribed] = useState(null);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    call("/account/profile")
      .then((p) => !cancelled && setSubscribed(p.newsletter))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [call]);

  async function toggle() {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const { newsletter } = await call("/account/newsletter", { method: "PUT", body: { subscribed: !subscribed } });
      setSubscribed(newsletter);
      setMsg(newsletter ? "You're subscribed. Welcome to the team!" : "You've been unsubscribed.");
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  return (
    <Section title="Newsletter">
      <p className="account-copy">
        New releases, restocks and members-only offers from Natela Fit, sent to <strong>{email}</strong>. No spam, and
        you can unsubscribe any time.
      </p>
      {error && <p className="account-error">{error}</p>}
      {!verified ? (
        <p className="muted">Verify your email to subscribe.</p>
      ) : subscribed === null && !error ? (
        <p className="muted">Loading…</p>
      ) : (
        subscribed !== null && (
          <div className="account-switch-row">
            <button
              type="button"
              role="switch"
              aria-checked={subscribed}
              className={`account-switch${subscribed ? " is-on" : ""}`}
              onClick={toggle}
              disabled={busy}
            >
              <span aria-hidden="true" />
            </button>
            <span>{subscribed ? "Subscribed" : "Not subscribed"}</span>
          </div>
        )
      )}
      {msg && <div className="account-field__hint">{msg}</div>}
    </Section>
  );
}

/* ---------- delete account (bottom-right corner) ---------- */

function DeleteAccount({ user, call }) {
  const { reauthenticate, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const hasPassword = user.providerData.some((p) => p.providerId === "password");

  // Not async before reauthenticate: a Google account confirms in a popup,
  // which the browser may block if it isn't opened straight from the click.
  function confirmDelete() {
    setBusy(true);
    setError(null);
    reauthenticate(password)
      .then(() => call("/account", { method: "DELETE" })) // cards, addresses, newsletter
      .then(() => deleteAccount()) // the sign-in itself
      .then(() => navigate("/", { replace: true }))
      .catch((err) => {
        if (!isSignInCancelled(err)) setError(err.code ? authErrorMessage(err) : err.message);
        setBusy(false);
      });
  }

  if (!open) {
    return (
      <button type="button" className="account-delete-btn" onClick={() => setOpen(true)}>
        Delete account
      </button>
    );
  }

  return (
    <div className="account-delete" role="alertdialog" aria-labelledby="acct-delete-title">
      <h3 id="acct-delete-title">Delete your account?</h3>
      <p>
        This permanently removes your sign-in, saved addresses and saved cards, and unsubscribes you. Past orders are
        kept for the shop's records but are no longer linked to you. This can't be undone.
      </p>
      {hasPassword ? (
        <label className="account-field">
          <span className="account-field__label">Enter your password to confirm</span>
          <input
            type="password"
            className="fld"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
      ) : (
        <p className="account-field__hint">You'll be asked to confirm with Google.</p>
      )}
      {error && <p className="account-error">{error}</p>}
      <div className="account-delete__actions">
        <button type="button" className="btn btn--quiet" onClick={() => (setOpen(false), setPassword(""), setError(null))} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="account-delete__confirm" onClick={confirmDelete} disabled={busy || (hasPassword && !password)}>
          {busy ? "Deleting…" : "Delete my account"}
        </button>
      </div>
    </div>
  );
}
