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
};

export const RANK_KADEMELERI: RankKademe[] = [
  { ad: "Toy Çırak", min: 0, max: 100, ikon: "🌱" },
  { ad: "Çömez Şair", min: 101, max: 350, ikon: "✍️" },
  { ad: "Edebiyat Müdavimi", min: 351, max: 800, ikon: "📚" },
  { ad: "Servet-i Fünuncu", min: 801, max: 1500, ikon: "🖋️" },
  { ad: "Üstat", min: 1501, max: 2500, ikon: "🎓" },
  { ad: "Edebiyat Ordusu Kaptanı", min: 2501, max: 999999, ikon: "👑" },
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
