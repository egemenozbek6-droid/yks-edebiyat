// ============================================================
// EdebiKart — Avatar havuzu (kategorili, lig kilitli)
// ============================================================

import { RANK_KADEMELERI, rankBul } from "./types";

export { RANK_KADEMELERI };

export type AvatarKategori = "standart" | "prestij";

export const AVATARLAR: { id: string; emoji: string; etiket: string; minEP: number; kategori: AvatarKategori; minLig: number }[] = [
  // Standart (tüm ligler, 0 EP)
  { id: "kitap", emoji: "📚", etiket: "Kitap", minEP: 0, kategori: "standart", minLig: 0 },
  { id: "kalem", emoji: "✒️", etiket: "Kalem", minEP: 0, kategori: "standart", minLig: 0 },
  { id: "saat", emoji: "⏳", etiket: "Saat", minEP: 0, kategori: "standart", minLig: 0 },
  { id: "alev", emoji: "🔥", etiket: "Alev", minEP: 0, kategori: "standart", minLig: 0 },
  { id: "yildiz", emoji: "⭐", etiket: "Yıldız", minEP: 0, kategori: "standart", minLig: 0 },
  { id: "gunes", emoji: "☀️", etiket: "Güneş", minEP: 0, kategori: "standart", minLig: 0 },
  { id: "ay", emoji: "🌙", etiket: "Ay", minEP: 0, kategori: "standart", minLig: 0 },
  { id: "dag", emoji: "⛰️", etiket: "Dağ", minEP: 0, kategori: "standart", minLig: 0 },
  { id: "deniz", emoji: "🌊", etiket: "Deniz", minEP: 0, kategori: "standart", minLig: 0 },
  { id: "yaprak", emoji: "🍃", etiket: "Yaprak", minEP: 0, kategori: "standart", minLig: 0 },
  { id: "ruze", emoji: "🦉", etiket: "Baykuş", minEP: 0, kategori: "standart", minLig: 0 },
  { id: "yazar", emoji: "✍️", etiket: "Yazar", minEP: 0, kategori: "standart", minLig: 0 },
  // Prestij — lig bazlı kilitli
  // Lig 3 (Banko Avcısı, 250+ EP): ilk 3 prestij avatar
  { id: "ampul", emoji: "💡", etiket: "Ampül", minEP: 250, kategori: "prestij", minLig: 3 },
  { id: "aslan", emoji: "🦁", etiket: "Aslan", minEP: 250, kategori: "prestij", minLig: 3 },
  { id: "tilki", emoji: "🦊", etiket: "Tilki", minEP: 250, kategori: "prestij", minLig: 3 },
  // Lig 4 (Düello Ustası, 500+ EP): sonraki 3 prestij avatar
  { id: "kusu", emoji: "🦅", etiket: "Kartal", minEP: 500, kategori: "prestij", minLig: 4 },
  { id: "firca", emoji: "🖌️", etiket: "Fırça", minEP: 500, kategori: "prestij", minLig: 4 },
  { id: "kurt", emoji: "🐺", etiket: "Kurt", minEP: 500, kategori: "prestij", minLig: 4 },
  // Lig 5 (Derece Adayı, 750+ EP): sonraki 2 prestij avatar
  { id: "kelebek", emoji: "🦋", etiket: "Kelebek", minEP: 750, kategori: "prestij", minLig: 5 },
  { id: "parşomen", emoji: "📜", etiket: "Parşömen", minEP: 750, kategori: "prestij", minLig: 5 },
  // Lig 6 (Edebiyat Üstadı, 1000+ EP): sonraki 2 prestij avatar
  { id: "maske", emoji: "🎭", etiket: "Maske", minEP: 1000, kategori: "prestij", minLig: 6 },
  { id: "mum", emoji: "🕯️", etiket: "Mum", minEP: 1000, kategori: "prestij", minLig: 6 },
  // Lig 7 (Edebiyat Efsanesi, 1500+ EP): özel taç/avatar
  { id: "mezuniyet", emoji: "🎓", etiket: "Kavuk", minEP: 1500, kategori: "prestij", minLig: 7 },
  { id: "kalkan", emoji: "🛡️", etiket: "Kalkan", minEP: 1500, kategori: "prestij", minLig: 7 },
  { id: "tapinak", emoji: "🏛️", etiket: "Tapınak", minEP: 1500, kategori: "prestij", minLig: 7 },
  { id: "kilic", emoji: "⚔️", etiket: "Çift Kılıç", minEP: 1500, kategori: "prestij", minLig: 7 },
  { id: "tac", emoji: "👑", etiket: "Kral Tacı", minEP: 1500, kategori: "prestij", minLig: 7 },
];

// Oyuncunun lig indeksini bul (0-based: 0=YKS Adayı ... 6=Edebiyat Efsanesi)
export function ligIndeksi(puan: number): number {
  const rank = rankBul(puan);
  return RANK_KADEMELERI.indexOf(rank);
}

export function avatarKilitli(minEP: number, mevcutEP: number): boolean {
  return mevcutEP < minEP;
}

// Lig bazlı kilit kontrolü — prestij avatarlar için
export function avatarLigKilitli(minLig: number, mevcutEP: number): boolean {
  if (minLig === 0) return false;
  return ligIndeksi(mevcutEP) < minLig - 1; // minLig 3 → 0-based index 2
}

export function avatarEmoji(id: string): string {
  return AVATARLAR.find((a) => a.id === id)?.emoji ?? "📚";
}

export function rastgeleAvatarId(): string {
  const aciklar = AVATARLAR.filter((a) => a.minEP === 0);
  return aciklar[Math.floor(Math.random() * aciklar.length)].id;
}

// Kilitli avatar için açılma rank adını bul
export function avatarRankAd(minEP: number): string {
  const rank = RANK_KADEMELERI.find((k) => minEP >= k.min && minEP <= k.max);
  return rank?.ad ?? "Üstat";
}
