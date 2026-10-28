import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "../lib/firebase";

/* ---------------------------------------------------------
   AuthContext — the signed-in shopper, if any.

   Google is the only way in. There is no separate sign-up:
   the first Google sign-in creates the account.

   `ready` is false until Firebase has restored a previous
   session, so screens don't flash "signed out" on refresh.
   --------------------------------------------------------- */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, (next) => {
        setUser(next);
        setReady(true);
      }),
    []
  );

  const value = useMemo(
    () => ({
      user,
      ready,
      /* Opens Google's popup. Call it straight from a click handler,
         before any await, or the browser may block the popup. */
      signIn: async () => (await signInWithPopup(auth, new GoogleAuthProvider())).user,
      signOut: () => firebaseSignOut(auth),
    }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/* Popup closed or replaced by another one — the shopper changed their
   mind, so it isn't an error worth showing. */
export function isSignInCancelled(err) {
  return err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request";
}
