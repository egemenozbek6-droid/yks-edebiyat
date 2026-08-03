// ============================================================
// EdebiKart — Online matchmaking servisi (Firestore)
// ranked_queue, custom_rooms, matches koleksiyonları
// firebaseAktif=false ise bot tabanlı fallback döner.
// ============================================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  runTransaction,
  Timestamp,
  Unsubscribe,
} from "firebase/firestore";
import { db, firebaseAktif } from "./firebase";
import { rastgeleBot } from "./bots";
import type { Rakip } from "./types";

export type MacDurumu = "bekliyor" | "aktif" | "bitti" | "terk";

export type OnlineMac = {
  matchId: string;
  mod: "ranked" | "friendly";
  soruSayisi: number;
  soruTohumu: number;
  durum: MacDurumu;
  oyuncu1: { id: string; ad: string; avatar: string; skor: number; cevap: number | null };
  oyuncu2: { id: string; ad: string; avatar: string; skor: number; cevap: number | null } | null;
  soruIndex: number;
  kazananId: string | null;
  olusturmaZamani: number;
};

export type SiradakiOyuncu = {
  id: string;
  ad: string;
  avatar: string;
};

// --- Kullanıcı adı kontrolü (global unique) ---

export async function kullaniciAdiMusaitMiOnline(ad: string): Promise<boolean> {
  if (!firebaseAktif || !db) return true;
  const ref = doc(db, "usernames", ad.toLowerCase());
  const snap = await getDoc(ref);
  return !snap.exists();
}

export async function kullaniciAdiKaydetOnline(
  ad: string,
  kullaniciId: string,
): Promise<boolean> {
  if (!firebaseAktif || !db) return true;
  const ref = doc(db, "usernames", ad.toLowerCase());
  try {
    await runTransaction(db!, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists()) throw new Error("Bu kullanıcı adı alınmış");
      tx.set(ref, { ad, kullaniciId, olusturmaZamani: serverTimestamp() });
    });
    return true;
  } catch {
    return false;
  }
}

// --- Ranked matchmaking (ranked_queue) ---

export type KuyrukDurumu =
  | { durum: "bekliyor" }
  | { durum: "eslesti"; rakip: Rakip; matchId: string }
  | { durum: "iptal" };

/**
 * Ranked kuyruğa katılır. Önce boşta bekleyen bir oyuncu arar;
 * bulursa onunla eşleşir, bulamazsa kendisi kuyruğa eklenir ve
 * bir başkasının onunla eşleşmesini bekler.
 * onSnapshot ile kuyruk belgesini dinler; eşleşme olunca callback.
 */
export function rankedKuyrugaKatil(
  oyuncu: SiradakiOyuncu,
  onSonuc: (durum: KuyrukDurumu) => void,
): Unsubscribe | null {
  if (!firebaseAktif || !db) {
    // Fallback: bot ile eşle
    const t = setTimeout(() => {
      const bot = rastgeleBot();
      onSonuc({ durum: "eslesti", rakip: bot, matchId: "bot_" + Date.now() });
    }, 3000 + Math.random() * 2000);
    return () => clearTimeout(t);
  }

  let iptalEdildi = false;
  let kuyrukUnsub: Unsubscribe | null = null;

  (async () => {
    // Boşta bekleyen bir oyuncu bul
    const q = query(
      collection(db!, "ranked_queue"),
      where("durum", "==", "bekliyor"),
      limit(1),
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      // Mevcut kuyruk belgesiyle eşleş
      const kuyrukDoc = snap.docs[0];
      const kuyrukId = kuyrukDoc.id;
      const kuyrukData = kuyrukDoc.data() as {
        id: string;
        ad: string;
        avatar: string;
      };

      // Eşleşmeyi atomik olarak işaretle
      try {
        await runTransaction(db!, async (tx) => {
          const ref = doc(db!, "ranked_queue", kuyrukId);
          const cur = await tx.get(ref);
          if (!cur.exists()) throw new Error("kayboldu");
          const data = cur.data();
          if (data.durum !== "bekliyor") throw new Error("zaten alındı");
          tx.update(ref, { durum: "eslesti", eslesenId: oyuncu.id });
        });

        // Match oluştur
        const matchId = "m_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
        const tohum = Math.floor(Math.random() * 1000000);
        await setDoc(doc(db!, "matches", matchId), {
          mod: "ranked",
          soruSayisi: 10,
          soruTohumu: tohum,
          durum: "aktif",
          oyuncu1: { id: kuyrukData.id, ad: kuyrukData.ad, avatar: kuyrukData.avatar, skor: 0, cevap: null },
          oyuncu2: { id: oyuncu.id, ad: oyuncu.ad, avatar: oyuncu.avatar, skor: 0, cevap: null },
          soruIndex: 0,
          kazananId: null,
          olusturmaZamani: serverTimestamp(),
        });
        // Kuyruk belgesini temizle
        await deleteDoc(doc(db!, "ranked_queue", kuyrukId));

        if (!iptalEdildi) {
          onSonuc({
            durum: "eslesti",
            rakip: { ad: kuyrukData.ad, avatar: kuyrukData.avatar, bot: false },
            matchId,
          });
        }
      } catch {
        // Eşleşme yarışı kaybedildi — kuyruğa kendini ekle
        await kuyrugaEkleVeBekle(oyuncu, onSonuc, (u) => { kuyrukUnsub = u; }, () => iptalEdildi);
      }
    } else {
      // Kuyrukta kimse yok — kendini ekle ve bekle
      await kuyrugaEkleVeBekle(oyuncu, onSonuc, (u) => { kuyrukUnsub = u; }, () => iptalEdildi);
    }
  })();

  return () => {
    iptalEdildi = true;
    if (kuyrukUnsub) kuyrukUnsub();
  };
}

async function kuyrugaEkleVeBekle(
  oyuncu: SiradakiOyuncu,
  onSonuc: (d: KuyrukDurumu) => void,
  setUnsub: (u: Unsubscribe) => void,
  iptalEdildiRef: () => boolean,
) {
  if (!db) return;
  const kuyrukId = "q_" + oyuncu.id;
  await setDoc(doc(db, "ranked_queue", kuyrukId), {
    id: oyuncu.id,
    ad: oyuncu.ad,
    avatar: oyuncu.avatar,
    durum: "bekliyor",
    olusturmaZamani: serverTimestamp(),
  });

  // Kendi kuyruk belgesini dinle — biri eşleşince durum "eslesti" olur
  const unsub = onSnapshot(
    doc(db, "ranked_queue", kuyrukId),
    async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.durum === "eslesti" && data.eslesenId) {
        // Eşleşme tamam — match belgesini bul
        const mq = query(
          collection(db!, "matches"),
          where("oyuncu1.id", "==", oyuncu.id),
          limit(1),
        );
        const mSnap = await getDocs(mq);
        let matchId = "";
        let rakipId = "";
        let rakipAd = "";
        let rakipAvatar = "";
        if (!mSnap.empty) {
          const m = mSnap.docs[0];
          matchId = m.id;
          const mData = m.data() as OnlineMac;
          rakipId = mData.oyuncu2?.id ?? "";
          rakipAd = mData.oyuncu2?.ad ?? "";
          rakipAvatar = mData.oyuncu2?.avatar ?? "";
        }
        if (matchId && rakipId && !iptalEdildiRef()) {
          onSonuc({
            durum: "eslesti",
            rakip: { ad: rakipAd, avatar: rakipAvatar, bot: false },
            matchId,
          });
        }
        unsub();
      }
    },
  );
  setUnsub(unsub);
}

export async function rankedKuyruktanCik(oyuncuId: string): Promise<void> {
  if (!firebaseAktif || !db) return;
  try {
    await deleteDoc(doc(db!, "ranked_queue", "q_" + oyuncuId));
  } catch {
    // sessiz
  }
}

// --- Özel oda (custom_rooms) ---

export type OdaDurum = "bekliyor" | "dolu" | "iptal";

export function odaKurOnline(
  odaKodu: string,
  oyuncu: SiradakiOyuncu,
  soruSayisi: number,
  onRakipKatildi: (rakip: Rakip, matchId: string) => void,
): Unsubscribe | null {
  if (!firebaseAktif || !db) {
    // Fallback modunda bile custom oda bot atamaz — sadece bekle
    // Gerçek bir oyuncu gelene kadar bekle (simülasyon: bekleme ekranı)
    return null;
  }

  const odaRef = doc(db!, "custom_rooms", odaKodu);

  (async () => {
    await setDoc(odaRef, {
      odaKodu,
      kurucu: { id: oyuncu.id, ad: oyuncu.ad, avatar: oyuncu.avatar },
      soruSayisi,
      durum: "bekliyor",
      olusturmaZamani: serverTimestamp(),
    });
  })();

  const unsub = onSnapshot(odaRef, async (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    if (data.durum === "dolu" && data.katilanId) {
      // Match oluştur
      const matchId = "m_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
      const tohum = Math.floor(Math.random() * 1000000);
      await setDoc(doc(db!, "matches", matchId), {
        mod: "friendly",
        soruSayisi,
        soruTohumu: tohum,
        durum: "aktif",
        oyuncu1: { id: oyuncu.id, ad: oyuncu.ad, avatar: oyuncu.avatar, skor: 0, cevap: null },
        oyuncu2: { id: data.katilanId, ad: data.katilanAd, avatar: data.katilanAvatar, skor: 0, cevap: null },
        soruIndex: 0,
        kazananId: null,
        olusturmaZamani: serverTimestamp(),
      });
      onRakipKatildi(
        { ad: data.katilanAd, avatar: data.katilanAvatar, bot: false },
        matchId,
      );
      unsub();
    }
  });

  return unsub;
}

export async function odayaKatilOnline(
  odaKodu: string,
  oyuncu: SiradakiOyuncu,
): Promise<{ tamam: boolean; hata?: string }> {
  if (!firebaseAktif || !db) {
    return { tamam: false, hata: "Geçersiz oda kodu!" };
  }

  const odaRef = doc(db!, "custom_rooms", odaKodu);
  const snap = await getDoc(odaRef);

  if (!snap.exists()) {
    return { tamam: false, hata: "Geçersiz oda kodu!" };
  }

  const data = snap.data();
  if (data.durum !== "bekliyor") {
    return { tamam: false, hata: "Geçersiz oda kodu!" };
  }

  if (data.kurucu?.id === oyuncu.id) {
    return { tamam: false, hata: "Kendi odana katılamazsın!" };
  }

  try {
    await runTransaction(db!, async (tx) => {
      const cur = await tx.get(odaRef);
      if (!cur.exists()) throw new Error("oda yok");
      const curData = cur.data();
      if (curData.durum !== "bekliyor") throw new Error("dolu");
      tx.update(odaRef, {
        durum: "dolu",
        katilanId: oyuncu.id,
        katilanAd: oyuncu.ad,
        katilanAvatar: oyuncu.avatar,
      });
    });
    return { tamam: true };
  } catch {
    return { tamam: false, hata: "Geçersiz oda kodu!" };
  }
}

export async function odaSil(odaKodu: string): Promise<void> {
  if (!firebaseAktif || !db) return;
  try {
    await deleteDoc(doc(db!, "custom_rooms", odaKodu));
  } catch {
    // sessiz
  }
}

// --- Match real-time sync ---

export function matchDinle(
  matchId: string,
  oyuncuNum: 1 | 2,
  onGuncelle: (mac: OnlineMac | null) => void,
): Unsubscribe | null {
  if (!firebaseAktif || !db || matchId.startsWith("bot_")) return null;

  return onSnapshot(doc(db!, "matches", matchId), (snap) => {
    if (!snap.exists()) {
      onGuncelle(null);
      return;
    }
    const data = snap.data() as Omit<OnlineMac, "olusturmaZamani"> & {
      olusturmaZamani: Timestamp;
    };
    onGuncelle({
      ...data,
      olusturmaZamani: data.olusturmaZamani?.toMillis?.() ?? 0,
    } as OnlineMac);
  });
}

export async function cevapGonder(
  matchId: string,
  oyuncuNum: 1 | 2,
  soruIndex: number,
  secenekIndex: number,
  dogruMu: boolean,
  bonus: number,
): Promise<void> {
  if (!firebaseAktif || !db || matchId.startsWith("bot_")) return;

  const ref = doc(db!, "matches", matchId);
  const alan = oyuncuNum === 1 ? "oyuncu1" : "oyuncu2";

  await runTransaction(db!, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const data = snap.data() as OnlineMac;

    // Skor güncelle
    const oyuncu = oyuncuNum === 1 ? data.oyuncu1 : data.oyuncu2;
    if (!oyuncu) return;
    const yeniSkor = dogruMu ? oyuncu.skor + 100 + bonus : oyuncu.skor;

    const guncelleme: Record<string, number | null> = {};
    guncelleme[`${alan}.skor`] = yeniSkor;
    guncelleme[`${alan}.cevap`] = secenekIndex;

    tx.update(ref, guncelleme as Record<string, never>);
  });
}

export async function sonrakiSoru(matchId: string): Promise<void> {
  if (!firebaseAktif || !db || matchId.startsWith("bot_")) return;
  const ref = doc(db!, "matches", matchId);
  await runTransaction(db!, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const data = snap.data() as OnlineMac;
    tx.update(ref, {
      soruIndex: data.soruIndex + 1,
      "oyuncu1.cevap": null,
      "oyuncu2.cevap": null,
    });
  });
}

export async function matchBitir(
  matchId: string,
  kazananId: string | null,
): Promise<void> {
  if (!firebaseAktif || !db || matchId.startsWith("bot_")) return;
  const ref = doc(db!, "matches", matchId);
  await updateDoc(ref, { durum: "bitti", kazananId });
}

export async function matchTerk(
  matchId: string,
  terkEdenId: string,
  digerOyuncuId: string,
): Promise<void> {
  if (!firebaseAktif || !db || matchId.startsWith("bot_")) return;
  const ref = doc(db!, "matches", matchId);
  await updateDoc(ref, {
    durum: "terk",
    kazananId: digerOyuncuId,
  });
}
