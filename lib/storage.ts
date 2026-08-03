// ============================================================
// EdebiKart — LocalStorage yardımcıları
// Firestore'a geçişte sadece bu katman değişecek.
// ============================================================

const PREFIX = "edebikart";

export function anahtar(yol: string): string {
  return `${PREFIX}-${yol}`;
}

export function oku<T>(yol: string, varsayilan: T): T {
  try {
    const ham = window.localStorage.getItem(anahtar(yol));
    if (ham === null) return varsayilan;
    return JSON.parse(ham) as T;
  } catch {
    return varsayilan;
  }
}

export function yaz<T>(yol: string, deger: T): void {
  try {
    window.localStorage.setItem(anahtar(yol), JSON.stringify(deger));
  } catch {
    // sessiz geç
  }
}

export function sil(yol: string): void {
  try {
    window.localStorage.removeItem(anahtar(yol));
  } catch {
    // sessiz geç
  }
}

// Global kayıtlı kullanıcı adları (unique enforcement)
const KULLANICI_ADLARI_YOLU = "kullanici-adlari";

export function kayitliKullaniciAdlari(): Set<string> {
  return new Set(oku<string[]>(KULLANICI_ADLARI_YOLU, []));
}

export function kullaniciAdiMusaitMi(ad: string): boolean {
  const tum = kayitliKullaniciAdlari();
  return !tum.has(ad.toLowerCase());
}

export function kullaniciAdiKaydet(ad: string): void {
  const tum = oku<string[]>(KULLANICI_ADLARI_YOLU, []);
  if (!tum.includes(ad.toLowerCase())) {
    tum.push(ad.toLowerCase());
    yaz(KULLANICI_ADLARI_YOLU, tum);
  }
}

export function kullaniciAdiSil(ad: string): void {
  const tum = oku<string[]>(KULLANICI_ADLARI_YOLU, []).filter(
    (a) => a !== ad.toLowerCase(),
  );
  yaz(KULLANICI_ADLARI_YOLU, tum);
}
