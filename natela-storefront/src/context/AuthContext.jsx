import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  createUserWithEmailAndPassword,
  linkWithCredential,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { auth } from "../lib/firebase";

/* ---------------------------------------------------------
   AuthContext — the signed-in shopper, if any.

   Shoppers can create an account with email + password, or use
   Google to sign up / sign in. Accounts are optional: guest
   checkout still works without one.

   Firebase Auth stores and hashes passwords; this site never
   sees them after they're typed. One account per email (the
   Firebase default): if Google sign-in hits an email that
   already has a password account, `pendingGoogleLink` is set,
   and the next password sign-in links Google to that account
   instead of making a second one.

   Email/password accounts must verify their email (Firebase
   sends the link) before account checkout or saved cards; until
   then they can still check out as a guest. Google accounts
   are verified already.

   `ready` is false until Firebase has restored a previous
   session, so screens don't flash "signed out" on refresh.
   --------------------------------------------------------- */

const AuthContext = createContext(null);

/* Where Firebase's verification / reset emails send the shopper back to. */
const continueUrl = (path) => ({ url: `${window.location.origin}${path}` });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  // Firebase mutates the same user object (e.g. emailVerified after
  // reload()), so this bumps to tell React something changed.
  const [version, setVersion] = useState(0);
  const [pendingGoogleLink, setPendingGoogleLink] = useState(null); // { email, credential }
  const pendingRef = useRef(null);
  pendingRef.current = pendingGoogleLink;

  useEffect(
    () =>
      onAuthStateChanged(auth, (next) => {
        setUser(next);
        setReady(true);
        setVersion((v) => v + 1);
      }),
    []
  );

  /* Re-reads the account from Firebase, e.g. after the shopper clicked
     the verification link in another tab, and gets a fresh token so the
     backend sees email_verified too. Returns whether it's verified now. */
  const refreshUser = useCallback(async () => {
    const current = auth.currentUser;
    if (!current) return false;
    await current.reload();
    if (current.emailVerified) await current.getIdToken(true);
    setVersion((v) => v + 1);
    return current.emailVerified;
  }, []);

  // Coming back to the tab is the usual sign they've just clicked the link.
  useEffect(() => {
    if (!user || user.emailVerified) return;
    const onFocus = () => refreshUser().catch(() => {});
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user, version, refreshUser]);

  const value = useMemo(
    () => ({
      user,
      ready,
      version,
      pendingGoogleLink,

      /* Opens Google's popup. Call it straight from a click handler,
         before any await, or the browser may block the popup. The first
         Google sign-in creates the account. */
      signInWithGoogle: async () => {
        try {
          const { user: signedIn } = await signInWithPopup(auth, new GoogleAuthProvider());
          setPendingGoogleLink(null);
          return signedIn;
        } catch (err) {
          if (err?.code === "auth/account-exists-with-different-credential") {
            const credential = GoogleAuthProvider.credentialFromError(err);
            const email = err.customData?.email ?? "";
            if (credential) setPendingGoogleLink({ email, credential });
          }
          throw err;
        }
      },

      signInWithEmail: async (email, password) => {
        const { user: signedIn } = await signInWithEmailAndPassword(auth, email.trim(), password);
        const pending = pendingRef.current;
        if (pending && pending.email.toLowerCase() === signedIn.email?.toLowerCase()) {
          await linkWithCredential(signedIn, pending.credential);
          setPendingGoogleLink(null);
          await refreshUser();
        }
        return signedIn;
      },

      signUp: async ({ name, email, password }) => {
        const { user: created } = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name?.trim()) await updateProfile(created, { displayName: name.trim() });
        await sendEmailVerification(created, continueUrl("/account"));
        setVersion((v) => v + 1);
        return created;
      },

      resendVerification: () => sendEmailVerification(auth.currentUser, continueUrl("/account")),

      /* Also works for a Google-only account: it adds a password to it. */
      resetPassword: (email) => sendPasswordResetEmail(auth, email.trim(), continueUrl("/account/sign-in")),

      updateName: async (name) => {
        await updateProfile(auth.currentUser, { displayName: name.trim() });
        setVersion((v) => v + 1);
      },

      /* Deleting the account needs a recent sign-in. Password accounts
         re-enter their password; Google-only ones confirm in the popup
         (call straight from a click, like signInWithGoogle). */
      reauthenticate: async (password) => {
        const current = auth.currentUser;
        const hasPassword = current.providerData.some((p) => p.providerId === "password");
        if (hasPassword) {
          await reauthenticateWithCredential(current, EmailAuthProvider.credential(current.email, password));
        } else {
          await reauthenticateWithPopup(current, new GoogleAuthProvider());
        }
      },

      /* Emails a link to the new address; the account's email only
         changes once it's clicked, so a typo can't lock anyone out. Needs
         a recent sign-in: call reauthenticate first. Firebase then signs
         the shopper out everywhere, and they sign in with the new email. */
      changeEmail: (newEmail) =>
        verifyBeforeUpdateEmail(auth.currentUser, newEmail.trim(), continueUrl("/account/sign-in")),

      /* Removes the Firebase sign-in itself. Call the backend's
         DELETE /account first, while the token still works. */
      deleteAccount: () => deleteUser(auth.currentUser),

      refreshUser,
      clearPendingGoogleLink: () => setPendingGoogleLink(null),
      signOut: () => firebaseSignOut(auth),
    }),
    [user, ready, version, pendingGoogleLink, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/* Signed in and allowed to use account checkout / saved cards. */
export function isVerified(user) {
  return Boolean(user?.emailVerified);
}

/* Popup closed or replaced by another one — the shopper changed their
   mind, so it isn't an error worth showing. */
export function isSignInCancelled(err) {
  return err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request";
}

/* Firebase error codes → something a shopper can act on. Wrong email and
   wrong password get the same message so it doesn't reveal which emails
   have accounts. */
export function authErrorMessage(err) {
  switch (err?.code) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "That email and password don't match. Try again, or reset your password.";
    case "auth/email-already-in-use":
      return "There's already an account with this email. Sign in instead (or use Continue with Google if that's how you signed up).";
    case "auth/weak-password":
      return "Use a longer password: at least 8 characters.";
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes, or reset your password.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google window. Allow pop-ups for this site and try again.";
    case "auth/account-exists-with-different-credential":
      return "This email already has a password account. Sign in with your password below and we'll link Google to it.";
    case "auth/requires-recent-login":
      return "For security, please sign out and back in, then try again.";
    case "auth/operation-not-allowed":
      return "That isn't switched on for this store yet.";
    case "auth/network-request-failed":
      return "Couldn't reach the sign-in service. Check your connection and try again.";
    default:
      return err?.message || "Something went wrong. Please try again.";
  }
}
