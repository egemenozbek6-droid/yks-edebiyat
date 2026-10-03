import {
  gecerliYazarlar,
  yakinDonemler,
  bankoVeriler,
  anaDonemBul,
  type LiteratureItem,
} from "@/src/data";

export type Soru = {
  metin: string;
  vurgu: string;
  secenekler: string[];
  dogru: string;
  donem: string;
  // "eser" | "yazar" -> mevcut Dönem/ÖSYM testleri
  // "kahraman" / "eser2" -> Eser-Kahraman
  // "akim_*" / "*_akim" -> Batı Edebi Akımları
  tip:
    | "eser"
    | "yazar"
    | "kahraman"
    | "eser2"
    // Batı Edebi Akımları
    | "akim_temsilci"
    | "temsilci_akim"
    | "akim_slogan"
    | "slogan_akim"
    | "akim_ozellik"
    | "ozellik_akim";
  osymFreq?: string;
  aciklama?: string;
};

export function karistir<T>(dizi: T[]): T[] {
  const kopya = [...dizi];
  for (let i = kopya.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopya[i], kopya[j]] = [kopya[j], kopya[i]];
  }
  return kopya;
}

function ayniAnaDonem(item: LiteratureItem, y: LiteratureItem): boolean {
  return anaDonemBul(y.period) === anaDonemBul(item.period);
}

/**
 * Çeldirici: önce aynı dönem + aynı tür, sonra aynı ana dönem, sonra 1 komşu.
 * Tüm edebiyattan rastgele isim çekilmez.
 */
function celdiriciUret(
  item: LiteratureItem,
  tip: "eser" | "yazar",
  adet: number,
): string[] {
  const dogru = tip === "eser" ? item.author : item.work;
  const ayniAna = yakinDonemler(item.period, 0);
  const yakin = yakinDonemler(item.period, 1);

  const uygun = (donemler: string[]) =>
    gecerliYazarlar().filter(
      (y) =>
        donemler.includes(y.period) &&
        String(y.id) !== String(item.id) &&
        y.author !== item.author,
    );

  const katmanlar: LiteratureItem[][] = [
    uygun(ayniAna).filter((y) => item.genre && y.genre && y.genre === item.genre),
    uygun(ayniAna),
    uygun(yakin),
  ];

  const deger = (y: LiteratureItem) => (tip === "eser" ? y.author : y.work);
  const out: string[] = [];
  const gorulen = new Set<string>([dogru]);
  for (const katman of katmanlar) {
    for (const ad of karistir(katman.map(deger))) {
      if (!ad || gorulen.has(ad)) continue;
      gorulen.add(ad);
      out.push(ad);
      if (out.length >= adet) return out;
    }
  }
  return out;
}

function yazarYedek(item: LiteratureItem, yanlislar: string[], eksik: number): string[] {
  const yedek = karistir(
    Array.from(
      new Set(
        gecerliYazarlar()
          .filter((y) => y.author !== item.author && ayniAnaDonem(item, y))
          .map((y) => y.author),
      ),
    ),
  ).filter((a) => !yanlislar.includes(a));
  return yedek.slice(0, eksik);
}

function eserYedek(item: LiteratureItem, yanlislar: string[], eksik: number): string[] {
  const yedek = karistir(
    Array.from(
      new Set(
        gecerliYazarlar()
          .filter((y) => y.work !== item.work && ayniAnaDonem(item, y))
          .map((y) => y.work),
      ),
    ),
  ).filter((w) => !yanlislar.includes(w));
  return yedek.slice(0, eksik);
}

/** Belirli bir havuzdan test soruları üretir (eser/yazar %50 karışık). */
export function sorulariUret(havuz: LiteratureItem[]): Soru[] {
  const soruSayisi = Math.min(havuz.length, 20);

  return karistir(havuz)
    .slice(0, soruSayisi)
    .map((item): Soru => {
      const eserSoruluyor = Math.random() < 0.5;

      if (eserSoruluyor) {
        let yanlislar = celdiriciUret(item, "eser", 3);
        const eksik = 3 - yanlislar.length;
        if (eksik > 0) yanlislar = [...yanlislar, ...yazarYedek(item, yanlislar, eksik)];
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

      let yanlislar = celdiriciUret(item, "yazar", 3);
      const eksik = 3 - yanlislar.length;
      if (eksik > 0) yanlislar = [...yanlislar, ...eserYedek(item, yanlislar, eksik)];
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

/** ÖSYM Sever modu için "banko" sorular — her çağrıda tamamen rastgele 20 soru */
export function osymSeverSorulari(soruSayisi = 20): Soru[] {
  const banko = bankoVeriler();
  const karisik = karistir(banko);
  const secili = karisik.slice(0, Math.min(soruSayisi, banko.length));
  return secili.map((item): Soru => {
    const eserSoruluyor = Math.random() < 0.5;

    if (eserSoruluyor) {
      let yanlislar = celdiriciUret(item, "eser", 3);
      const eksik = 3 - yanlislar.length;
      if (eksik > 0) yanlislar = [...yanlislar, ...yazarYedek(item, yanlislar, eksik)];
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

    let yanlislar = celdiriciUret(item, "yazar", 3);
    const eksik = 3 - yanlislar.length;
    if (eksik > 0) yanlislar = [...yanlislar, ...eserYedek(item, yanlislar, eksik)];
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
