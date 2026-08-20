// ============================================================
// EdebiKart — Günlük Görevler Sistemi
// Quest 1 her gün sabit, Quest 2 dinamik rotasyon.
// ============================================================

import { oku, yaz } from "./storage";

export type GorevTuru =
  | "ranked_win"
  | "streak_3"
  | "duel_3"
  | "score_100"
  | "correct_10";

export type Gorev = {
  tur: GorevTuru;
  etiket: string;
  aciklama: string;
  odul: number;
  hedef: number;
  ikon: string;
};

export type GorevDurum = {
  tur: GorevTuru;
  ilerleme: number;
  tamamlandi: boolean;
  odulAlindi: boolean;
};

export type GunlukGorevState = {
  tarih: string;
  gorevler: Gorev[];
  durumlar: Record<GorevTuru, GorevDurum>;
};

// Sabit görev 1 — her gün aynı
export const SABIT_GOREV: Gorev = {
  tur: "ranked_win",
  etiket: "Günün İlk Zaferi",
  aciklama: "1 Düello Maçı Kazan",
  odul: 20,
  hedef: 1,
  ikon: "🎯",
};

// Dinamik görev havuzu — quest 2 için her gün rastgele
export const DINAMIK_GOREV_HAVUZU: Gorev[] = [
  {
    tur: "streak_3",
    etiket: "Seri Üstadı",
    aciklama: "3 soruyu üst üste doğru cevapla",
    odul: 15,
    hedef: 1,
    ikon: "⚡",
  },
  {
    tur: "duel_3",
    etiket: "Düello Uzmanı",
    aciklama: "Bugün 3 Düello maçı tamamla",
    odul: 15,
    hedef: 3,
    ikon: "⚔️",
  },
  {
    tur: "score_100",
    etiket: "Yüzü Geç",
    aciklama: "Toplam 100 maç puanı topla",
    odul: 20,
    hedef: 100,
    ikon: "🏆",
  },
  {
    tur: "correct_10",
    etiket: "Bilgin",
    aciklama: "10 soruyu doğru cevapla",
    odul: 15,
    hedef: 10,
    ikon: "🧠",
  },
];

const GOREVLER_YOLU = "gunluk-gorevler";

function bugunTarih(): string {
  return new Date().toISOString().slice(0, 10);
}

function rastgeleDinamikGorev(): Gorev {
  const idx = Math.floor(Math.random() * DINAMIK_GOREV_HAVUZU.length);
  return DINAMIK_GOREV_HAVUZU[idx];
}

function bosDurum(tur: GorevTuru): GorevDurum {
  return { tur, ilerleme: 0, tamamlandi: false, odulAlindi: false };
}

export function gunlukGorevleriGetir(): GunlukGorevState {
  const bugun = bugunTarih();
  const kayitli = oku<GunlukGorevState | null>(GOREVLER_YOLU, null);

  if (!kayitli || kayitli.tarih !== bugun) {
    const dinamik = rastgeleDinamikGorev();
    const secilen = [SABIT_GOREV, dinamik];
    const durumlar = {} as Record<GorevTuru, GorevDurum>;
    for (const g of secilen) {
      durumlar[g.tur] = bosDurum(g.tur);
    }
    const yeniState: GunlukGorevState = {
      tarih: bugun,
      gorevler: secilen,
      durumlar,
    };
    yaz(GOREVLER_YOLU, yeniState);
    return yeniState;
  }

  return kayitli;
}

export function gorevIlerlemeGuncelle(
  tur: GorevTuru,
  artis: number,
): GunlukGorevState {
  const state = gunlukGorevleriGetir();
  const durum = state.durumlar[tur];
  if (!durum || durum.odulAlindi) return state;

  const gorev = state.gorevler.find((g) => g.tur === tur);
  if (!gorev) return state;

  const yeniIlerleme = Math.min(durum.ilerleme + artis, gorev.hedef);
  const tamamlandi = yeniIlerleme >= gorev.hedef;

  state.durumlar[tur] = {
    ...durum,
    ilerleme: yeniIlerleme,
    tamamlandi,
  };
  yaz(GOREVLER_YOLU, state);
  return state;
}

export function gorevOdulAl(tur: GorevTuru): { odul: number; state: GunlukGorevState } {
  const state = gunlukGorevleriGetir();
  const durum = state.durumlar[tur];
  if (!durum || !durum.tamamlandi || durum.odulAlindi) {
    return { odul: 0, state };
  }
  const gorev = state.gorevler.find((g) => g.tur === tur);
  if (!gorev) return { odul: 0, state };

  state.durumlar[tur] = { ...durum, odulAlindi: true };
  yaz(GOREVLER_YOLU, state);
  return { odul: gorev.odul, state };
}

// Maç olaylarını görev ilerlemesine yansıt
export function macOlayiKaydet(olay: {
  rankedWin?: boolean;
  streak3?: boolean;
  duelTamamlandi?: boolean;
  matchScore?: number;
  correctCount?: number;
}): void {
  if (olay.rankedWin) {
    gorevIlerlemeGuncelle("ranked_win", 1);
  }
  if (olay.streak3) {
    gorevIlerlemeGuncelle("streak_3", 1);
  }
  if (olay.duelTamamlandi) {
    gorevIlerlemeGuncelle("duel_3", 1);
  }
  if (olay.matchScore) {
    gorevIlerlemeGuncelle("score_100", olay.matchScore);
  }
  if (olay.correctCount) {
    gorevIlerlemeGuncelle("correct_10", olay.correctCount);
  }
}
