// ============================================================
// EdebiKart — Firebase yapılandırması (hardcoded)
// Firestore bağlantısı doğrudan buradan yapılır.
// ============================================================

import { initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBTIZ40tegC1RidklH58XVv7aRkrs0vMb8",
  authDomain: "edebikart-yks-yazareser.firebaseapp.com",
  projectId: "edebikart-yks-yazareser",
  storageBucket: "edebikart-yks-yazareser.firebasestorage.app",
  messagingSenderId: "116357634453",
  appId: "1:116357634453:web:1e38118a8a6d879fabbe9c",
  measurementId: "G-5ZKLBGCXH7",
};

export const firebaseAktif = true;

console.log("[Firebase] Config yüklendi, projectId:", firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("[Firebase] Başarıyla başlatıldı, projectId:", firebaseConfig.projectId);
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  console.error("[Firebase] Başlatılamadı:", e);
  alert("Firebase başlatılamadı!\nHata: " + msg);
}

export { app, db };
