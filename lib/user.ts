// ============================================================
// EdebiKart — Kullanıcı & istatistik yönetimi
// ============================================================

import { oku, yaz, kullaniciAdiMusaitMi, kullaniciAdiKaydet, kayitliKullaniciAdlari } from "./storage";
import { rastgeleAvatarId } from "./avatars";
import type { Istatistik, Kullanici, MacSonucu } from "./types";

const KULLANICI_YOLU = "kullanici";
const ISTATISTIK_YOLU = "istatistik";
const KART_SEVIYELERI_YOLU = "kart-seviyeleri";

// --- Kullanıcı ---

export function mevcutKullanici(): Kullanici | null {
  return oku<Kullanici | null>(KULLANICI_YOLU, null);
}

export function kullaniciKaydet(kullanici: Kullanici): void {
  yaz(KULLANICI_YOLU, kullanici);
  kullaniciAdiKaydet(kullanici.kullaniciAdi);
}

export function kullaniciAdiGuncelle(yeniAd: string): { tamam: boolean; hata?: string } {
  const mevcut = mevcutKullanici();
  if (!mevcut) return { tamam: false, hata: "Oturum yok" };
  const temiz = yeniAd.trim();
  if (!temiz) return { tamam: false, hata: "Kullanıcı adı boş olamaz" };
  if (temiz.toLowerCase() !== mevcut.kullaniciAdi.toLowerCase()) {
    if (!kullaniciAdiMusaitMi(temiz)) {
      return { tamam: false, hata: "Bu kullanıcı adı alınmış" };
    }
  }
  kullaniciKaydet({ ...mevcut, kullaniciAdi: temiz });
  return { tamam: true };
}

export function kullaniciAdiKontrol(ad: string): { musait: boolean; mesaj: string } {
  const temiz = ad.trim();
  if (!temiz) return { musait: false, mesaj: "Kullanıcı adı girin" };
  if (temiz.length < 3) return { musait: false, mesaj: "En az 3 karakter" };
  if (temiz.length > 20) return { musait: false, mesaj: "En fazla 20 karakter" };
  if (!/^[a-zA-Z0-9_çğıöşüÇĞİÖŞÜ\s]+$/.test(temiz))
    return { musait: false, mesaj: "Geçersiz karakter" };
  if (!kullaniciAdiMusaitMi(temiz))
    return { musait: false, mesaj: "Bu ad kullanılıyor" };
  return { musait: true, mesaj: "Uygun" };
}

// --- İstatistik ---

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
    yeni.puan += sonuc.puanKazandi;
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

export function kazanilanPuan(oyuncuSkor: number, rakipSkor: number, hukmen: boolean): number {
  if (hukmen) return 100;
  const fark = oyuncuSkor - rakipSkor;
  if (fark <= 0) return 0;
  return Math.round(50 + fark * 0.5);
}

// --- Leitner kart seviyeleri ---

export function kartSeviyeleri(): Record<number, number> {
  return oku<Record<number, number>>(KART_SEVIYELERI_YOLU, {});
}

export function kartSeviyesiGuncelle(kartId: number, seviye: number): void {
  const tum = kartSeviyeleri();
  tum[kartId] = seviye;
  yaz(KART_SEVIYELERI_YOLU, tum);
}

// --- Debug / test yardımcıları ---

export function tumKayitliAdlar(): string[] {
  return Array.from(kayitliKullaniciAdlari());
}
