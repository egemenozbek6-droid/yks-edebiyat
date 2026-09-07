// ============================================================
// EdebiKart — Kullanıcı & istatistik yönetimi
// ============================================================

import { oku, yaz, kullaniciAdiMusaitMi, kullaniciAdiKaydet, kullaniciAdiSil, kayitliKullaniciAdlari } from "./storage";
import type { Istatistik, Kullanici, MacSonucu } from "./types";

const KULLANICI_YOLU = "kullanici";
const ISTATISTIK_YOLU = "istatistik";
const KART_SEVIYELERI_YOLU = "kart-seviyeleri";

export function mevcutKullanici(): Kullanici | null {
  return oku<Kullanici | null>(KULLANICI_YOLU, null);
}

export function kullaniciKaydet(kullanici: Kullanici): void {
  yaz(KULLANICI_YOLU, kullanici);
  kullaniciAdiKaydet(kullanici.kullaniciAdi);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("profileUpdated"));
  }
}

function isimHakkiKullanildi(k: Kullanici): boolean {
  return !!(k.isimDegisti || k.hasChangedUsername);
}

/** Eser Çırağı (100 EP+) ve hak henüz kullanılmadıysa true */
export function kullaniciAdiDegistirebilirMi(): boolean {
  const k = mevcutKullanici();
  if (!k) return false;
  if (isimHakkiKullanildi(k)) return false;
  return mevcutIstatistik().puan >= 100;
}

export function kullaniciAdiGuncelle(yeniAd: string): { tamam: boolean; hata?: string } {
  const k = mevcutKullanici();
  if (!k) return { tamam: false, hata: "Oturum bulunamadı" };
  if (isimHakkiKullanildi(k)) {
    return { tamam: false, hata: "İsim değiştirme hakkınızı zaten kullandınız" };
  }
  if (mevcutIstatistik().puan < 100) {
    return { tamam: false, hata: "İsim değiştirmek için Eser Çırağı rütbesine ulaşmalısınız (100 EP)" };
  }

  const temiz = yeniAd.trim();
  if (temiz.toLowerCase() === k.kullaniciAdi.toLowerCase()) {
    return { tamam: false, hata: "Yeni isim eskisiyle aynı olamaz" };
  }

  const kontrol = kullaniciAdiKontrol(temiz);
  if (!kontrol.musait) {
    return { tamam: false, hata: kontrol.mesaj };
  }

  const eski = k.kullaniciAdi;
  kullaniciAdiSil(eski);
  const guncel: Kullanici = {
    ...k,
    kullaniciAdi: temiz,
    isimDegisti: true,
    hasChangedUsername: true,
  };
  kullaniciKaydet(guncel);

  const ist = mevcutIstatistik();
  if (ist.kullaniciAdi !== temiz) {
    istatistikYaz({ ...ist, kullaniciAdi: temiz });
  }

  return { tamam: true };
}

export function kullaniciAdiKontrol(ad: string): { musait: boolean; mesaj: string } {
  const temiz = ad.trim();
  if (!temiz) return { musait: false, mesaj: "Kullanıcı adı girin" };
  if (temiz.length < 3) return { musait: false, mesaj: "En az 3 karakter" };
  if (temiz.length > 20) return { musait: false, mesaj: "En fazla 20 karakter" };
  if (!/^[a-zA-Z0-9_çğıöşüÇĞİÖŞÜ\s]+$/.test(temiz))
    return { musait: false, mesaj: "Geçersiz karakter" };
  const mevcut = mevcutKullanici();
  if (mevcut && temiz.toLowerCase() === mevcut.kullaniciAdi.toLowerCase()) {
    return { musait: false, mesaj: "Mevcut adınız" };
  }
  if (!kullaniciAdiMusaitMi(temiz))
    return { musait: false, mesaj: "Bu ad kullanılıyor" };
  return { musait: true, mesaj: "Uygun" };
}

export function mevcutIstatistik(): Istatistik {
  const kullanici = mevcutKullanici();
  const varsayilan: Istatistik = {
    kullaniciAdi: kullanici?.kullaniciAdi ?? "",
    puan: 0,
    macSayisi: 0,
    galibiyet: 0,
    maglubiyet: 0,
    seri: 0,
  };
  return oku<Istatistik>(ISTATISTIK_YOLU, varsayilan);
}

export function istatistikGuncelle(sonuc: MacSonucu): Istatistik {
  const mevcut = mevcutIstatistik();
  let yeni: Istatistik = { ...mevcut };

  if (sonuc.ranked) {
    yeni.macSayisi += 1;
    yeni.puan = Math.max(0, yeni.puan + sonuc.puanKazandi);
    if (sonuc.kazandi || sonuc.hukmenGalibiyet) {
      yeni.galibiyet += 1;
      yeni.seri += 1;
    } else if (sonuc.berabere) {
      // beraberlik seriyi bozmaz ama artırmaz
    } else {
      yeni.maglubiyet += 1;
      yeni.seri = 0;
    }
  }
  yaz(ISTATISTIK_YOLU, yeni);
  return yeni;
}

export function istatistikYaz(yeni: Istatistik): void {
  yaz(ISTATISTIK_YOLU, yeni);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("profileUpdated"));
  }
}

export function kazanilanPuan(oyuncuSkor: number, rakipSkor: number, hukmen: boolean): number {
  if (hukmen) return 50;
  if (oyuncuSkor > rakipSkor) return 50;
  if (oyuncuSkor === rakipSkor) return 0;
  return -20;
}

export function soruPuani(kalanSure: number, toplamSure: number): number {
  const oran = Math.max(0, Math.min(1, kalanSure / toplamSure));
  return Math.min(20, Math.max(10, Math.round(10 + oran * 10)));
}

export function kartSeviyeleri(): Record<number, number> {
  return oku<Record<number, number>>(KART_SEVIYELERI_YOLU, {});
}

export function kartSeviyesiGuncelle(kartId: number, seviye: number): void {
  const tum = kartSeviyeleri();
  tum[kartId] = seviye;
  yaz(KART_SEVIYELERI_YOLU, tum);
}

export function tumKayitliAdlar(): string[] {
  return Array.from(kayitliKullaniciAdlari());
}
