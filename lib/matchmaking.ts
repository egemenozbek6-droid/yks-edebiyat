// ============================================================
// EdebiKart — Online matchmaking servisi (Firestore)
// Tek bir "rooms" koleksiyonu: ranked + özel oda + oyun içi sync
// Sorular oda oluşturulurken üretilir ve room.questions'a kaydedilir.
// Her iki oyuncu room.questions[currentIndex]'ten okur.
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

export type OdaDurumu = "waiting" | "in_progress" | "finished" | "forfeited";
export type OdaModu = "ranked" | "friendly";

export type OdaOyuncu = {
  id: string;
  username: string;
  avatar: string;
  score: number;
  answer: number | null;
};

export type OnlineOda = {
  code: string;
  mode: OdaModu;
  status: OdaDurumu;
  player1: OdaOyuncu;
  player2: OdaOyuncu | null;
  questions: Soru[];
  currentIndex: number;
  winnerId: string | null;
  forfeitedBy: string | null;
  createdAt: number;
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
  | { durum: "eslesti"; rakip: Rakip; roomId: string; sorular: Soru[] }
  | { durum: "iptal" };

export function rankedKuyrugaKatil(
  oyuncu: SiradakiOyuncu,
  onSonuc: (durum: KuyrukDurumu) => void,
): Unsubscribe | null {
  if (!firebaseAktif || !db) {
    const t = setTimeout(() => {
      const bot = rastgeleBot();
      const sorular = soruUret(10);
      onSonuc({ durum: "eslesti", rakip: bot, roomId: "bot_" + Date.now(), sorular });
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
    onSonuc({ durum: "eslesti", rakip: bot, roomId: "bot_" + Date.now(), sorular });
  }, RANKED_BOT_FALLBACK_SURESI);

  (async () => {
    const q = query(
      collection(db!, "rooms"),
      where("mode", "==", "ranked"),
      where("status", "==", "waiting"),
      limit(1),
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      const odaDoc = snap.docs[0];
      const odaId = odaDoc.id;
      const odaData = odaDoc.data() as OnlineOda;

      try {
        await runTransaction(db!, async (tx) => {
          const ref = doc(db!, "rooms", odaId);
          const cur = await tx.get(ref);
          if (!cur.exists()) throw new Error("kayboldu");
          const data = cur.data();
          if (data.status !== "waiting") throw new Error("zaten alındı");
          tx.update(ref, {
            status: "in_progress",
            player2: {
              id: oyuncu.id,
              username: oyuncu.ad,
              avatar: oyuncu.avatar,
              score: 0,
              answer: null,
            },
          });
        });

        if (botFallbackTimer) { clearTimeout(botFallbackTimer); botFallbackTimer = null; }
        if (!iptalEdildi) {
          onSonuc({
            durum: "eslesti",
            rakip: { ad: odaData.player1.username, avatar: odaData.player1.avatar, bot: false },
            roomId: odaId,
            sorular: odaData.questions ?? [],
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
  const roomId = "ranked_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
  const uretilenSorular = soruUret(10);
  await setDoc(doc(db, "rooms", roomId), {
    code: roomId,
    mode: "ranked",
    status: "waiting",
    player1: {
      id: oyuncu.id,
      username: oyuncu.ad,
      avatar: oyuncu.avatar,
      score: 0,
      answer: null,
    },
    player2: null,
    questions: uretilenSorular,
    currentIndex: 0,
    winnerId: null,
    forfeitedBy: null,
    createdAt: Date.now(),
  });

  const unsub = onSnapshot(
    doc(db, "rooms", roomId),
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as OnlineOda;
      if (data.status === "in_progress" && data.player2) {
        if (!iptalEdildiRef()) {
          botTimerTemizle();
          onSonuc({
            durum: "eslesti",
            rakip: { ad: data.player2.username, avatar: data.player2.avatar, bot: false },
            roomId,
            sorular: data.questions ?? [],
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
      collection(db, "rooms"),
      where("mode", "==", "ranked"),
      where("status", "==", "waiting"),
      where("player1.id", "==", oyuncuId),
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
  onRakipKatildi: (rakip: Rakip, roomId: string, sorular: Soru[]) => void,
): Unsubscribe | null {
  if (!firebaseAktif || !db) return null;

  const odaRef = doc(db!, "rooms", odaKodu);

  (async () => {
    const uretilenSorular = soruUret(soruSayisi);
    await setDoc(odaRef, {
      code: odaKodu,
      mode: "friendly",
      status: "waiting",
      player1: {
        id: oyuncu.id,
        username: oyuncu.ad,
        avatar: oyuncu.avatar,
        score: 0,
        answer: null,
      },
      player2: null,
      questions: uretilenSorular,
      currentIndex: 0,
      winnerId: null,
      forfeitedBy: null,
      createdAt: Date.now(),
    });
  })();

  const unsub = onSnapshot(odaRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data() as OnlineOda;
    if (data.status === "in_progress" && data.player2) {
      onRakipKatildi(
        { ad: data.player2.username, avatar: data.player2.avatar, bot: false },
        odaKodu,
        data.questions ?? [],
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

  const odaRef = doc(db!, "rooms", odaKodu);
  const snap = await getDoc(odaRef);

  if (!snap.exists()) {
    return { tamam: false, hata: "Geçersiz oda kodu!" };
  }

  const data = snap.data() as OnlineOda;
  if (data.status !== "waiting") {
    return { tamam: false, hata: "Geçersiz oda kodu!" };
  }

  if (data.player1?.id === oyuncu.id) {
    return { tamam: false, hata: "Kendi odana katılamazsın!" };
  }

  try {
    await runTransaction(db!, async (tx) => {
      const cur = await tx.get(odaRef);
      if (!cur.exists()) throw new Error("oda yok");
      const curData = cur.data() as OnlineOda;
      if (curData.status !== "waiting") throw new Error("dolu");
      tx.update(odaRef, {
        status: "in_progress",
        player2: {
          id: oyuncu.id,
          username: oyuncu.ad,
          avatar: oyuncu.avatar,
          score: 0,
          answer: null,
        },
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
    await deleteDoc(doc(db, "rooms", odaKodu));
  } catch {
    // sessiz
  }
}

// --- Room real-time sync ---

export function roomDinle(
  roomId: string,
  onGuncelle: (oda: OnlineOda | null) => void,
): Unsubscribe | null {
  if (!firebaseAktif || !db || roomId.startsWith("bot_")) return null;

  return onSnapshot(doc(db!, "rooms", roomId), (snap) => {
    if (!snap.exists()) {
      onGuncelle(null);
      return;
    }
    const data = snap.data() as Omit<OnlineOda, "createdAt"> & {
      createdAt?: number | Timestamp;
    };
    onGuncelle({
      ...data,
      createdAt: typeof data.createdAt === "number"
        ? data.createdAt
        : (data.createdAt as Timestamp)?.toMillis?.() ?? 0,
    } as OnlineOda);
  });
}

export async function roomGetir(roomId: string): Promise<OnlineOda | null> {
  if (!firebaseAktif || !db || roomId.startsWith("bot_")) return null;
  const snap = await getDoc(doc(db!, "rooms", roomId));
  if (!snap.exists()) return null;
  const data = snap.data() as Omit<OnlineOda, "createdAt"> & {
    createdAt?: number | Timestamp;
  };
  return {
    ...data,
    createdAt: typeof data.createdAt === "number"
      ? data.createdAt
      : (data.createdAt as Timestamp)?.toMillis?.() ?? 0,
  } as OnlineOda;
}

export function katilanRoomBekle(
  oyuncuId: string,
  onBulundu: (roomId: string, oda: OnlineOda) => void,
): Unsubscribe | null {
  if (!firebaseAktif || !db) return null;

  const q = query(
    collection(db, "rooms"),
    where("player2.id", "==", oyuncuId),
    where("status", "==", "in_progress"),
    limit(1),
  );

  return onSnapshot(q, (snap) => {
    if (snap.empty) return;
    const d = snap.docs[0];
    const data = d.data() as Omit<OnlineOda, "createdAt"> & {
      createdAt?: number | Timestamp;
    };
    const oda: OnlineOda = {
      ...data,
      createdAt: typeof data.createdAt === "number"
        ? data.createdAt
        : (data.createdAt as Timestamp)?.toMillis?.() ?? 0,
    } as OnlineOda;
    onBulundu(d.id, oda);
  });
}

// --- Cevap gönder & soru ilerlet ---

export async function cevapGonder(
  roomId: string,
  oyuncuNum: 1 | 2,
  secenekIndex: number,
  dogruMu: boolean,
  bonus: number,
): Promise<void> {
  if (!firebaseAktif || !db || roomId.startsWith("bot_")) return;

  const ref = doc(db!, "rooms", roomId);
  const alan = oyuncuNum === 1 ? "player1" : "player2";

  await runTransaction(db!, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const data = snap.data() as OnlineOda;

    const oyuncu = oyuncuNum === 1 ? data.player1 : data.player2;
    if (!oyuncu) return;
    if (oyuncu.answer !== null) return;
    const yeniSkor = dogruMu ? oyuncu.score + 100 + bonus : oyuncu.score;

    const guncelleme: Record<string, number | null> = {};
    guncelleme[`${alan}.score`] = yeniSkor;
    guncelleme[`${alan}.answer`] = secenekIndex;

    tx.update(ref, guncelleme as Record<string, never>);
  });
}

export async function sonrakiSoru(roomId: string): Promise<void> {
  if (!firebaseAktif || !db || roomId.startsWith("bot_")) return;
  const ref = doc(db!, "rooms", roomId);
  await runTransaction(db!, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const data = snap.data() as OnlineOda;
    const o1Cevap = data.player1.answer;
    const o2Cevap = data.player2?.answer ?? null;
    if (o1Cevap === null || o2Cevap === null) return;
    tx.update(ref, {
      currentIndex: data.currentIndex + 1,
      "player1.answer": null,
      "player2.answer": null,
    });
  });
}

export async function roomBitir(
  roomId: string,
  kazananId: string | null,
): Promise<void> {
  if (!firebaseAktif || !db || roomId.startsWith("bot_")) return;
  const ref = doc(db!, "rooms", roomId);
  await updateDoc(ref, { status: "finished", winnerId: kazananId });
}

export async function roomTerk(
  roomId: string,
  terkEdenId: string,
  digerOyuncuId: string,
): Promise<void> {
  if (!firebaseAktif || !db || roomId.startsWith("bot_")) return;
  const ref = doc(db!, "rooms", roomId);
  await updateDoc(ref, {
    status: "forfeited",
    winnerId: digerOyuncuId,
    forfeitedBy: terkEdenId,
  });
}

// --- Legacy compat exports (for any remaining callers) ---

export type MacDurumu = "aktif" | "bitti" | "terk";

export type OnlineMac = OnlineOda;

export function matchDinle(
  roomId: string,
  onGuncelle: (mac: OnlineMac | null) => void,
): Unsubscribe | null {
  return roomDinle(roomId, onGuncelle);
}

export async function matchGetir(roomId: string): Promise<OnlineMac | null> {
  return roomGetir(roomId);
}

export function katilanMatchBekle(
  oyuncuId: string,
  onBulundu: (matchId: string, mac: OnlineMac) => void,
): Unsubscribe | null {
  return katilanRoomBekle(oyuncuId, onBulundu);
}

export async function matchBitir(
  roomId: string,
  kazananId: string | null,
): Promise<void> {
  return roomBitir(roomId, kazananId);
}

export async function matchTerk(
  roomId: string,
  terkEdenId: string,
  digerOyuncuId: string,
): Promise<void> {
  return roomTerk(roomId, terkEdenId, digerOyuncuId);
}
