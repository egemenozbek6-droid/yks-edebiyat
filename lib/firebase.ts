// ============================================================
// EdebiKart — Firebase yapılandırması
// Firestore & Auth için temel init. Gerçek API anahtarları
// .env dosyasındaki NEXT_PUBLIC_FIREBASE_* değişkenlerinden okunur.
// Anahtarlar boşsa uygulama "offline fallback" modunda çalışır
// (bot tabanlı simülasyon) ve normal şekilde derler/çalışır.
// ============================================================

import { initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

// Debug: Firebase config'i konsola yazdır (anahtarların varlığını doğrula)
console.log("[Firebase] Config:", {
  apiKey: firebaseConfig.apiKey ? "✓ mevcut" : "✗ EKSİK",
  authDomain: firebaseConfig.authDomain || "✗ EKSİK",
  projectId: firebaseConfig.projectId ? "✓ mevcut" : "✗ EKSİK",
  storageBucket: firebaseConfig.storageBucket || "✗ EKSİK",
  messagingSenderId: firebaseConfig.messagingSenderId || "✗ EKSİK",
  appId: firebaseConfig.appId ? "✓ mevcut" : "✗ EKSİK",
});

// Firebase yapılandırması eksikse offline fallback moduna geç
export const firebaseAktif = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

console.log("[Firebase] firebaseAktif:", firebaseAktif);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (firebaseAktif) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("[Firebase] Başarıyla başlatıldı, projectId:", firebaseConfig.projectId);
  } catch (e) {
    // Init hatası: ekrana ve konsola yaz
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[Firebase] Başlatılamadı, offline mod kullanılacak:", e);
    alert("Firebase başlatılamadı!\nHata: " + msg);
    app = null;
    db = null;
  }
}

export { app, db };
