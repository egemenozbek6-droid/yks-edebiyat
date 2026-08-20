// ============================================================
// EdebiKart — Tip tanımları
// Firebase Auth & Firestore'a geçişte aynı arayüz korunacak.
// ============================================================

export type AvatarId = string;

export type Kullanici = {
  kullaniciAdi: string;
  avatar: AvatarId;
  olusturmaTarihi: number;
  hasChangedUsername?: boolean;
};

export type Istatistik = {
  kullaniciAdi: string;
  puan: number;
  macSayisi: number;
  galibiyet: number;
  maglubiyet: number;
  seri: number;
};

export type RankKademe = {
  ad: string;
  min: number;
  max: number;
  ikon: string;
  renk: string;
};

export const RANK_KADEMELERI: RankKademe[] = [
  { ad: "YKS Adayı", min: 0, max: 99, ikon: "🎓", renk: "#64748b" },
  { ad: "Eser Çırağı", min: 100, max: 249, ikon: "📖", renk: "#10b981" },
  { ad: "Banko Avcısı", min: 250, max: 499, ikon: "🎯", renk: "#f59e0b" },
  { ad: "Düello Ustası", min: 500, max: 749, ikon: "⚔️", renk: "#dc2626" },
  { ad: "Derece Adayı", min: 750, max: 999, ikon: "🏆", renk: "#a855f7" },
  { ad: "Edebiyat Üstadı", min: 1000, max: 1499, ikon: "👑", renk: "#eab308" },
  { ad: "Edebiyat Efsanesi", min: 1500, max: 999999, ikon: "⚡", renk: "#06b6d4" },
];

export function rankBul(puan: number): RankKademe {
  return RANK_KADEMELERI.find((k) => puan >= k.min && puan <= k.max) ?? RANK_KADEMELERI[0];
}

export function sonrakiRank(puan: number): RankKademe | null {
  const simdiki = rankBul(puan);
  const idx = RANK_KADEMELERI.indexOf(simdiki);
  return idx < RANK_KADEMELERI.length - 1 ? RANK_KADEMELERI[idx + 1] : null;
}

export type KartSeviye = {
  // literatureItem.id -> seviye (1..5)
  [kartId: number]: number;
};

export type MacSonucu = {
  kazandi: boolean;
  berabere: boolean;
  hukmenGalibiyet: boolean;
  oyuncuSkor: number;
  rakipSkor: number;
  rakipAdi: string;
  puanKazandi: number;
  seri: number;
  ranked: boolean;
};

export type DueloModu = "ranked" | "friendly";

export type Rakip = {
  ad: string;
  avatar: AvatarId;
  bot: boolean;
};
