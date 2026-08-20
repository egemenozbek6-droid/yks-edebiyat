// ============================================================
// EdebiKart — Avatar havuzu
// ============================================================

export const AVATARLAR: { id: string; emoji: string; etiket: string; minEP: number }[] = [
  { id: "kitap", emoji: "📚", etiket: "Kitap", minEP: 0 },
  { id: "kalem", emoji: "✒️", etiket: "Kalem", minEP: 0 },
  { id: "saat", emoji: "⏳", etiket: "Saat", minEP: 0 },
  { id: "alev", emoji: "🔥", etiket: "Alev", minEP: 0 },
  { id: "yildiz", emoji: "⭐", etiket: "Yıldız", minEP: 0 },
  { id: "gunes", emoji: "☀️", etiket: "Güneş", minEP: 0 },
  { id: "ay", emoji: "🌙", etiket: "Ay", minEP: 0 },
  { id: "dag", emoji: "⛰️", etiket: "Dağ", minEP: 0 },
  { id: "deniz", emoji: "🌊", etiket: "Deniz", minEP: 0 },
  { id: "yaprak", emoji: "🍃", etiket: "Yaprak", minEP: 0 },
  { id: "ruze", emoji: "🦉", etiket: "Baykuş", minEP: 0 },
  { id: "kusu", emoji: "🦅", etiket: "Kartal", minEP: 100 },
  { id: "aslan", emoji: "🦁", etiket: "Aslan", minEP: 100 },
  { id: "tilki", emoji: "🦊", etiket: "Tilki", minEP: 100 },
  { id: "kurt", emoji: "🐺", etiket: "Kurt", minEP: 200 },
  { id: "kelebek", emoji: "🦋", etiket: "Kelebek", minEP: 200 },
  { id: "parşomen", emoji: "📜", etiket: "Parşömen", minEP: 300 },
  { id: "tapinak", emoji: "🏛️", etiket: "Tapınak", minEP: 400 },
  { id: "mum", emoji: "🕯️", etiket: "Mum", minEP: 300 },
  { id: "tac", emoji: "👑", etiket: "Taç", minEP: 500 },
  { id: "maske", emoji: "🎭", etiket: "Maske", minEP: 350 },
  { id: "firca", emoji: "🖌️", etiket: "Fırça", minEP: 250 },
  { id: "ampul", emoji: "💡", etiket: "Ampül", minEP: 150 },
  { id: "mezuniyet", emoji: "🎓", etiket: "Kavuk", minEP: 400 },
  { id: "kilic", emoji: "⚔️", etiket: "Kılıç", minEP: 500 },
  { id: "kalkan", emoji: "🛡️", etiket: "Kalkan", minEP: 450 },
  { id: "yazar", emoji: "✍️", etiket: "Yazar", minEP: 0 },
];

export function avatarKilitli(minEP: number, mevcutEP: number): boolean {
  return mevcutEP < minEP;
}

export function avatarEmoji(id: string): string {
  return AVATARLAR.find((a) => a.id === id)?.emoji ?? "📚";
}

export function rastgeleAvatarId(): string {
  return AVATARLAR[Math.floor(Math.random() * AVATARLAR.length)].id;
}
