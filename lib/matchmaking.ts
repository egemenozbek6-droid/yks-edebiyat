// ============================================================
// EdebiKart — Online matchmaking servisi (Firestore)
// matches koleksiyonu: ranked + özel oda + oyun içi sync
// Sorular maç oluşturulurken üretilir ve match.sorular'a kaydedilir.
// Her iki oyuncu match.sorular[soruIndex]'ten okur.
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

export const RANKED_BOT_FALLBACK_SURESI = 5000;

// --- Payload sanitizer: undefined -> null ---
// Firestore, undefined alan değerlerini reddeder. Bu yardımcı,
// bir objenin tüm iç içe geçmiş alanlarındaki undefined değerlerini
// null'a dönüştürür.
function sanitizePayload<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => (value === undefined ? null : value)),
  ) as T;
}

export type MacDurumu = "bekliyor" | "aktif" | "bitti" | "terk";

export type OnlineMac = {
  matchId: string;
  mod: "ranked" | "friendly";
  durum: MacDurumu;
  oyuncu1: { id: string; ad: string; avatar: string; skor: number; cevap: number | null };
  oyuncu2: { id: string; ad: string; avatar: string; skor: number; cevap: number | null } | null;
  odaKodu: string | null;
  soruSayisi: number;
  sorular: Soru[];
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

// --- Soru üret ---

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

// --- Ranked matchmaking ---

export type KuyrukDurumu =
  | { durum: "bekliyor" }
  | { durum: "eslesti"; rakip: Rakip; matchId: string; sorular: Soru[] }
  | { durum: "iptal" };

export function rankedKuyrugaKatil(
  oyuncu: SiradakiOyuncu,
  onSonuc: (durum: KuyrukDurumu) => void,
): Unsubscribe | null {
  if (!firebaseAktif || !db) {
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

  botFallbackTimer = setTimeout(() => {
    if (iptalEdildi) return;
    rankedKuyruktanCik(oyuncu.id).catch(() => {});
    if (kuyrukUnsub) { kuyrukUnsub(); kuyrukUnsub = null; }
    const bot = rastgeleBot();
    const sorular = soruUret(10);
    onSonuc({ durum: "eslesti", rakip: bot, matchId: "bot_" + Date.now(), sorular });
  }, RANKED_BOT_FALLBACK_SURESI);

  (async () => {
    const q = query(
      collection(db!, "matches"),
      where("mod", "==", "ranked"),
      where("durum", "==", "bekliyor"),
      limit(1),
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      const macDoc = snap.docs[0];
      const macId = macDoc.id;
      const macData = macDoc.data() as OnlineMac;

      try {
        await runTransaction(db!, async (tx) => {
          const ref = doc(db!, "matches", macId);
          const cur = await tx.get(ref);
          if (!cur.exists()) throw new Error("kayboldu");
          const data = cur.data();
          if (data.durum !== "bekliyor") throw new Error("zaten alındı");
          const oyuncu2Payload = sanitizePayload({
            id: oyuncu.id,
            ad: oyuncu.ad,
            avatar: oyuncu.avatar,
            skor: 0,
            cevap: null,
          });
          tx.update(ref, {
            durum: "aktif",
            oyuncu2: oyuncu2Payload,
          });
        });

        if (botFallbackTimer) { clearTimeout(botFallbackTimer); botFallbackTimer = null; }
        if (!iptalEdildi) {
          onSonuc({
            durum: "eslesti",
            rakip: { ad: macData.oyuncu1.ad, avatar: macData.oyuncu1.avatar, bot: false },
            matchId: macId,
            sorular: macData.sorular ?? [],
          });
        }
      } catch {
        await kuyrugaEkleVeBekle(
          oyuncu,
          onSonuc,
          (u) => { kuyrukUnsub = u; },
          () => iptalEdildi,
          () => { if (botFallbackTimer) { clearTimeout(botFallbackTimer); botFallbackTimer = null; } },
        );
      }
    } else {
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
  const matchId = "m_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
  const uretilenSorular = soruUret(10);
  const payload = sanitizePayload({
    mod: "ranked",
    durum: "bekliyor",
    oyuncu1: {
      id: oyuncu.id,
      ad: oyuncu.ad,
      avatar: oyuncu.avatar,
      skor: 0,
      cevap: null,
    },
    oyuncu2: null,
    odaKodu: null,
    soruSayisi: 10,
    sorular: uretilenSorular,
    soruIndex: 0,
    kazananId: null,
    forfeitedBy: null,
    olusturmaZamani: serverTimestamp(),
  });
  await setDoc(doc(db, "matches", matchId), payload);

  const unsub = onSnapshot(
    doc(db, "matches", matchId),
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as OnlineMac;
      if (data.durum === "aktif" && data.oyuncu2) {
        if (!iptalEdildiRef()) {
          botTimerTemizle();
          onSonuc({
            durum: "eslesti",
            rakip: { ad: data.oyuncu2.ad, avatar: data.oyuncu2.avatar, bot: false },
            matchId,
            sorular: data.sorular ?? [],
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
    const q = query(
      collection(db, "matches"),
      where("mod", "==", "ranked"),
      where("durum", "==", "bekliyor"),
      where("oyuncu1.id", "==", oyuncuId),
      limit(1),
    );
    const snap = await getDocs(q);
    snap.forEach((d) => deleteDoc(d.ref).catch(() => {}));
  } catch {
    // sessiz
  }
}

// --- Özel oda (friendly) ---

export function odaKurOnline(
  odaKodu: string,
  oyuncu: SiradakiOyuncu,
  soruSayisi: number,
  onRakipKatildi: (rakip: Rakip, matchId: string, sorular: Soru[]) => void,
): Unsubscribe | null {
  // Preview fallback: simulate a waiting room locally when Firebase env vars are unavailable.
  if (!firebaseAktif || !db) {
    const kodStr = String(odaKodu ?? "").trim();
    if (!kodStr) return null;
    const uretilenSorular = soruUret(soruSayisi);
    const odaAnahtari = `edebikart-oda-${kodStr}`;
    try {
      window.localStorage.setItem(odaAnahtari, JSON.stringify({ oyuncu, sorular: uretilenSorular, soruSayisi }));
    } catch {}
    const timer = window.setTimeout(() => {
      onRakipKatildi(rastgeleBot(), `bot_oda_${kodStr}`, uretilenSorular);
    }, 1800);
    return () => window.clearTimeout(timer);
  }

  // odaKodu her zaman trim'lenmiş string olarak kaydedilir
  const kodStr = String(odaKodu ?? "").trim();
  if (!kodStr) {
    console.error("[odaKurOnline] Geçersiz oda kodu (boş)");
    alert("Oda kodu boş!");
    return null;
  }
  const macRef = doc(db!, "matches", kodStr);

  (async () => {
    try {
      const uretilenSorular = soruUret(soruSayisi);
      const payload = sanitizePayload({
        mod: "friendly",
        durum: "bekliyor",
        oyuncu1: {
          id: oyuncu.id,
          ad: oyuncu.ad,
          avatar: oyuncu.avatar,
          skor: 0,
          cevap: null,
        },
        oyuncu2: null,
        odaKodu: kodStr,
        soruSayisi: Number(soruSayisi) || 5,
        sorular: uretilenSorular,
        soruIndex: 0,
        kazananId: null,
        forfeitedBy: null,
        olusturmaZamani: serverTimestamp(),
      });
      console.log("[odaKurOnline] Firestore'a yazılıyor... matches/" + kodStr, {
        mod: "friendly",
        durum: "bekliyor",
        odaKodu: kodStr,
        soruSayisi: Number(soruSayisi) || 5,
      });
      await setDoc(macRef, payload);
      console.log("[odaKurOnline] ✓ Firestore'a yazıldı: matches/" + kodStr);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[odaKurOnline] ✗ Firestore yazma hatası:", e);
      alert("Oda kurma hatası!\nFirestore'a yazılamadı.\n\nHata: " + msg);
    }
  })();

  const unsub = onSnapshot(macRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data() as OnlineMac;
    if (data.durum === "aktif" && data.oyuncu2) {
      onRakipKatildi(
        { ad: data.oyuncu2.ad, avatar: data.oyuncu2.avatar, bot: false },
        kodStr,
        data.sorular ?? [],
      );
      unsub();
    }
  }, (err) => {
    console.error("[odaKurOnline] onSnapshot hatası:", err);
    alert("Oda dinleme hatası!\n\nHata: " + (err instanceof Error ? err.message : String(err)));
  });

  return unsub;
}

export async function odayaKatilOnline(
  odaKodu: string,
  oyuncu: SiradakiOyuncu,
): Promise<{ tamam: boolean; hata?: string }> {
  // Preview fallback: join a locally simulated room instead of blocking the UI.
  if (!firebaseAktif || !db) {
    const kodStr = String(odaKodu ?? "").trim();
    if (!kodStr) return { tamam: false, hata: "Oda kodu boş!" };
    try {
      const ham = window.localStorage.getItem(`edebikart-oda-${kodStr}`);
      if (!ham) return { tamam: false, hata: "Geçersiz oda kodu!" };
      return { tamam: true };
    } catch {
      return { tamam: true };
    }
  }

  // odaKodu her zaman trim'lenmiş string olarak karşılaştırılır
  const kodStr = String(odaKodu ?? "").trim();
  if (!kodStr) {
    return { tamam: false, hata: "Oda kodu boş!" };
  }

  try {
    console.log("[odayaKatilOnline] Sorgulanıyor: odaKodu ==", kodStr, "AND durum == bekliyor");
    const q = query(
      collection(db!, "matches"),
      where("odaKodu", "==", kodStr),
      where("durum", "==", "bekliyor"),
      limit(1),
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      console.warn("[odayaKatilOnline] Oda bulunamadı: " + kodStr);
      return { tamam: false, hata: "Geçersiz oda kodu!" };
    }

    const macDoc = snap.docs[0];
    const macId = macDoc.id;
    const data = macDoc.data() as OnlineMac;
    console.log("[odayaKatilOnline] Oda bulundu: " + macId, { durum: data.durum, odaKodu: data.odaKodu });

    if (data.oyuncu1?.id === oyuncu.id) {
      return { tamam: false, hata: "Kendi odana katılamazsın!" };
    }

    await runTransaction(db!, async (tx) => {
      const ref = doc(db!, "matches", macId);
      const cur = await tx.get(ref);
      if (!cur.exists()) throw new Error("oda yok");
      const curData = cur.data() as OnlineMac;
      if (curData.durum !== "bekliyor") throw new Error("dolu");
      const oyuncu2Payload = sanitizePayload({
        id: oyuncu.id,
        ad: oyuncu.ad,
        avatar: oyuncu.avatar,
        skor: 0,
        cevap: null,
      });
      tx.update(ref, {
        durum: "aktif",
        oyuncu2: oyuncu2Payload,
      });
    });
    console.log("[odayaKatilOnline] ✓ Oyuncu2 eklendi, durum=aktif: " + macId);
    return { tamam: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[odayaKatilOnline] ✗ Hata:", e);
    alert("Odaya katılma hatası!\n\nHata: " + msg);
    return { tamam: false, hata: "Geçersiz oda kodu!" };
  }
}

export async function odaSil(odaKodu: string): Promise<void> {
  if (!firebaseAktif || !db) return;
  try {
    await deleteDoc(doc(db, "matches", odaKodu));
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

export function katilanMatchBekle(
  oyuncuId: string,
  onBulundu: (matchId: string, mac: OnlineMac) => void,
): Unsubscribe | null {
  if (!firebaseAktif || !db) return null;

  const q = query(
    collection(db, "matches"),
    where("oyuncu2.id", "==", oyuncuId),
    where("durum", "==", "aktif"),
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

// --- Cevap gönder & soru ilerlet ---

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
    if (oyuncu.cevap !== null) return;
    const capliBonus = Math.min(20, Math.max(0, bonus));
    const yeniSkor = dogruMu ? oyuncu.skor + capliBonus : oyuncu.skor;

    const guncelleme: Record<string, number | null> = {};
    guncelleme[`${alan}.skor`] = yeniSkor ?? 0;
    guncelleme[`${alan}.cevap`] = secenekIndex ?? null;

    tx.update(ref, sanitizePayload(guncelleme) as Record<string, never>);
  });
}

export async function sonrakiSoru(matchId: string): Promise<void> {
  if (!firebaseAktif || !db || matchId.startsWith("bot_")) return;
  const ref = doc(db!, "matches", matchId);
  await runTransaction(db!, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const data = snap.data() as OnlineMac;
    const o1Cevap = data.oyuncu1.cevap;
    const o2Cevap = data.oyuncu2?.cevap ?? null;
    if (o1Cevap === null || o2Cevap === null) return;
    tx.update(ref, sanitizePayload({
      soruIndex: (data.soruIndex ?? 0) + 1,
      "oyuncu1.cevap": null,
      "oyuncu2.cevap": null,
    }) as Record<string, never>);
  });
}

export async function matchBitir(
  matchId: string,
  kazananId: string | null,
): Promise<void> {
  if (!firebaseAktif || !db || matchId.startsWith("bot_")) return;
  const ref = doc(db!, "matches", matchId);
  await updateDoc(ref, sanitizePayload({ durum: "bitti", kazananId: kazananId ?? null }));
}

export async function matchTerk(
  matchId: string,
  terkEdenId: string,
  digerOyuncuId: string,
): Promise<void> {
  if (!firebaseAktif || !db || matchId.startsWith("bot_")) return;
  const ref = doc(db!, "matches", matchId);
  await updateDoc(ref, sanitizePayload({
    durum: "terk",
    kazananId: digerOyuncuId ?? null,
    forfeitedBy: terkEdenId ?? null,
  }));
}
