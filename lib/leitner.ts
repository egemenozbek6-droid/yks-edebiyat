// lib/leitner.ts

export type LeitnerKutusu = 1 | 2 | 3;

export type KartHafiza = {
  kutu: LeitnerKutusu;
  sonTekrar: number; // timestamp
  tekrarSayisi: number;
};

const STORAGE_KEY = "edebikart_leitner_v1";

const KUTU_ARALIKLARI: Record<LeitnerKutusu, number> = {
  1: 0,
  2: 3 * 24 * 60 * 60 * 1000,
  3: 7 * 24 * 60 * 60 * 1000,
};

export function leitnerVerileriniGetir(): Record<string, KartHafiza> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function kartHafizaGetir(kartId: string): KartHafiza {
  const veriler = leitnerVerileriniGetir();
  return (
    veriler[kartId] ?? {
      kutu: 1,
      sonTekrar: 0,
      tekrarSayisi: 0,
    }
  );
}

export function kartOgrenildiKaydet(kartId: string): KartHafiza {
  const veriler = leitnerVerileriniGetir();
  const mevcut = veriler[kartId] ?? { kutu: 1, sonTekrar: 0, tekrarSayisi: 0 };

  const yeniKutu = Math.min(3, mevcut.kutu + 1) as LeitnerKutusu;
  const guncel: KartHafiza = {
    kutu: yeniKutu,
    sonTekrar: Date.now(),
    tekrarSayisi: mevcut.tekrarSayisi + 1,
  };

  veriler[kartId] = guncel;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(veriler));
  }
  return guncel;
}

export function kartTekrarKaydet(kartId: string): KartHafiza {
  const veriler = leitnerVerileriniGetir();
  const mevcut = veriler[kartId] ?? { kutu: 1, sonTekrar: 0, tekrarSayisi: 0 };

  const guncel: KartHafiza = {
    kutu: 1,
    sonTekrar: Date.now(),
    tekrarSayisi: mevcut.tekrarSayisi + 1,
  };

  veriler[kartId] = guncel;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(veriler));
  }
  return guncel;
}

export function kartTekrarGerekiyorMu(kartId: string): boolean {
  const hafiza = kartHafizaGetir(kartId);
  if (hafiza.sonTekrar === 0) return true;
  const beklemeSuresi = KUTU_ARALIKLARI[hafiza.kutu];
  return Date.now() - hafiza.sonTekrar >= beklemeSuresi;
}

// Bitki temalı minimal rozetler
export function kutuRozetBilgisi(kutu: LeitnerKutusu): {
  etiket: string;
  renk: string;
  bg: string;
} {
  switch (kutu) {
    case 1:
      return {
        etiket: "🌱 Kutu 1",
        renk: "text-amber-500",
        bg: "bg-amber-500/10 ring-amber-500/25",
      };
    case 2:
      return {
        etiket: "🌿 Kutu 2",
        renk: "text-sky-400",
        bg: "bg-sky-400/10 ring-sky-400/25",
      };
    case 3:
      return {
        etiket: "🌳 Kutu 3",
        renk: "text-emerald-400",
        bg: "bg-emerald-400/10 ring-emerald-400/25",
      };
  }
}
