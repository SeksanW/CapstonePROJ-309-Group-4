import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { authErrorMessage, isSignInCancelled, useAuth } from "../context/AuthContext";

/* /account/sign-in — sign in or create an account, with email + password
   or Google. ?mode=create opens on "Create account"; ?next=/cart sends the
   shopper back where they came from afterwards (same-site paths only). */

const MIN_PASSWORD = 8;

/* Only a path on this site, so ?next= can't bounce shoppers elsewhere. */
function safeNext(value) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

export default function SignIn() {
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const navigate = useNavigate();
  const { user, ready, signInWithEmail, signInWithGoogle, signUp, resetPassword, pendingGoogleLink, clearPendingGoogleLink } =
    useAuth();

  const [mode, setMode] = useState(params.get("mode") === "create" ? "create" : "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const creating = mode === "create";

  // Google said this email already has a password account: prefill it.
  useEffect(() => {
    if (pendingGoogleLink?.email) {
      setMode("signin");
      setEmail(pendingGoogleLink.email);
    }
  }, [pendingGoogleLink]);

  if (ready && user && !busy) return <Navigate to={next} replace />;

  function switchMode(to) {
    setMode(to);
    setError(null);
    setInfo(null);
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (creating && password.length < MIN_PASSWORD) {
      setError(`Use a longer password: at least ${MIN_PASSWORD} characters.`);
      return;
    }
    setBusy(true);
    try {
      if (creating) await signUp({ name, email, password });
      else await signInWithEmail(email, password);
      navigate(next, { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  }

  // Not async before the popup opens, or the browser may block it.
  function google() {
    setError(null);
    setInfo(null);
    setBusy(true);
    signInWithGoogle()
      .then(() => navigate(next, { replace: true }))
      .catch((err) => {
        if (!isSignInCancelled(err)) setError(authErrorMessage(err));
        setBusy(false);
      });
  }

  async function forgot() {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError("Enter your email above first, then click “Forgot password?”.");
      return;
    }
    try {
      await resetPassword(email);
    } catch (err) {
      // Unknown emails get the same answer, so it doesn't reveal who has an account.
      if (err?.code !== "auth/user-not-found") {
        setError(authErrorMessage(err));
        return;
      }
    }
    setInfo(`If there's an account for ${email.trim()}, we've emailed a link to reset the password.`);
  }

  return (
    <div className="page account-auth">
      <div className="panel account-auth__panel">
        <div className="account-tabs" role="tablist">
          <button role="tab" aria-selected={!creating} className={!creating ? "is-active" : ""} onClick={() => switchMode("signin")}>
            Sign in
          </button>
          <button role="tab" aria-selected={creating} className={creating ? "is-active" : ""} onClick={() => switchMode("create")}>
            Create account
          </button>
        </div>

        <h1 className="h1 account-auth__title">{creating ? "Create your account" : "Welcome back"}</h1>
        <p className="muted account-auth__sub">
          {creating
            ? "Track your orders and save a card for faster checkout."
            : "Sign in to see your orders and saved cards."}
        </p>

        {pendingGoogleLink && (
          <div className="notice account-notice" role="status">
            <div>
              <strong>One more step to link Google.</strong> {pendingGoogleLink.email} already has a password
              account. Sign in with that password and Google will be added to the same account.{" "}
              <button type="button" className="link-btn" onClick={clearPendingGoogleLink}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <button type="button" className="btn btn--quiet btn--block google-btn" onClick={google} disabled={busy}>
          <GoogleMark /> Continue with Google
        </button>

        <div className="account-divider">
          <span>or with email</span>
        </div>

        <form onSubmit={submit} noValidate>
          {creating && (
            <Field label="Name" id="name">
              <input id="name" className="fld" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </Field>
          )}
          <Field label="Email" id="email">
            <input
              id="email"
              type="email"
              className="fld"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </Field>
          <Field
            label="Password"
            id="password"
            hint={creating ? `At least ${MIN_PASSWORD} characters.` : null}
            aside={
              !creating && (
                <button type="button" className="link-btn" onClick={forgot}>
                  Forgot password?
                </button>
              )
            }
          >
            <input
              id="password"
              type="password"
              className="fld"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={creating ? "new-password" : "current-password"}
              required
            />
          </Field>

          {error && (
            <p role="alert" className="account-error">
              {error}
            </p>
          )}
          {info && (
            <p role="status" className="account-info">
              {info}
            </p>
          )}

          <button className="btn btn--grad btn--block btn--lg" disabled={busy || !email.trim() || !password}>
            {busy ? "One moment…" : creating ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="account-auth__foot">
          {creating ? (
            <>
              Already have an account?{" "}
              <button type="button" className="link-btn" onClick={() => switchMode("signin")}>
                Sign in
              </button>
            </>
          ) : (
            <>
              New here?{" "}
              <button type="button" className="link-btn" onClick={() => switchMode("create")}>
                Create an account
              </button>
            </>
          )}
          <br />
          No account needed to shop: <Link to="/cart">check out as a guest</Link>.
        </p>
      </div>
    </div>
  );
}

function Field({ label, id, hint, aside, children }) {
  return (
    <div className="account-field">
      <div className="account-field__label">
        <label htmlFor={id}>{label}</label>
        {aside}
      </div>
      {children}
      {hint && <div className="account-field__hint">{hint}</div>}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
