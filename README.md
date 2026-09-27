[README.md](https://github.com/user-attachments/files/32710805/README.md)
# EdebiKart

**EZBERLEME, NOKTA ATIŞI YAP!** — YKS/AYT edebiyat yazar–eser ezber ve prova uygulaması.

Canlı: [v0-yks-edebiyat.vercel.app](https://v0-yks-edebiyat.vercel.app)

---

## Özellikler

### Kartlar
- Leitner (3 kutu) ile aralıklı tekrar
- Ön yüz eser, arka yüz yazar
- **Kaptım** → kutu yükselir · **Tekrar Et** → Kutu 1
- Dönem filtreleri ve “tekrar gerekenler” destesi

### Test
- **Dönem testleri** — 8 ana dönem + tüm dönemler
- **ÖSYM Sever** — banko eserlerden 20 soruluk prova (en iyi skor kaydı)
- **Kadın Yazarlar & Eserleri** — her tur **10** karışık soru
- **Eser – Kahraman** — karakter ↔ eser eşleştirme + bilgi notu
- **Batı Edebi Akımları** — temsilci, slogan, özellik soruları + hint
- **Tekrar Köşen** — test yanlışlarından dinamik prova (kart Leitner’ından ayrı)
- Moda özel bitiş mesajları, sticky “Sonraki Soru”, peş peşe aynı soruyu azaltma

### Düello
- **Ranked** — canlı rakip veya bot, EP ve rütbe
- **Özel oda** — oda koduyla arkadaş maçı
- Kariyer Yolu: YKS Adayı → … → Edebiyat Efsanesi
- Maç sırasında isim altında rütbe görünümü

### Diğer
- Ruh hali / odak önerileri
- Onboarding (Kartlar · Test · Düello)
- Web Audio SFX
- Mobil & web (PWA / Capacitor)

---

## Kapsanan edebiyat dönemleri

1. Geçiş Dönemi (Kutadgu Bilig, DLT, Atabetü’l-Hakayık, Divan-ı Hikmet)
2. Divan Edebiyatı
3. Halk Edebiyatı (Âşık & Tekke)
4. Tanzimat Edebiyatı
5. Servet-i Fünun & Fecr-i Ati
6. Milli Edebiyat
7. Cumhuriyet Dönemi (Saf Şiir, Toplumcu Gerçekçiler, Garip, İkinci Yeni, modernist roman/tiyatro)

---

## Teknolojiler

| Katman | Stack |
|--------|--------|
| Frontend | Next.js, React, TypeScript |
| Stil | Tailwind CSS, Lucide Icons |
| Mobil | Capacitor (Android) |
| Ses | Web Audio API |
| Online düello | Firebase (Firestore) |
| Dağıtım | Vercel |

---

## Yerel geliştirme

```bash
git clone https://github.com/egemenozbek6-droid/yks-edebiyat.git
cd yks-edebiyat

pnpm install   # veya: npm install
pnpm dev       # veya: npm run dev
```

Tarayıcıda: [http://localhost:3000](http://localhost:3000)

---

## Lisans / katkı

Öğrenci projesi — YKS edebiyat hazırlığı için. PR ve issue’lar memnuniyetle karşılanır.
