// ============================================================
// EdebiKart — Avatar havuzu
// ============================================================

export const AVATARLAR: { id: string; emoji: string; etiket: string }[] = [
  { id: "kitap", emoji: "📚", etiket: "Kitap" },
  { id: "kalem", emoji: "✒️", etiket: "Kalem" },
  { id: "saat", emoji: "⏳", etiket: "Saat" },
  { id: "alev", emoji: "🔥", etiket: "Alev" },
  { id: "yildiz", emoji: "⭐", etiket: "Yıldız" },
  { id: "gunes", emoji: "☀️", etiket: "Güneş" },
  { id: "ay", emoji: "🌙", etiket: "Ay" },
  { id: "dag", emoji: "⛰️", etiket: "Dağ" },
  { id: "deniz", emoji: "🌊", etiket: "Deniz" },
  { id: "yaprak", emoji: "🍃", etiket: "Yaprak" },
  { id: "ruze", emoji: "🦉", etiket: "Baykuş" },
  { id: "kusu", emoji: "🦅", etiket: "Kartal" },
  { id: "aslan", emoji: "🦁", etiket: "Aslan" },
  { id: "tilki", emoji: "🦊", etiket: "Tilki" },
  { id: "kurt", emoji: "🐺", etiket: "Kurt" },
  { id: "kelebek", emoji: "🦋", etiket: "Kelebek" },
];

export function avatarEmoji(id: string): string {
  return AVATARLAR.find((a) => a.id === id)?.emoji ?? "📚";
}

export function rastgeleAvatarId(): string {
  return AVATARLAR[Math.floor(Math.random() * AVATARLAR.length)].id;
}
