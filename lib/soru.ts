import {
  gecerliYazarlar,
  yakinDonemler,
  bankoVeriler,
  type LiteratureItem,
} from "@/src/data";

export type Soru = {
  metin: string;
  vurgu: string;
  secenekler: string[];
  dogru: string;
  donem: string;
  tip: "eser" | "yazar";
  osymFreq?: string;
};

export function karistir<T>(dizi: T[]): T[] {
  const kopya = [...dizi];
  for (let i = kopya.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopya[i], kopya[j]] = [kopya[j], kopya[i]];
  }
  return kopya;
}

/**
 * Bir item için, sorunun ait olduğu döneme yakın dönemlerden
 * çeldirici (yanlış) seçenekler üretir. Uzak dönemlerden seçenek gelmez.
 * Anonim/TÜRK veriler kesinlikle kullanılmaz.
 */
function celdiriciUret(
  item: LiteratureItem,
  tip: "eser" | "yazar",
  adet: number,
): string[] {
  const yakinlar = yakinDonemler(item.period, 2);
  // Aynı veya yakın dönemden, geçerli yazarlar
  const havuz = gecerliYazarlar().filter(
    (y) =>
      yakinlar.includes(y.period) &&
      y.id !== item.id &&
      y.author !== item.author,
  );

  if (tip === "eser") {
    // Şıklarda yazarlar soruluyor — aynı döneme yakın yazar adları çek
    const yazarAdlari = Array.from(new Set(havuz.map((y) => y.author)));
    return karistir(yazarAdlari).slice(0, adet);
  }

  // Şıklarda eserler soruluyor — aynı döneme yakın eserler çek
  const eserler = havuz.map((y) => y.work).filter((w) => w !== item.work);
  const tek = Array.from(new Set(eserler));
  return karistir(tek).slice(0, adet);
}

/** Belirli bir havuzdan test soruları üretir (eser/yazar %50 karışık). */
export function sorulariUret(havuz: LiteratureItem[]): Soru[] {
  // Dinamik soru sayısı: havuzun boyutu kadar (max 20)
  const soruSayisi = Math.min(havuz.length, 20);

  return karistir(havuz)
    .slice(0, soruSayisi)
    .map((item): Soru => {
      // %50 ihtimalle yön belirle
      const eserSoruluyor = Math.random() < 0.5;

      if (eserSoruluyor) {
        // Soruda eser verilsin, şıklarda yazarlar sorulsun
        let yanlislar = celdiriciUret(item, "eser", 3);
        let eksik = 3 - yanlislar.length;
        if (eksik > 0) {
          const yedek = karistir(
            Array.from(
              new Set(
                gecerliYazarlar()
                  .filter((y) => y.author !== item.author)
                  .map((y) => y.author),
              ),
            ),
          ).filter((a) => !yanlislar.includes(a));
          yanlislar = [...yanlislar, ...yedek.slice(0, eksik)];
        }
        return {
          metin: "Aşağıdaki yazarlardan hangisi bu eserin yazarıdır?",
          vurgu: item.work,
          secenekler: karistir([item.author, ...yanlislar]),
          dogru: item.author,
          donem: item.period,
          tip: "yazar",
          osymFreq: item.osym_stats?.osym_freq,
        };
      }

      // Soruda yazar verilsin, şıklarda eserler sorulsun
      let yanlislar = celdiriciUret(item, "yazar", 3);
      let eksik = 3 - yanlislar.length;
      if (eksik > 0) {
        const yedek = karistir(
          Array.from(
            new Set(
              gecerliYazarlar()
                .filter((y) => y.work !== item.work)
                .map((y) => y.work),
            ),
          ),
        ).filter((w) => !yanlislar.includes(w));
        yanlislar = [...yanlislar, ...yedek.slice(0, eksik)];
      }
      return {
        metin: "Aşağıdaki eserlerden hangisi bu yazara aittir?",
        vurgu: item.author,
        secenekler: karistir([item.work, ...yanlislar]),
        dogru: item.work,
        donem: item.period,
        tip: "eser",
        osymFreq: item.osym_stats?.osym_freq,
      };
    });
}

/** ÖSYM Sever modu için "banko" sorular */
export function osymSeverSorulari(): Soru[] {
  return sorulariUret(bankoVeriler());
}
