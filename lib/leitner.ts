// lib/leitner.ts

export type LeitnerKutusu = 1 | 2 | 3;

export type KartHafiza = {
  kutu: LeitnerKutusu;
  sonTekrar: number; // timestamp
  tekrarSayisi: number;
};

const STORAGE_KEY = "edebikart_leitner_v1";

// Kutu aralıkları (gün bazında)
// Kutu 1: Her gün (0 gün)
// Kutu 2: 3 gün sonra
// Kutu 3: 7 gün sonra
const KUTU_ARALIKLARI: Record<LeitnerKutusu, number> = {
  1: 0,
  2: 3 * 24 * 60 * 60 * 1000,
  3: 7 * 24 * 60 * 60 * 1000,
};

// Tüm hafıza verisini getir
export function leitnerVerileriniGetir(): Record<string, KartHafiza> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Belirli bir kartın durumunu getir
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

// Kart bilindiğinde ("Kaptım"): Kutu bir üst seviyeye çıkar (max 3)
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

// Kart bilinmediğinde ("Tekrar Et"): Doğrudan Kutu 1'e geri düşer
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

// Kartın bugün tekrar zamanı gelmiş mi?
export function kartTekrarGerekiyorMu(kartId: string): boolean {
  const hafiza = kartHafizaGetir(kartId);
  if (hafiza.sonTekrar === 0) return true; // Hiç bakılmamışsa gerekiyor
  const beklemeSuresi = KUTU_ARALIKLARI[hafiza.kutu];
  return Date.now() - hafiza.sonTekrar >= beklemeSuresi;
}

// Kutuya göre UI etiket ve renk bilgisi
export function kutuRozetBilgisi(kutu: LeitnerKutusu): {
  etiket: string;
  renk: string;
  bg: string;
} {
  switch (kutu) {
    case 1:
      return {
        etiket: "Kutu 1 · Öğreniliyor",
        renk: "text-amber-500",
        bg: "bg-amber-500/10 ring-amber-500/25",
      };
    case 2:
      return {
        etiket: "Kutu 2 · Pekiştiriliyor",
        renk: "text-sky-500",
        bg: "bg-sky-500/10 ring-sky-500/25",
      };
    case 3:
      return {
        etiket: "Kutu 3 · Hafızada",
        renk: "text-emerald-500",
        bg: "bg-emerald-500/10 ring-emerald-500/25",
      };
  }
}
