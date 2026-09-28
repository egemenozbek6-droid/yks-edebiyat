// ============================================================
// EdebiKart — Firebase (Firestore + Anonymous Auth)
// ============================================================

import { initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  type Auth,
  type User,
} from "firebase/auth";

// Önce Vercel ortam değişkenleri kullanılır, yoksa aşağıdaki değerlere düşer.
// NOT: Next.js'in değerleri koda gömebilmesi için process.env.NEXT_PUBLIC_...
// ifadeleri bu şekilde tam adıyla yazılmalı.
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() ||
    "AIzaSyBTIZ40tegC1Ridklh58XVv7aRkrs0vMb8",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ||
    "edebikart-yks-yazareser.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
    "edebikart-yks-yazareser",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
    "edebikart-yks-yazareser.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() ||
    "116357634453",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() ||
    "1:116357634453:web:1e38118a8a6d879fabbe9c",
  measurementId: "G-5ZKLBGCXH7",
};

export const firebaseAktif = true;

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let authHazir: Promise<User | null> | null = null;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  console.log("[Firebase] Başlatıldı, projectId:", firebaseConfig.projectId);
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  console.error("[Firebase] Başlatılamadı:", e);
  if (typeof window !== "undefined") {
    console.warn("Firebase başlatılamadı:", msg);
  }
}

/**
 * Anonymous giriş — her cihaz için Firebase UID üretir.
 * Düello / online çağrılarından ÖNCE bir kez await et.
 */
export function ensureAnonymousAuth(): Promise<User | null> {
  if (!auth) return Promise.resolve(null);
  if (auth.currentUser) return Promise.resolve(auth.currentUser);

  if (!authHazir) {
    authHazir = new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth!, async (user) => {
        unsub();
        if (user) {
          resolve(user);
          return;
        }
        try {
          const cred = await signInAnonymously(auth!);
          console.log("[Firebase] Anonymous giriş:", cred.user.uid);
          resolve(cred.user);
        } catch (err) {
          console.error("[Firebase] Anonymous auth başarısız:", err);
          resolve(null);
        }
      });
    });
  }
  return authHazir;
}

/** O anki Firebase UID (cihaz kimliği yerine online id olarak kullanılabilir) */
export function firebaseUid(): string | null {
  return auth?.currentUser?.uid ?? null;
}

export { app, db, auth };
