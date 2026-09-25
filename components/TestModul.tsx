"use client";

import { useCallback, useEffect, useState } from "react";
import { 
  ArrowLeft,
  ArrowRight, 
  BookOpen,
  Brain, 
  Check, 
  ChevronRight,
  Flame, 
  Flower,
  HeartHandshake,
  RotateCcw, 
  Target, 
  Users,
  X,
  type LucideIcon
} from "lucide-react";
import IlerlemeBari from "@/components/IlerlemeBari";
import { anaDonemler, anaDonemFiltrele, type AnaDonem, type LiteratureItem } from "@/src/data";
import { type Soru } from "@/lib/soru";
import { sfxCorrect, sfxWrong } from "@/lib/sfx";
import kadinYazarlarData from "@/src/data/kadin_yazarlar_test.json";
import eserKahramanData from "@/src/data/eser_kahraman_test.json";

type Props = {
  onSonuc?: (dogruMu: boolean, donem: string) => void;
};

type SayfaDurumu = "ana_secim" | "donem_secimi" | "test";

type EserKahramanItem = {
  id: string;
  work: string;
  character: string;
  author: string;
  period: string;
  genre: "roman" | "hikaye" | "tiyatro" | "siir";
  difficulty: "kolay" | "orta" | "zor";
  isSideCharacter: boolean;
  hint?: string;
  tags?: string[];
};

// ---------------------------------------------------------------------------
// AKSAN PALETİ
// Her özel test kategorisinin (Kadın Yazarlar, Eser-Kahraman, ileride
// Şiir-Topluluk / Batı Akımları / Edebi Sanatlar) kendi rengi burada tanımlı.
// Yeni bir kategori eklerken tek yapman gereken: buraya bir kayıt eklemek.
// Dönem testleri ve tanımsız/varsayılan durum "violet" kullanır.
// ---------------------------------------------------------------------------
type Aksan = {
  ringSoft: string;      // sonuç ikonu arka plan + ring
  metinAna: string;      // vurgulu sayı/metin rengi
  kutuYumusak: string;   // sonuç mesaj kutusu arka plan + metin
  buton: string;         // "Tekrar Çöz" / "Sonraki Soru" buton arka plan + gölge
  hoverBorder: string;   // şık hover border rengi (soru ekranı)
  hoverRing: string;     // "Testten Çık" hover ring rengi
  rozetBg: string;       // ÖSYM/kategori rozeti arka plan + metin + ring
  rozetIkon: LucideIcon; // rozetin ikonu — kategoriye özgü (ana seçim kartındaki ikonla aynı)
};

const AKSAN_PALETI: Record<string, Aksan> = {
  varsayilan: {
    ringSoft: "bg-violet-500/15 text-violet-500 ring-violet-500/30",
    metinAna: "text-violet-500",
    kutuYumusak: "bg-violet-500/10 text-violet-400",
    buton: "bg-violet-600 shadow-violet-600/25",
    hoverBorder: "hover:border-violet-500/50",
    hoverRing: "hover:ring-violet-500/30",
    rozetBg: "bg-osym/15 text-osym ring-osym/30",
    rozetIkon: Flame,
  },
  "Kadın Yazarlar Özel Testi": {
    ringSoft: "bg-pink-500/15 text-pink-500 ring-pink-500/30",
    metinAna: "text-pink-500",
    kutuYumusak: "bg-pink-500/10 text-pink-400",
    buton: "bg-pink-600 shadow-pink-600/25",
    hoverBorder: "hover:border-pink-500/50",
    hoverRing: "hover:ring-pink-500/30",
    rozetBg: "bg-pink-500/15 text-pink-500 ring-pink-500/30",
    rozetIkon: Flower,
  },
  "Eser - Kahraman Testi": {
    ringSoft: "bg-amber-500/15 text-amber-500 ring-amber-500/30",
    metinAna: "text-amber-500",
    kutuYumusak: "bg-amber-500/10 text-amber-400",
    buton: "bg-amber-600 shadow-amber-600/25",
    hoverBorder: "hover:border-amber-500/50",
    hoverRing: "hover:ring-amber-500/30",
    rozetBg: "bg-amber-500/15 text-amber-500 ring-amber-500/30",
    rozetIkon: Users,
  },
};

// Soru başlığı, soru.tip değerine göre gösterilecek üst etiket
const TIP_ETIKETI: Record<Soru["tip"], string> = {
  eser: "Yazarın eseri",
  yazar: "Eserin yazarı",
  kahraman: "Eserin kahramanı",
  eser2: "Karakterin eseri",
};

export default function TestModul({ onSonuc }: Props) {
  const [durum, setDurum] = useState<SayfaDurumu>("ana_secim");
  const [secilenBaslik, setSecilenBaslik] = useState<string>("");
  const [sorular, setSorular] = useState<Soru[]>([]);
  const [aktif, setAktif] = useState(0);
  const [secim, setSecim] = useState<string | null>(null);
  const [dogruSayi, setDogruSayi] = useState(0);
  const [bitti, setBitti] = useState(false);

  const isKadinTesti = secilenBaslik === "Kadın Yazarlar Özel Testi";
  const isEserKahramanTesti = secilenBaslik === "Eser - Kahraman Testi";
  const aksan = AKSAN_PALETI[secilenBaslik] ?? AKSAN_PALETI.varsayilan;

  // Genel Soru Üretici (Dönem testleri için)
  const testiBaslat = useCallback((havuz: LiteratureItem[], baslik: string) => {
    import("@/lib/soru").then(({ sorulariUret }) => {
      const uretilenSorular = sorulariUret(havuz);
      setSecilenBaslik(baslik);
      setSorular(uretilenSorular);
      setAktif(0);
      setSecim(null);
      setDogruSayi(0);
      setBitti(false);
      setDurum("test");
    });
  }, []);

  // Kadın Yazarlar için Özel Soru Üretici
  const kadinYazarlarTestiBaslat = useCallback(() => {
    const havuz = kadinYazarlarData as unknown as LiteratureItem[];
    const karisikListe = [...havuz].sort(() => 0.5 - Math.random()).slice(0, 10);

    const uretilenSorular: Soru[] = karisikListe.map((item, index) => {
      const digerYazarlar = Array.from(new Set(havuz.map((x) => x.author)))
        .filter((yazar) => yazar !== item.author);

      const yanlisSecenekler = digerYazarlar
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const secenekler = [...yanlisSecenekler, item.author].sort(() => 0.5 - Math.random());

      return {
        id: index + 1,
        tip: "eser" as const,
        vurgu: item.work,
        metin: `Aşağıdaki yazarlardan hangisi bu eserin yazarıdır?`,
        dogru: item.author,
        secenekler,
        donem: item.period,
        osymFreq: "Özel Seçki"
      };
    });

    setSecilenBaslik("Kadın Yazarlar Özel Testi");
    setSorular(uretilenSorular);
    setAktif(0);
    setSecim(null);
    setDogruSayi(0);
    setBitti(false);
    setDurum("test");
  }, []);

  // Eser - Kahraman için Özel Soru Üretici (iki yönlü: eser->kahraman / kahraman->eser)
  const eserKahramanTestiBaslat = useCallback(() => {
    const havuz = eserKahramanData as unknown as EserKahramanItem[];
    const karisikListe = [...havuz].sort(() => 0.5 - Math.random()).slice(0, 10);

    const uretilenSorular: Soru[] = karisikListe.map((item, index) => {
      const eserSoruluyor = Math.random() < 0.5; // true: eser verilir, kahraman sorulur

      // Cevaptan sonra gösterilecek bilgi notu: hint varsa onu, yoksa
      // isSideCharacter durumuna göre kısa bir otomatik açıklama üret.
      const aciklama =
        item.hint ??
        `${item.character}, "${item.work}" adlı eserin ${
          item.isSideCharacter ? "önemli yan karakterlerinden biridir" : "başkahramanıdır"
        }.`;

      if (eserSoruluyor) {
        const ayniEserKarakterleri = new Set(
          havuz.filter((x) => x.work === item.work).map((x) => x.character),
        );
        const digerKahramanlar = Array.from(new Set(havuz.map((x) => x.character))).filter(
          (k) => k !== item.character && !ayniEserKarakterleri.has(k),
        );
        const yanlislar = digerKahramanlar.sort(() => 0.5 - Math.random()).slice(0, 3);
        const secenekler = [...yanlislar, item.character].sort(() => 0.5 - Math.random());

        return {
          id: item.id ?? `ek_${index}`,
          tip: "kahraman" as const,
          vurgu: item.work,
          metin: "Bu eserin başkahramanı / önemli karakteri kimdir?",
          dogru: item.character,
          secenekler,
          donem: item.period,
          osymFreq: "Eser - Kahraman",
          aciklama,
        };
      }

      const digerEserler = Array.from(new Set(havuz.map((x) => x.work)))
        .filter((e) => e !== item.work);
      const yanlislar = digerEserler.sort(() => 0.5 - Math.random()).slice(0, 3);
      const secenekler = [...yanlislar, item.work].sort(() => 0.5 - Math.random());

      return {
        id: item.id ?? `ek_${index}`,
        tip: "eser2" as const,
        vurgu: item.character,
        metin: "Bu karakter aşağıdaki eserlerden hangisinde geçer?",
        dogru: item.work,
        secenekler,
        donem: item.period,
        osymFreq: "Eser - Kahraman",
        aciklama,
      };
    });

    setSecilenBaslik("Eser - Kahraman Testi");
    setSorular(uretilenSorular);
    setAktif(0);
    setSecim(null);
    setDogruSayi(0);
    setBitti(false);
    setDurum("test");
  }, []);

  const donemTestiBaslat = useCallback((donem: AnaDonem) => {
    const havuz = anaDonemFiltrele(donem);
    testiBaslat(havuz, donem);
  }, [testiBaslat]);

  // Sonuç ekranında "Tekrar Çöz" basıldığında hangi üreticinin tekrar
  // çağrılacağını, seçilen başlığa göre bulur. Yeni kategori eklerken
  // buraya da bir satır eklemen yeterli.
  const tekrarCoz = () => {
    if (secilenBaslik === "Kadın Yazarlar Özel Testi") kadinYazarlarTestiBaslat();
    else if (secilenBaslik === "Eser - Kahraman Testi") eserKahramanTestiBaslat();
    else if (secilenBaslik) donemTestiBaslat(secilenBaslik as AnaDonem);
  };

  const basaDon = () => {
    setDurum("ana_secim");
    setSecilenBaslik("");
    setSorular([]);
    setAktif(0);
    setSecim(null);
    setDogruSayi(0);
    setBitti(false);
  };

  const cevapla = (secenek: string) => {
    if (secim) return;
    const soru = sorular[aktif];
    const dogruMu = secenek === soru.dogru;
    if (dogruMu) {
      sfxCorrect();
      setDogruSayi((prev) => prev + 1);
    } else {
      sfxWrong();
    }
    setSecim(secenek);
    onSonuc?.(dogruMu, soru.donem);
  };

  // Cevap seçilince bilgi notu + sonraki butonu görünsün
  useEffect(() => {
    if (secim === null) return;
    const t = window.setTimeout(() => {
      document.getElementById("sonraki-btn")?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 120);
    return () => window.clearTimeout(t);
  }, [secim, aktif]);

  const sonraki = () => {
    if (aktif + 1 >= sorular.length) {
      setBitti(true);
      return;
    }
    setAktif((a) => a + 1);
    setSecim(null);
  };

  // 1. ANA SEÇİM EKRANI
  if (durum === "ana_secim") {
    return (
      <div className="animate-rise max-w-xl mx-auto w-full pt-1 pb-6 space-y-3">
        <div className="glass-card rounded-2xl p-6 text-center border border-border shadow-lg space-y-3">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-violet-500/15 text-violet-500 ring-1 ring-violet-500/30">
            <Brain className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold tracking-tight text-card-foreground">Test Modu</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
              Dönemleri tara veya özel seçkilerle bilgilerini pekiştir. Sınav provasına başla.
            </p>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          <button
            onClick={() => setDurum("donem_secimi")}
            className="glass-card p-4 rounded-xl ring-1 ring-border flex items-center justify-between hover:bg-muted/40 transition group text-left shadow-sm w-full"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-foreground">Dönem Testleri</h3>
                <p className="text-[11px] text-muted-foreground truncate">Eksiklerini bul, teste başla! 🚀</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition shrink-0 ml-2" />
          </button>

          <button
            onClick={kadinYazarlarTestiBaslat}
            className="glass-card p-4 rounded-xl ring-1 ring-border flex items-center justify-between hover:bg-muted/40 transition group text-left shadow-sm border-l-2 border-l-pink-500 w-full"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                <Flower className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-foreground">Kadın Yazarlar & Eserleri</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500 shrink-0">
                    Özel
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  Sadece kadın yazar ve eserleri! 🌸
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition shrink-0 ml-2" />
          </button>

          <button
            onClick={eserKahramanTestiBaslat}
            className="glass-card p-4 rounded-xl ring-1 ring-border flex items-center justify-between hover:bg-muted/40 transition group text-left shadow-sm border-l-2 border-l-amber-500 w-full"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-foreground">Eser - Kahraman</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 shrink-0">
                    Karakter
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  Başkahramanları ve karakterleri tanı! 🎭
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition shrink-0 ml-2" />
          </button>
        </div>
      </div>
    );
  }

  // 2. DÖNEM SEÇİMİ
  if (durum === "donem_secimi") {
    return (
      <div className="animate-rise max-w-xl mx-auto w-full pt-2 pb-6">
        <button
          onClick={() => setDurum("ana_secim")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-3 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Kategorilere Dön
        </button>

        <div className="mb-4 rounded-xl bg-card p-4 border border-border text-center">
          <h2 className="font-serif text-lg font-bold tracking-tight text-card-foreground">Bir Dönem Seç</h2>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Eksiğin olan dönemi belirle ve teste dal!
          </p>
        </div>

        <div className="space-y-2.5">
          {anaDonemler.map((donem, i) => {
            const tumMu = donem === "Tüm Dönemler";
            return (
              <button
                key={donem}
                onClick={() => donemTestiBaslat(donem)}
                className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-left transition active:scale-[0.99] ${
                  tumMu
                    ? "bg-violet-500 text-white shadow-md hover:brightness-110"
                    : "bg-card text-card-foreground shadow-sm hover:shadow-md border border-border"
                }`}
              >
                {tumMu ? (
                  <Target className="h-5 w-5 shrink-0" />
                ) : (
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                    {i}
                  </span>
                )}
                <span className="text-sm font-semibold">{donem}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. SONUÇ EKRANI
  if (bitti) {
    const oran = Math.round((dogruSayi / sorular.length) * 100);

    let sonucMesaji = "";
    if (oran > 70) {
      sonucMesaji = isKadinTesti
        ? "Mükemmel! Kadın yazarlar konusunu tamamen yutmuşsun 🌸"
        : isEserKahramanTesti
        ? "Harika! Kahramanları su gibi biliyorsun 🎭"
        : "Harika iş çıkarıyorsun, sınavda bu netler kaçmaz! 🚀";
    } else if (oran >= 50) {
      sonucMesaji = isKadinTesti
        ? "Fena değil ama eksik kalan kadın yazarları bir kez daha gözden geçirmelisin."
        : isEserKahramanTesti
        ? "Fena değil ama bazı karakterleri karıştırıyorsun, tekrar bak."
        : "Fena değil! Birkaç tekrarla bu işi tamamen bitirirsin 💪";
    } else {
      sonucMesaji = isKadinTesti
        ? "Bu seçkide biraz zorlandın galiba, hemen tekrar deneyip kapatalım!"
        : isEserKahramanTesti
        ? "Kahraman-eser eşleştirmede zorlanmışsın, hemen tekrar dene!"
        : "Biraz daha çalışmaya ihtiyacın var, kafaya takma tekrar dene! 🎯";
    }

    return (
      <div className="animate-rise rounded-2xl bg-card p-6 text-center border border-border max-w-xl mx-auto w-full shadow-lg space-y-4">
        <div className={`mx-auto grid h-20 w-20 place-items-center rounded-2xl ring-1 ${aksan.ringSoft}`}>
          <Target className="h-9 w-9" strokeWidth={1.75} />
        </div>

        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-card-foreground">Test Bitti</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {sorular.length} soruda <span className={`font-bold ${aksan.metinAna}`}>{dogruSayi}</span> doğru — %{oran}
          </p>
          <p className={`mt-2 text-xs font-medium px-4 py-2 rounded-xl mx-auto max-w-sm ${aksan.kutuYumusak}`}>
            {sonucMesaji}
          </p>
        </div>

        <div className="pt-2">
          <IlerlemeBari mevcut={dogruSayi} toplam={sorular.length} etiket="Doğru cevap" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={tekrarCoz}
            className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 active:scale-[0.98] ${aksan.buton}`}
          >
            <RotateCcw className="h-4 w-4" /> Tekrar Çöz
          </button>
          <button
            onClick={basaDon}
            className="rounded-xl bg-muted/80 hover:bg-muted py-3.5 text-sm font-semibold text-muted-foreground hover:text-foreground shadow-sm transition active:scale-[0.98]"
          >
            Test Menüsüne Dön
          </button>
        </div>
      </div>
    );
  }

   // 4. AKTİF TEST / SORU EKRANI
  const soru = sorular[aktif];

  return (
    <div className="animate-rise max-w-xl mx-auto w-full flex flex-col flex-1 min-h-0">
      {/* Üst — progress (sabit) */}
      <div className="mb-3 shrink-0 rounded-xl bg-card border border-border p-3">
        <IlerlemeBari
          mevcut={aktif + (secim ? 1 : 0)}
          toplam={sorular.length}
          etiket="Soru"
          sagEtiket={`${aktif + 1} / ${sorular.length} · ${dogruSayi} doğru`}
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground">
            {secilenBaslik || soru.donem}
          </span>
          <button
            onClick={basaDon}
            className={`inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-[11px] font-semibold text-muted-foreground ring-1 ring-border transition hover:text-foreground ${aksan.hoverRing} active:scale-95`}
          >
            <RotateCcw className="h-3 w-3" /> Testten Çık
          </button>
        </div>
      </div>

      {/* Orta — soru + şıklar (scroll) */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        <div className="rounded-xl bg-card p-5 border border-border shadow-md">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {TIP_ETIKETI[soru.tip]}
            </p>
            {soru.osymFreq && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${aksan.rozetBg}`}>
                <aksan.rozetIkon className="h-3 w-3" strokeWidth={2} />
                {soru.osymFreq}
              </span>
            )}
          </div>

          <h2 className="mt-2 font-serif text-xl font-bold tracking-tight leading-snug text-balance text-card-foreground">
            {soru.vurgu}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
            {soru.metin}
          </p>

          <div className="mt-6 space-y-2.5">
            {soru.secenekler.map((secenek, i) => {
              const secildi = secim === secenek;
              const dogruSecenek = secenek === soru.dogru;
              const gosterDogru = secim !== null && dogruSecenek;
              const gosterYanlis = secildi && !dogruSecenek;

              let stil = "bg-background border border-border text-card-foreground hover:bg-muted/40";
              if (!secim) stil += ` ${aksan.hoverBorder}`;
              if (gosterDogru) stil = "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400";
              else if (gosterYanlis) stil = "bg-destructive/10 border-destructive/50 text-destructive";
              else if (secim !== null) stil = "bg-background border-border text-muted-foreground opacity-50";

              return (
                <button
                  key={secenek}
                  onClick={() => cevapla(secenek)}
                  disabled={secim !== null}
                  className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-left text-sm font-medium transition-colors ${stil} ${
                    gosterYanlis ? "animate-shake" : ""
                  } ${secim === null ? "active:scale-[0.99]" : ""}`}
                >
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-md text-xs font-bold tabular-nums ${
                      gosterDogru
                        ? "bg-emerald-500 text-white"
                        : gosterYanlis
                          ? "bg-destructive text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {gosterDogru ? (
                      <Check className="h-4 w-4" strokeWidth={3} />
                    ) : gosterYanlis ? (
                      <X className="h-4 w-4" strokeWidth={3} />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </span>
                  <span className="text-pretty">{secenek}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alt — bilgi notu + sonraki (sabit, her zaman görünür) */}
      {secim !== null && (
        <div className="shrink-0 pt-3 space-y-2.5">
          {soru.aciklama && (
            <div className={`rounded-lg px-3.5 py-3 text-xs leading-relaxed ${aksan.kutuYumusak}`}>
              <span className="font-bold">Bilgi notu: </span>
              {soru.aciklama}
            </div>
          )}
          <button
            id="sonraki-btn"
            onClick={sonraki}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 active:scale-[0.98] animate-rise ${aksan.buton}`}
          >
            {aktif + 1 >= sorular.length ? "Sonucu Gör" : "Sonraki Soru"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
