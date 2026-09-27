[README (1).md](https://github.com/user-attachments/files/32711025/README.1.md)
# EdebiKart

**EZBERLEME, NOKTA ATIŞI YAP!** — YKS/AYT edebiyat yazar–eser ezber ve prova uygulaması.

Canlı: [v0-yks-edebiyat.vercel.app](https://v0-yks-edebiyat.vercel.app)

---

## Özellikler

### Kartlar
- Leitner (3 kutu) ile aralıklı tekrar
- Ön yüz eser, arka yüz yazar — **Kaptım** / **Tekrar Et**
- Dönem filtreleri ve kart “tekrar gerekenler” destesi

### Test
- Dönem testleri (8 ana dönem)
- **ÖSYM Sever** — banko eserler, 20 soru
- **Kadın Yazarlar** — 10 soru / tur
- **Eser – Kahraman** & **Batı Edebi Akımları** (+ bilgi notu)
- **Tekrar Köşen** — yalnızca test yanlışları (kart Leitner’ından ayrı)

### Düello
- Ranked (canlı / bot) + özel oda (oda kodu)
- EP, Kariyer Yolu rütbeleri
- Firebase ile online eşleşme

### Diğer
- Onboarding, ruh hali önerileri, Web Audio SFX
- PWA / Capacitor (Android)

---

## Teknolojiler

Next.js · React · TypeScript · Tailwind · Firebase · Capacitor · Vercel

**Paket yöneticisi:** `pnpm` (`packageManager` alanı tanımlı)

---

## Yerel geliştirme

```bash
git clone https://github.com/egemenozbek6-droid/yks-edebiyat.git
cd yks-edebiyat
pnpm install
pnpm dev
```

[http://localhost:3000](http://localhost:3000)

### Firebase

Client config şu an `lib/firebase.ts` içinde. Firestore **Security Rules**’ı Firebase Console’dan sıkı tut:
- Geliştirme dışı `allow read, write: if true` bırakma
- `matches` / kuyruk koleksiyonlarına kontrollü yazma

---

## Build

```bash
pnpm build   # out/ üretir (static export)
```

`out/` ve `.next/` git’e eklenmez.
