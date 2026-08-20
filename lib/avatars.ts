// ============================================================
// EdebiKart — Avatar havuzu (kategorili, EP kilitli)
// ============================================================

import { RANK_KADEMELERI } from "./types";

export type AvatarKategori = "standart" | "prestij";

export const AVATARLAR: { id: string; emoji: string; etiket: string; minEP: number; kategori: AvatarKategori }[] = [
  // Standart (0 EP)
  { id: "kitap", emoji: "📚", etiket: "Kitap", minEP: 0, kategori: "standart" },
  { id: "kalem", emoji: "✒️", etiket: "Kalem", minEP: 0, kategori: "standart" },
  { id: "saat", emoji: "⏳", etiket: "Saat", minEP: 0, kategori: "standart" },
  { id: "alev", emoji: "🔥", etiket: "Alev", minEP: 0, kategori: "standart" },
  { id: "yildiz", emoji: "⭐", etiket: "Yıldız", minEP: 0, kategori: "standart" },
  { id: "gunes", emoji: "☀️", etiket: "Güneş", minEP: 0, kategori: "standart" },
  { id: "ay", emoji: "🌙", etiket: "Ay", minEP: 0, kategori: "standart" },
  { id: "dag", emoji: "⛰️", etiket: "Dağ", minEP: 0, kategori: "standart" },
  { id: "deniz", emoji: "🌊", etiket: "Deniz", minEP: 0, kategori: "standart" },
  { id: "yaprak", emoji: "🍃", etiket: "Yaprak", minEP: 0, kategori: "standart" },
  { id: "ruze", emoji: "🦉", etiket: "Baykuş", minEP: 0, kategori: "standart" },
  { id: "yazar", emoji: "✍️", etiket: "Yazar", minEP: 0, kategori: "standart" },
  // Prestij — kademeli EP kilitli
  { id: "ampul", emoji: "💡", etiket: "Ampül", minEP: 150, kategori: "prestij" },
  { id: "kusu", emoji: "🦅", etiket: "Kartal", minEP: 250, kategori: "prestij" },
  { id: "aslan", emoji: "🦁", etiket: "Aslan", minEP: 150, kategori: "prestij" },
  { id: "tilki", emoji: "🦊", etiket: "Tilki", minEP: 150, kategori: "prestij" },
  { id: "firca", emoji: "🖌️", etiket: "Fırça", minEP: 250, kategori: "prestij" },
  { id: "kurt", emoji: "🐺", etiket: "Kurt", minEP: 200, kategori: "prestij" },
  { id: "kelebek", emoji: "🦋", etiket: "Kelebek", minEP: 200, kategori: "prestij" },
  { id: "parşomen", emoji: "📜", etiket: "Parşömen", minEP: 250, kategori: "prestij" },
  { id: "maske", emoji: "🎭", etiket: "Maske", minEP: 350, kategori: "prestij" },
  { id: "mum", emoji: "🕯️", etiket: "Mum", minEP: 300, kategori: "prestij" },
  { id: "mezuniyet", emoji: "🎓", etiket: "Kavuk", minEP: 400, kategori: "prestij" },
  { id: "kalkan", emoji: "🛡️", etiket: "Kalkan", minEP: 450, kategori: "prestij" },
  { id: "tapinak", emoji: "🏛️", etiket: "Tapınak", minEP: 500, kategori: "prestij" },
  { id: "kilic", emoji: "⚔️", etiket: "Çift Kılıç", minEP: 500, kategori: "prestij" },
  { id: "tac", emoji: "👑", etiket: "Kral Tacı", minEP: 750, kategori: "prestij" },
];

export function avatarKilitli(minEP: number, mevcutEP: number): boolean {
  return mevcutEP < minEP;
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
