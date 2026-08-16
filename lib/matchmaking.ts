// ============================================================
// EdebiKart — Online matchmaking servisi (Firestore)
// ranked_queue, custom_rooms, matches koleksiyonları
// firebaseAktif=false ise bot tabanlı fallback döner.
// Maç oluşturulurken sorular OLUŞTURULUR ve match belgesine
// kaydedilir — her iki oyuncu AYNI soruları AYNI sırayla görür.
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
import { sorulariUret, type Soru } from "./soru";
import { gecerliYazarlar } from "@/src/data";
import type { Rakip } from "./types";

// Ranked matchmaking'de gerçek oyuncu için maksimum bekleme süresi (ms).
// Bu süre dolunca bot fallback devreye girer.
export const RANKED_BOT_FALLBACK_SURESI = 5000;

export type MacDurumu = "aktif" | "bitti" | "terk";

export type OnlineMac = {
  matchId: string;
  mod: "ranked" | "friendly";
  soruSayisi: number;
  sorular: Soru[];
  durum: MacDurumu;
  oyuncu1: { id: string; ad: string; avatar: string; skor: number; cevap: number | null };
  oyuncu2: { id: string; ad: string; avatar: string; skor: number; cevap: number | null } | null;
  soruIndex: number;
  kazananId: string | null;
  forfeitedBy: string | null;
  olusturmaZamani: number;
};

export type SiradakiOyuncu = {
  id: string;
  ad: string;
  avatar: string;
};

// --- Soru üret (match oluşturulurken bir kez çağrılır) ---

function soruUret(soruSayisi: number): Soru[] {
  const havuz = gecerliYazarlar();
  return sorulariUret(havuz).slice(0, soruSayisi);
}

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
    await runTransaction(db, async (tx) => {
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
  | { durum: "eslesti"; rakip: Rakip; matchId: string; sorular: Soru[] }
  | { durum: "iptal" };

/**
 * Ranked kuyruğa katılır. Önce boşta bekleyen bir oyuncu arar;
 * bulursa onunla eşleşir, bulamazsa kendisi kuyruğa eklenir ve
 * bir başkasının onunla eşleşmesini bekler.
 * RANKED_BOT_FALLBACK_SURESI ms sonra gerçek oyuncu bulunamazsa
 * bot fallback devreye girer.
 */
export function rankedKuyrugaKatil(
  oyuncu: SiradakiOyuncu,
  onSonuc: (durum: KuyrukDurumu) => void,
): Unsubscribe | null {
  if (!firebaseAktif || !db) {
    // Fallback: bot ile eşle
    const t = setTimeout(() => {
      const bot = rastgeleBot();
      const sorular = soruUret(10);
      onSonuc({ durum: "eslesti", rakip: bot, matchId: "bot_" + Date.now(), sorular });
    }, 3000 + Math.random() * 2000);
    return () => clearTimeout(t);
  }

  let iptalEdildi = false;
  let kuyrukUnsub: Unsubscribe | null = null;
  let botFallbackTimer: ReturnType<typeof setTimeout> | null = null;

  // 5 saniye sonra bot fallback
  botFallbackTimer = setTimeout(() => {
    if (iptalEdildi) return;
    // Kuyruktan çık
    rankedKuyruktanCik(oyuncu.id).catch(() => {});
    if (kuyrukUnsub) { kuyrukUnsub(); kuyrukUnsub = null; }
    const bot = rastgeleBot();
    const sorular = soruUret(10);
    onSonuc({ durum: "eslesti", rakip: bot, matchId: "bot_" + Date.now(), sorular });
  }, RANKED_BOT_FALLBACK_SURESI);

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

      try {
        await runTransaction(db!, async (tx) => {
          const ref = doc(db!, "ranked_queue", kuyrukId);
          const cur = await tx.get(ref);
          if (!cur.exists()) throw new Error("kayboldu");
          const data = cur.data();
          if (data.durum !== "bekliyor") throw new Error("zaten alındı");
          tx.update(ref, { durum: "eslesti", eslesenId: oyuncu.id });
        });

        // Match oluştur — sorular BURADA üretilir ve kaydedilir
        const matchId = "m_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
        const uretilenSorular = soruUret(10);
        await setDoc(doc(db!, "matches", matchId), {
          mod: "ranked",
          soruSayisi: 10,
          sorular: uretilenSorular,
          durum: "aktif",
          oyuncu1: { id: kuyrukData.id, ad: kuyrukData.ad, avatar: kuyrukData.avatar, skor: 0, cevap: null },
          oyuncu2: { id: oyuncu.id, ad: oyuncu.ad, avatar: oyuncu.avatar, skor: 0, cevap: null },
          soruIndex: 0,
          kazananId: null,
          forfeitedBy: null,
          olusturmaZamani: serverTimestamp(),
        });
        // Kuyruk belgesini temizle
        await deleteDoc(doc(db!, "ranked_queue", kuyrukId));

        if (botFallbackTimer) { clearTimeout(botFallbackTimer); botFallbackTimer = null; }
        if (!iptalEdildi) {
          onSonuc({
            durum: "eslesti",
            rakip: { ad: kuyrukData.ad, avatar: kuyrukData.avatar, bot: false },
            matchId,
            sorular: uretilenSorular,
          });
        }
      } catch {
        // Eşleşme yarışı kaybedildi — kuyruğa kendini ekle
        await kuyrugaEkleVeBekle(
          oyuncu,
          onSonuc,
          (u) => { kuyrukUnsub = u; },
          () => iptalEdildi,
          () => { if (botFallbackTimer) { clearTimeout(botFallbackTimer); botFallbackTimer = null; } },
        );
      }
    } else {
      // Kuyrukta kimse yok — kendini ekle ve bekle
      await kuyrugaEkleVeBekle(
        oyuncu,
        onSonuc,
        (u) => { kuyrukUnsub = u; },
        () => iptalEdildi,
        () => { if (botFallbackTimer) { clearTimeout(botFallbackTimer); botFallbackTimer = null; } },
      );
    }
  })();

  return () => {
    iptalEdildi = true;
    if (botFallbackTimer) { clearTimeout(botFallbackTimer); botFallbackTimer = null; }
    if (kuyrukUnsub) kuyrukUnsub();
  };
}

async function kuyrugaEkleVeBekle(
  oyuncu: SiradakiOyuncu,
  onSonuc: (d: KuyrukDurumu) => void,
  setUnsub: (u: Unsubscribe) => void,
  iptalEdildiRef: () => boolean,
  botTimerTemizle: () => void,
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
        // Eşleşme tamam — match belgesini bul (oyuncu1 = biziz)
        const mq = query(
          collection(db!, "matches"),
          where("oyuncu1.id", "==", oyuncu.id),
          limit(1),
        );
        const mSnap = await getDocs(mq);
        if (!mSnap.empty) {
          const m = mSnap.docs[0];
          const mData = m.data() as OnlineMac;
          const rakipAd = mData.oyuncu2?.ad ?? "";
          const rakipAvatar = mData.oyuncu2?.avatar ?? "";
          if (rakipAd && !iptalEdildiRef()) {
            botTimerTemizle();
            onSonuc({
              durum: "eslesti",
              rakip: { ad: rakipAd, avatar: rakipAvatar, bot: false },
              matchId: m.id,
              sorular: mData.sorular ?? [],
            });
          }
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
    await deleteDoc(doc(db, "ranked_queue", "q_" + oyuncuId));
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
  onRakipKatildi: (rakip: Rakip, matchId: string, sorular: Soru[]) => void,
): Unsubscribe | null {
  if (!firebaseAktif || !db) {
    // Fallback modunda custom oda bot atmaz — sadece bekle
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
      // Match oluştur — sorular BURADA üretilir ve kaydedilir
      const matchId = "m_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
      const uretilenSorular = soruUret(soruSayisi);
      await setDoc(doc(db!, "matches", matchId), {
        mod: "friendly",
        soruSayisi,
        sorular: uretilenSorular,
        durum: "aktif",
        oyuncu1: { id: oyuncu.id, ad: oyuncu.ad, avatar: oyuncu.avatar, skor: 0, cevap: null },
        oyuncu2: { id: data.katilanId, ad: data.katilanAd, avatar: data.katilanAvatar, skor: 0, cevap: null },
        soruIndex: 0,
        kazananId: null,
        forfeitedBy: null,
        olusturmaZamani: serverTimestamp(),
      });
      onRakipKatildi(
        { ad: data.katilanAd, avatar: data.katilanAvatar, bot: false },
        matchId,
        uretilenSorular,
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
    await deleteDoc(doc(db, "custom_rooms", odaKodu));
  } catch {
    // sessiz
  }
}

// --- Match real-time sync ---

export function matchDinle(
  matchId: string,
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

/** Match belgesini tek seferlik okur (katılan oyuncu için). */
export async function matchGetir(matchId: string): Promise<OnlineMac | null> {
  if (!firebaseAktif || !db || matchId.startsWith("bot_")) return null;
  const snap = await getDoc(doc(db!, "matches", matchId));
  if (!snap.exists()) return null;
  const data = snap.data() as Omit<OnlineMac, "olusturmaZamani"> & {
    olusturmaZamani: Timestamp;
  };
  return {
    ...data,
    olusturmaZamani: data.olusturmaZamani?.toMillis?.() ?? 0,
  } as OnlineMac;
}

/**
 * Katılan oyuncu, kendi match belgesini bulur (oyuncu2.id = kendi id).
 * Kurucu match'i oluşturduktan sonra bu görünür hale gelir.
 */
export function katilanMatchBekle(
  oyuncuId: string,
  onBulundu: (matchId: string, mac: OnlineMac) => void,
): Unsubscribe | null {
  if (!firebaseAktif || !db) return null;

  const q = query(
    collection(db, "matches"),
    where("oyuncu2.id", "==", oyuncuId),
    limit(1),
  );

  return onSnapshot(q, (snap) => {
    if (snap.empty) return;
    const mDoc = snap.docs[0];
    const mData = mDoc.data() as Omit<OnlineMac, "olusturmaZamani"> & {
      olusturmaZamani: Timestamp;
    };
    const mac: OnlineMac = {
      ...mData,
      olusturmaZamani: mData.olusturmaZamani?.toMillis?.() ?? 0,
    } as OnlineMac;
    onBulundu(mDoc.id, mac);
  });
}

export async function cevapGonder(
  matchId: string,
  oyuncuNum: 1 | 2,
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

    const oyuncu = oyuncuNum === 1 ? data.oyuncu1 : data.oyuncu2;
    if (!oyuncu) return;
    // Aynı soruda tekrar cevaplamayı engelle
    if (oyuncu.cevap !== null) return;
    const yeniSkor = dogruMu ? oyuncu.skor + 100 + bonus : oyuncu.skor;

    const guncelleme: Record<string, number | null> = {};
    guncelleme[`${alan}.skor`] = yeniSkor;
    guncelleme[`${alan}.cevap`] = secenekIndex;

    tx.update(ref, guncelleme as Record<string, never>);
  });
}

/**
 * Her iki oyuncu cevapladıktan sonra soruIndex'i ilerlet.
 * Sadece her iki cevap da null değilse ilerletir.
 */
export async function sonrakiSoru(matchId: string): Promise<void> {
  if (!firebaseAktif || !db || matchId.startsWith("bot_")) return;
  const ref = doc(db!, "matches", matchId);
  await runTransaction(db!, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const data = snap.data() as OnlineMac;
    // Her iki oyuncu da cevaplamış olmalı
    const o1Cevap = data.oyuncu1.cevap;
    const o2Cevap = data.oyuncu2?.cevap ?? null;
    if (o1Cevap === null || o2Cevap === null) return;
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
    forfeitedBy: terkEdenId,
  });
}
