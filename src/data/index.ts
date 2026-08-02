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

// Anonim / "TÜRK" gibi belirsiz yazarları ve jenerik "Divan"/"X Divanı" eserlerini filtrele
const anonimKalip = /^(türk(\s*\([^)]*\))?|anonim)$/i;
const jenerikDivanKalip = /^(divan|.+ divanı)$/i;

export function gecerliYazarlar(): LiteratureItem[] {
  return literatureData.filter(
    (item) =>
      item.author &&
      item.author.trim() !== "" &&
      !anonimKalip.test(item.author.trim()) &&
      !jenerikDivanKalip.test(item.work.trim().toLowerCase()),
  );
}

// ============================================================
// ANA DÖNEM KATEGORİLERİ (8)
// ============================================================

export type AnaDonem =
  | "Tüm Dönemler"
  | "Geçiş Dönemi"
  | "Divan Edebiyatı"
  | "Halk Edebiyatı (Âşık & Tekke)"
  | "Tanzimat Edebiyatı"
  | "Servet-i Fünun & Fecr-i Ati"
  | "Milli Edebiyat"
  | "Cumhuriyet Dönemi";

export const anaDonemler: AnaDonem[] = [
  "Tüm Dönemler",
  "Geçiş Dönemi",
  "Divan Edebiyatı",
  "Halk Edebiyatı (Âşık & Tekke)",
  "Tanzimat Edebiyatı",
  "Servet-i Fünun & Fecr-i Ati",
  "Milli Edebiyat",
  "Cumhuriyet Dönemi",
];

// Alt dönem → ana dönem eşleştirme
const donemEslesme: Record<string, AnaDonem> = {
  "Geçiş Dönemi": "Geçiş Dönemi",
  "Divan Edebiyatı (Başlangıç/Çağatay)": "Divan Edebiyatı",
  "Divan Edebiyatı (Klasik Dönem 13-15.yy)": "Divan Edebiyatı",
  "Divan Edebiyatı (16.yy)": "Divan Edebiyatı",
  "Divan Edebiyatı (16-17.yy)": "Divan Edebiyatı",
  "Divan Edebiyatı (17.yy)": "Divan Edebiyatı",
  "Divan Edebiyatı - Nesir (16.yy)": "Divan Edebiyatı",
  "Divan Edebiyatı - Nesir (17.yy)": "Divan Edebiyatı",
  "Divan Edebiyatı - Nesir (17-18.yy)": "Divan Edebiyatı",
  "Divan Edebiyatı (18.yy - Lale Devri)": "Divan Edebiyatı",
  "Divan Edebiyatı (18.yy - Son Dönem)": "Divan Edebiyatı",
  "Divan Edebiyatı (18.yy)": "Divan Edebiyatı",
  "Tekke (Tasavvuf) Edebiyatı": "Halk Edebiyatı (Âşık & Tekke)",
  "Aşık Edebiyatı (Halk Edebiyatı)": "Halk Edebiyatı (Âşık & Tekke)",
  "Tanzimat Edebiyatı (1. Dönem)": "Tanzimat Edebiyatı",
  "Tanzimat Edebiyatı (2. Dönem)": "Tanzimat Edebiyatı",
  "Servet-i Fünun Edebiyatı": "Servet-i Fünun & Fecr-i Ati",
  "Fecr-i Ati Edebiyatı": "Servet-i Fünun & Fecr-i Ati",
  "Milli Edebiyat Dönemi": "Milli Edebiyat",
  "Milli Edebiyat Dönemi (Bağımsızlar)": "Milli Edebiyat",
  "Milli Edebiyat Dönemi (Beş Hececiler)": "Milli Edebiyat",
  "Milli Edebiyat / Servet-i Fünun Sonrası": "Milli Edebiyat",
  "Cumhuriyet Dönemi (Milli Edebiyat Sonrası)": "Cumhuriyet Dönemi",
  "Cumhuriyet Dönemi Şiiri (Bağımsızlar)": "Cumhuriyet Dönemi",
  "Cumhuriyet Dönemi Şiiri (Toplumcu Gerçekçi)": "Cumhuriyet Dönemi",
  "Cumhuriyet Dönemi Şiiri (Garip/I. Yeni)": "Cumhuriyet Dönemi",
  "Cumhuriyet Dönemi Şiiri (İkinci Yeni)": "Cumhuriyet Dönemi",
  "Cumhuriyet Dönemi Romanı": "Cumhuriyet Dönemi",
  "Cumhuriyet Dönemi Romanı (Köy/Toplumcu Gerçekçi)": "Cumhuriyet Dönemi",
  "Cumhuriyet Dönemi Romanı (Toplumcu Gerçekçi)": "Cumhuriyet Dönemi",
  "Cumhuriyet Dönemi Romanı (Köy Romanı)": "Cumhuriyet Dönemi",
  "Cumhuriyet Dönemi Romanı (Modernist)": "Cumhuriyet Dönemi",
  "Cumhuriyet Dönemi Romanı (Mizah)": "Cumhuriyet Dönemi",
  "Cumhuriyet Dönemi (Deneme)": "Cumhuriyet Dönemi",
  "Cumhuriyet Dönemi (Hikaye)": "Cumhuriyet Dönemi",
  "Cumhuriyet Dönemi Tiyatrosu": "Cumhuriyet Dönemi",
  "Cumhuriyet Dönemi Tiyatrosu (Epik Tiyatro)": "Cumhuriyet Dönemi",
};

export function anaDonemBul(altDonem: string): AnaDonem {
  return donemEslesme[altDonem] ?? "Tüm Dönemler";
}

export function anaDonemFiltrele(anaDonem: AnaDonem): LiteratureItem[] {
  const gecerli = gecerliYazarlar();
  if (anaDonem === "Tüm Dönemler") return gecerli;
  return gecerli.filter((item) => anaDonemBul(item.period) === anaDonem);
}

export const anaDonemSirasi: AnaDonem[] = [
  "Geçiş Dönemi",
  "Divan Edebiyatı",
  "Halk Edebiyatı (Âşık & Tekke)",
  "Tanzimat Edebiyatı",
  "Servet-i Fünun & Fecr-i Ati",
  "Milli Edebiyat",
  "Cumhuriyet Dönemi",
];

export function yakinDonemler(donem: string, pencere = 1): string[] {
  const ana = anaDonemBul(donem);
  const idx = anaDonemSirasi.indexOf(ana);
  if (idx === -1) {
    return Array.from(new Set(literatureData.map((i) => i.period)));
  }
  const baslangic = Math.max(0, idx - pencere);
  const bitis = Math.min(anaDonemSirasi.length - 1, idx + pencere);
  const yakinAnaDonemler = anaDonemSirasi.slice(baslangic, bitis + 1);
  return Array.from(
    new Set(
      literatureData
        .filter((item) => yakinAnaDonemler.includes(anaDonemBul(item.period)))
        .map((item) => item.period),
    ),
  );
}

export function bankoVeriler(): LiteratureItem[] {
  return gecerliYazarlar().filter(
    (item) => item.osym_stats?.is_banko || item.osym_stats?.osym_freq,
  );
}
