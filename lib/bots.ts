// ============================================================
// EdebiKart — Bot havuzu (gerçekçi YKS tarzı kullanıcı adları)
// ============================================================

import { rastgeleAvatarId } from "./avatars";
import type { Rakip } from "./types";

export const BOT_HAVUZU: { ad: string; avatar: string }[] = [
  { ad: "EdebiyatBükücü", avatar: "kitap" },
  { ad: "Dicle_YKS26", avatar: "alev" },
  { ad: "Karakalem_06", avatar: "kalem" },
  { ad: "DivanUzmanı", avatar: "saat" },
  { ad: "DereceHedef26", avatar: "yildiz" },
  { ad: "Tanzimatci_Efe", avatar: "yaprak" },
  { ad: "ServetIFunun_27", avatar: "gunes" },
  { ad: "FecrIAti_Zeynep", avatar: "ay" },
  { ad: "Cumhuriyetci_45", avatar: "dag" },
  { ad: "AsikEdebiyat", avatar: "deniz" },
  { ad: "BesHececi_Ali", avatar: "ruze" },
  { ad: "GaripOkur_26", avatar: "kusu" },
  { ad: "IkinciYeni_Deniz", avatar: "kelebek" },
  { ad: "KoyRomanci_Selin", avatar: "aslan" },
  { ad: "ToplumcuGercekci", avatar: "tilki" },
  { ad: "MizahUstasi_61", avatar: "kurt" },
  { ad: "BankoEserci_26", avatar: "yildiz" },
  { ad: "EzberHedefi_2026", avatar: "alev" },
  { ad: "EdebiyatTarihi_27", avatar: "kitap" },
  { ad: "SairBakisi_34", avatar: "ay" },
  { ad: "OsmanliKlasik", avatar: "saat" },
  { ad: "MilliEdebiyat_23", avatar: "dag" },
  { ad: "YazarEserBilgi", avatar: "kalem" },
  { ad: "AYT_Hedefi_2026", avatar: "gunes" },
];

export function rastgeleBot(): Rakip {
  const secim = BOT_HAVUZU[Math.floor(Math.random() * BOT_HAVUZU.length)];
  return { ad: secim.ad, avatar: secim.avatar, bot: true };
}

// Bot davranış simülasyonu
export function botGecikme(): number {
  // 1.5s - 7s arası gerçekçi insan gecikmesi
  return 1500 + Math.random() * 5500;
}

export function botDogruMu(accuracy: number = 0.7): boolean {
  return Math.random() < accuracy;
}

export function botBonus(): number {
  return Math.round(Math.random() * 50);
}

// Bot'un bu soruyu kaç saniyede cevapladığını simüle et (hız bonusu için)
export function botCevapSuresi(): number {
  return 1.5 + Math.random() * 5.5;
}
