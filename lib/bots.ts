// ============================================================
// EdebiKart — Bot havuzu (gerçekçi YKS tarzı kullanıcı adları)
// ============================================================

import { rastgeleAvatarId } from "./avatars";
import type { Rakip } from "./types";

export const BOT_HAVUZU: { ad: string; avatar: string }[] = [
  // --- Kesin İstediklerin (Özelleştirilmiş) ---
  { ad: "13killoki", avatar: "kurt" },
  { ad: "eslo_27", avatar: "alev" },
  { ad: "egohan_45", avatar: "aslan" },
  { ad: "nurhak.ea", avatar: "dag" },
  { ad: "yunusvurgun61", avatar: "deniz" },
  { ad: "yusuf_yks27", avatar: "kitap" },
  { ad: "aliş_10", avatar: "yildiz" },
  { ad: "alibey.06", avatar: "tac" },
  { ad: "edebiyatkrali_1", avatar: "tac" },
  { ad: "m.topal_16", avatar: "kurt" },
  { ad: "mezun3_hedef", avatar: "saat" },
  { ad: "mezun6_ayt", avatar: "kum_saati" },
  { ad: "motive2m_ea", avatar: "alev" },
  { ad: "ituhayali_27", avatar: "yildiz" },
  { ad: "baykusyiyen", avatar: "baykus" },
  { ad: "hedefmsku_48", avatar: "gunes" },

  // --- Gıcık & Tilt Eden Rekabetçi Nickler ---
  { ad: "ez_win_bb", avatar: "tac" },
  { ad: "aglama_oyna", avatar: "alev" },
  { ad: "kitap_acmadim", avatar: "ay" },
  { ad: "calismadan24", avatar: "yildiz" },
  { ad: "kolaydi_knk", avatar: "tilki" },
  { ad: "ayt_cerez", avatar: "hedef" },
  { ad: "tek_attim_gec", avatar: "aslan" },
  { ad: "soruyu_oku_bi", avatar: "baykus" },
  { ad: "ezberbozan_xd", avatar: "alev" },
  { ad: "full_cektim_sry", avatar: "tac" },
  { ad: "mezun_aglatir", avatar: "kum_saati" },
  { ad: "sayisalciyim_ea", avatar: "saat" },
  { ad: "sen_de_calis", avatar: "kalem" },

  // --- Üniversite & Hedef Odaklı Nickler ---
  { ad: "boun_yolcusu", avatar: "yildiz" },
  { ad: "hukukcu_biri", avatar: "terazi" },
  { ad: "odtu_ruhu", avatar: "dag" },
  { ad: "ankarahukuk_06", avatar: "kitap" },
  { ad: "ege_tipci", avatar: "deniz" },
  { ad: "marmara_ea", avatar: "gunes" },
  { ad: "psiko_hedef27", avatar: "kelebek" },
  { ad: "hedefankara06", avatar: "hedef" },

  // --- Edebiyat & YKS Çalışma Tayfası ---
  { ad: "ayt24te24_net", avatar: "hedef" },
  { ad: "banko24_net", avatar: "alev" },
  { ad: "tanzimatkolik", avatar: "yaprak" },
  { ad: "divansairi_99", avatar: "ay" },
  { ad: "aruzcu_genc", avatar: "tuy_kalem" },
  { ad: "garipci_kaan", avatar: "baykus" },
  { ad: "ikinciyenicim", avatar: "kelebek" },
  { ad: "sozelci_bey", avatar: "kitap" },
  { ad: "edebiyatkolik", avatar: "alev" },
  { ad: "berke_ea27", avatar: "kalem" },
  { ad: "irem.yks26", avatar: "kelebek" },
  { ad: "elifnaz_34", avatar: "gunes" },
  { ad: "burak.06", avatar: "kurt" },
  { ad: "selin_edb27", avatar: "tilki" },
  { ad: "can_ea01", avatar: "aslan" },
  { ad: "kuzey.yks", avatar: "dag" },
  { ad: "gececiler_27", avatar: "ay" },
  { ad: "zeynep.notlar", avatar: "kitap" },
  { ad: "mert_sayisal", avatar: "saat" },
  { ad: "denemecanavari", avatar: "alev" },
  { ad: "sonduzluk27", avatar: "kum_saati" },
  { ad: "paragrafzede", avatar: "kitap" },
  { ad: "dereceisteyen", avatar: "yildiz" },
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
  return 0;
}

// Bot'un bu soruyu kaç saniyede cevapladığını simüle et (hız bonusu için)
export function botCevapSuresi(): number {
  return 1.5 + Math.random() * 5.5;
}
