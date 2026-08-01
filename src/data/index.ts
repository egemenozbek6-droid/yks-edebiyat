import divanGecis from "./divan_gecis_101.json";
import tanzimatServet from "./tanzimat_servetifunun_fecriati_201.json";
import milliAsik from "./milli_asik_tekke_301.json";
import cumhuriyet from "./cumhuriyet_siir_roman_tiyatro_401.json";

export type OsymStats = {
  is_banko?: boolean;
  osym_freq?: string;
};

export type LiteratureItem = {
  id: number;
  author: string;
  work: string;
  period: string;
  genre: string;
  info: string;
  keywords: string[];
  osym_stats?: OsymStats;
};

export const literatureData: LiteratureItem[] = [
  ...(divanGecis as LiteratureItem[]),
  ...(tanzimatServet as LiteratureItem[]),
  ...(milliAsik as LiteratureItem[]),
  ...(cumhuriyet as LiteratureItem[]),
];

// Anonim / "TÜRK" gibi belirsiz yazarları filtrele
const anonimKalip = /^(türk(\s*\([^)]*\))?|anonim)$/i;

export function gecerliYazarlar(): LiteratureItem[] {
  return literatureData.filter(
    (item) =>
      item.author &&
      item.author.trim() !== "" &&
      !anonimKalip.test(item.author.trim()),
  );
}

// Tüm benzersiz dönemleri sıralı olarak döndürür
export function tumDonemler(): string[] {
  const donemler = new Set<string>();
  literatureData.forEach((item) => donemler.add(item.period));
  return Array.from(donemler).sort((a, b) => a.localeCompare(b, "tr"));
}

// Dönem sırası — çeldiricilerin yakın dönemden seçilmesi için
export const donemSirasi: string[] = [
  "Geçiş Dönemi",
  "Divan Edebiyatı (Başlangıç/Çağatay)",
  "Divan Edebiyatı (Klasik Dönem 13-15.yy)",
  "Divan Edebiyatı (16.yy)",
  "Divan Edebiyatı (16-17.yy)",
  "Divan Edebiyatı (17.yy)",
  "Divan Edebiyatı - Nesir (16.yy)",
  "Divan Edebiyatı - Nesir (17.yy)",
  "Divan Edebiyatı - Nesir (17-18.yy)",
  "Divan Edebiyatı (18.yy - Lale Devri)",
  "Divan Edebiyatı (18.yy - Son Dönem)",
  "Divan Edebiyatı (18.yy)",
  "Tekke (Tasavvuf) Edebiyatı",
  "Aşık Edebiyatı (Halk Edebiyatı)",
  "Tanzimat Edebiyatı (1. Dönem)",
  "Tanzimat Edebiyatı (2. Dönem)",
  "Servet-i Fünun Edebiyatı",
  "Fecr-i Ati Edebiyatı",
  "Milli Edebiyat Dönemi",
  "Milli Edebiyat Dönemi (Bağımsızlar)",
  "Milli Edebiyat Dönemi (Beş Hececiler)",
  "Milli Edebiyat / Servet-i Fünun Sonrası",
  "Cumhuriyet Dönemi (Milli Edebiyat Sonrası)",
  "Cumhuriyet Dönemi Şiiri (Bağımsızlar)",
  "Cumhuriyet Dönemi Şiiri (Toplumcu Gerçekçi)",
  "Cumhuriyet Dönemi Şiiri (Garip/I. Yeni)",
  "Cumhuriyet Dönemi Şiiri (İkinci Yeni)",
  "Cumhuriyet Dönemi Romanı",
  "Cumhuriyet Dönemi Romanı (Köy/Toplumcu Gerçekçi)",
  "Cumhuriyet Dönemi Romanı (Toplumcu Gerçekçi)",
  "Cumhuriyet Dönemi Romanı (Köy Romanı)",
  "Cumhuriyet Dönemi Romanı (Modernist)",
  "Cumhuriyet Dönemi Romanı (Mizah)",
  "Cumhuriyet Dönemi (Deneme)",
  "Cumhuriyet Dönemi (Hikaye)",
  "Cumhuriyet Dönemi Tiyatrosu",
  "Cumhuriyet Dönemi Tiyatrosu (Epik Tiyatro)",
];

// Bir döneme "yakın" sayılan dönemleri döndürür (± pencere)
export function yakinDonemler(donem: string, pencere = 2): string[] {
  const idx = donemSirasi.indexOf(donem);
  if (idx === -1) {
    // Bilinmeyen dönem: tüm dönemleri döndür
    return Array.from(new Set(literatureData.map((i) => i.period)));
  }
  const baslangic = Math.max(0, idx - pencere);
  const bitis = Math.min(donemSirasi.length - 1, idx + pencere);
  return donemSirasi.slice(baslangic, bitis + 1);
}

// Dönem stili rozetler için
export const donemStil: Record<string, string> = {};

// Banko (ÖSYM Sever) veriler
export function bankoVeriler(): LiteratureItem[] {
  return gecerliYazarlar().filter(
    (item) => item.osym_stats?.is_banko || item.osym_stats?.osym_freq,
  );
}
