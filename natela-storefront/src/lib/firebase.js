import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";

/* ---------------------------------------------------------
   Firebase Auth, used only for Google sign-in at checkout.

   Local: VITE_FIREBASE_AUTH_EMULATOR_URL points at the backend's
   Auth emulator, which shows a fake Google account picker. The
   "demo-natela" project id must match FIREBASE_PROJECT_ID in the
   backend's .env, or the backend will reject the sign-in.

   Real Firebase: remove the emulator URL and set the three
   VITE_FIREBASE_* values in .env.local.
   --------------------------------------------------------- */

const env = import.meta.env;

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "demo-natela.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "demo-natela",
});

export const auth = getAuth(app);

if (env.VITE_FIREBASE_AUTH_EMULATOR_URL) {
  connectAuthEmulator(auth, env.VITE_FIREBASE_AUTH_EMULATOR_URL, { disableWarnings: true });
}
