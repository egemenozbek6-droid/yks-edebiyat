// ============================================================
// EdebiKart — Tip tanımları
// Firebase Auth & Firestore'a geçişte aynı arayüz korunacak.
// ============================================================

export type AvatarId = string;

export type Kullanici = {
  kullaniciAdi: string;
  avatar: AvatarId;
  olusturmaTarihi: number;
};

export type Istatistik = {
  kullaniciAdi: string;
  puan: number;
  macSayisi: number;
  galibiyet: number;
  maglubiyet: number;
  seri: number;
};

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
