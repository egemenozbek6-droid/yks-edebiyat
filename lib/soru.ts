import { yazarlar, yakinDonemler, type Donem, type Yazar } from "@/data/yazarlar";

export type Soru = {
  metin: string;
  vurgu: string;
  secenekler: string[];
  dogru: string;
  donem: Donem;
  tip: "eser" | "yazar";
};

export function karistir<T>(dizi: T[]): T[] {
  const kopya = [...dizi];
  for (let i = kopya.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopya[i], kopya[j]] = [kopya[j], kopya[i]];
  }
  return kopya;
}

function rastgele<T>(dizi: T[]): T | undefined {
  return dizi[Math.floor(Math.random() * dizi.length)];
}

/**
 * Bir yazar için, sorunun ait olduğu döneme yakın dönemlerden
 * çeldirici (yanlış) seçenekler üretir. Uzak dönemlerden seçenek gelmez.
 */
function celdiriciUret(
  yazar: Yazar,
  tip: "eser" | "yazar",
  adet: number,
): string[] {
  const yakinlar = yakinDonemler(yazar.donem, 2);
  const havuz = yazarlar.filter((y) => yakinlar.includes(y.donem) && y.id !== yazar.id);

  if (tip === "eser") {
    const tumEserler = havuz.flatMap((y) => y.eserler).filter((e) => !yazar.eserler.includes(e));
    const karisik = karistir(tumEserler);
    // Aynı eser adının tekrar etmemesi için benzersizleştir
    const tek = Array.from(new Set(karisik));
    return tek.slice(0, adet);
  }

  const tumYazarlar = havuz.map((y) => y.ad).filter((a) => a !== yazar.ad);
  const tek = Array.from(new Set(tumYazarlar));
  return karistir(tek).slice(0, adet);
}

/** Belirli bir havuzdan test soruları üretir (eser/yazar karışık). */
export function sorulariUret(havuz: Yazar[], soruSayisi: number): Soru[] {
  return karistir(havuz)
    .slice(0, soruSayisi)
    .map((yazar, i): Soru => {
      const dogruEser = karistir(yazar.eserler)[0];

      if (i % 2 === 0) {
        const yanlislar = celdiriciUret(yazar, "eser", 3);
        // Yetersizse tüm havuzdan tamamla
        const eksik = 3 - yanlislar.length;
        let secenekYanlis = yanlislar;
        if (eksik > 0) {
          const yedek = karistir(
            yazarlar
              .flatMap((y) => y.eserler)
              .filter((e) => !yazar.eserler.includes(e) && !yanlislar.includes(e)),
          ).slice(0, eksik);
          secenekYanlis = [...yanlislar, ...yedek];
        }
        return {
          metin: "Aşağıdaki eserlerden hangisi bu yazara aittir?",
          vurgu: yazar.ad,
          secenekler: karistir([dogruEser, ...secenekYanlis]),
          dogru: dogruEser,
          donem: yazar.donem,
          tip: "eser",
        };
      }

      const yanlislar = celdiriciUret(yazar, "yazar", 3);
      const eksik = 3 - yanlislar.length;
      let secenekYanlis = yanlislar;
      if (eksik > 0) {
        const yedek = karistir(
          yazarlar.map((y) => y.ad).filter((a) => a !== yazar.ad && !yanlislar.includes(a)),
        ).slice(0, eksik);
        secenekYanlis = [...yanlislar, ...yedek];
      }
      return {
        metin: "Aşağıdaki yazarlardan hangisi bu eserin yazarıdır?",
        vurgu: dogruEser,
        secenekler: karistir([yazar.ad, ...secenekYanlis]),
        dogru: yazar.ad,
        donem: yazar.donem,
        tip: "yazar",
      };
    });
}

/** ÖSYM Sever modu için "banko" sorular — en çok eseri olan yazarlardan seçilir. */
export function osymSeverSorulari(soruSayisi: number): Soru[] {
  // En az 2 eseri olan yazarları "banko" sayıyoruz
  const banko = yazarlar.filter((y) => y.eserler.length >= 2);
  return sorulariUret(banko, soruSayisi);
}

export { rastgele };
