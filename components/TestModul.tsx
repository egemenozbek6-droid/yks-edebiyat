"use client";

import { useState, useCallback, useEffect } from "react";
import {
  BookOpen,
  ChevronRight,
  Brain,
  Flame,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Users,
  Compass,
  X,
  Target,
} from "lucide-react";
import { anaDonemler, anaDonemFiltrele, type AnaDonem, type LiteratureItem } from "@/src/data";
import kadinYazarlarTest from "@/src/data/kadin_yazarlar_test.json";
import { osymSeverSorulari, type Soru as OsymSoru } from "@/lib/soru";
import { sfxCorrect, sfxWrong } from "@/lib/sfx";
import { kartTekrarKaydet } from "@/lib/leitner";

const OSYM_EN_IYI_KEY = "edebikart-osym-eniyi";

type Gorunum = "ana_menu" | "donem_secim" | "test_ekrani";

type SoruYapisi = {
  kategoriUst: string;
  rozetMetin: string;
  vurgu: string;
  metin: string;
  dogru: string;
  secenekler: string[];
  kartId?: string;
};

const MOTIVASYONLAR = [
  "Bu formla bahane üretirsen yazık olur valla.",
  "Her yanlış, gerçek sınavda bir doğru demek!",
  "Odaklan, AYT Edebiyat senin sahan.",
  "Ezber değil mantık, sen bu işi çözdün.",
];

export default function TestModul() {
  const [gorunum, setGorunum] = useState<Gorunum>("ana_menu");
  const [testAdi, setTestAdi] = useState("");
  const [sorular, setSorular] = useState<SoruYapisi[]>([]);
  const [aktifSoruIndex, setAktifSoruIndex] = useState(0);
  const [secim, setSecim] = useState<string | null>(null);
  const [dogruSayisi, setDogruSayisi] = useState(0);
  const [yanlisSayisi, setYanlisSayisi] = useState(0);
  const [bitti, setBitti] = useState(false);
  const [motivasyonGoster, setMotivasyonGoster] = useState(true);
  const [motivasyonMetni, setMotivasyonMetni] = useState(MOTIVASYONLAR[0]);

  // ÖSYM En İyi Skor
  const [osymEnIyiSkor, setOsymEnIyiSkor] = useState(0);
  useEffect(() => {
    const kayitli = localStorage.getItem(OSYM_EN_IYI_KEY);
    setOsymEnIyiSkor(kayitli ? parseInt(kayitli, 10) : 0);
  }, []);

  // Rastgele motivasyon
  useEffect(() => {
    setMotivasyonMetni(MOTIVASYONLAR[Math.floor(Math.random() * MOTIVASYONLAR.length)]);
  }, [gorunum]);

  // 1. ÖSYM SEVER BAŞLAT (20 Soru)
  const osymBaslat = useCallback(() => {
    const raw = osymSeverSorulari();
    const hazir: SoruYapisi[] = raw.map((s) => ({
      kategoriUst: s.tip === "eser" ? "YAZARIN ESERİ" : "ESERİN YAZARI",
      rozetMetin: s.osymFreq || "Özel Seçki",
      vurgu: s.vurgu,
      metin: s.metin,
      dogru: s.dogru,
      secenekler: s.secenekler,
    }));

    setSorular(hazir);
    setTestAdi("ÖSYM Sever Banko 20");
    setAktifSoruIndex(0);
    setSecim(null);
    setDogruSayisi(0);
    setYanlisSayisi(0);
    setBitti(false);
    setMotivasyonGoster(true);
    setGorunum("test_ekrani");
  }, []);

  // 2. STANDART TEST BAŞLAT (Dönem, Kadın Yazarlar, Kahraman, Akımlar)
  const standartBaslat = (tur: "donem" | "kadin" | "kahraman" | "akim", param?: string) => {
    let havuz: LiteratureItem[] = anaDonemFiltrele("Tüm Dönemler");
    let baslik = "Test";
    let rozet = "Özel Seçki";

    if (tur === "donem") {
      baslik = param ? `${param} Testi` : "Dönem Testi";
      rozet = param || "Dönem";
      if (param && param !== "Tüm Dönemler") {
        havuz = havuz.filter((item) => item.period === param);
      }
    } else if (tur === "kadin") {
      baslik = "Kadın Yazarlar Özel Testi";
      rozet = "Özel Seçki";
      havuz = kadinYazarlarTest as unknown as LiteratureItem[];
    } else if (tur === "kahraman") {
      baslik = "Eser – Kahraman Testi";
      rozet = "Karakter";
      havuz = havuz.filter((item) => item.hero);
    } else if (tur === "akim") {
      baslik = "Batı Edebi Akımları Testi";
      rozet = "Akım";
      havuz = havuz.filter((item) => item.genre?.includes("Akım") || item.period);
    }

    if (havuz.length === 0) havuz = anaDonemFiltrele("Tüm Dönemler");

    const karisik = [...havuz].sort(() => Math.random() - 0.5);
    const secilenler = karisik.slice(0, 10);

    const hazir: SoruYapisi[] = secilenler.map((item) => {
      let kategoriUst = "YAZARIN ESERİ";
      let vurgu = item.work;
      let metin = "Aşağıdaki yazarlardan hangisi bu eserin yazarıdır?";
      let dogru = item.author;

      if (tur === "kahraman" && item.hero) {
        kategoriUst = "ESER – KARAKTER EŞLEŞTİRME";
        vurgu = item.hero;
        metin = "Bu karakter aşağıdaki eserlerin hangisinde yer alır?";
        dogru = item.work;
      }

      const digerleri = Array.from(
        new Set(havuz.map((x) => (tur === "kahraman" ? x.work : x.author)).filter((a) => a !== dogru))
      )
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      return {
        kategoriUst,
        rozetMetin: rozet,
        vurgu,
        metin,
        dogru,
        secenekler: [dogru, ...digerleri].sort(() => Math.random() - 0.5),
        kartId: String(item.id),
      };
    });

    setSorular(hazir);
    setTestAdi(baslik);
    setAktifSoruIndex(0);
    setSecim(null);
    setDogruSayisi(0);
    setYanlisSayisi(0);
    setBitti(false);
    setMotivasyonGoster(true);
    setGorunum("test_ekrani");
  };

  const cevapVer = (cevap: string) => {
    if (secim !== null) return;
    setSecim(cevap);

    const soru = sorular[aktifSoruIndex];
    if (cevap === soru.dogru) {
      sfxCorrect();
      setDogruSayisi((s) => s + 1);
    } else {
      sfxWrong();
      setYanlisSayisi((s) => s + 1);
      if (soru.kartId) {
        kartTekrarKaydet(soru.kartId);
      } else {
        const v = soru.vurgu.toLocaleLowerCase("tr").trim();
        const tumu = anaDonemFiltrele("Tüm Dönemler");
        const eslesen = tumu.find(
          (y) =>
            y.work.toLocaleLowerCase("tr").trim() === v ||
            y.author.toLocaleLowerCase("tr").trim() === v
        );
        if (eslesen) kartTekrarKaydet(String(eslesen.id));
      }
    }
  };

  const sonrakiSoru = () => {
    if (aktifSoruIndex + 1 < sorular.length) {
      setAktifSoruIndex((prev) => prev + 1);
      setSecim(null);
    } else {
      if (testAdi.includes("ÖSYM") && dogruSayisi > osymEnIyiSkor) {
        localStorage.setItem(OSYM_EN_IYI_KEY, String(dogruSayisi));
        setOsymEnIyiSkor(dogruSayisi);
      }
      setBitti(true);
    }
  };

  // ============================================================
  // EKRAN 1: SORU TEST EKRANI (Birebir image_6.png)
  // ============================================================
  if (gorunum === "test_ekrani") {
    if (bitti) {
      const basariOrani = Math.round((dogruSayisi / sorular.length) * 100);
      return (
        <div className="flex-1 flex items-center justify-center p-4 animate-rise max-w-sm mx-auto w-full">
          <div className="rounded-3xl bg-[#0c121e] border border-border/60 p-6 text-center shadow-2xl w-full">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30">
              <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-white">Test Bitti!</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {testAdi} tamamlandı. Yanlışların Leitner <b>Kutu 1</b>'e eklendi.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-emerald-500/10 p-3 ring-1 ring-emerald-500/20">
                <span className="text-[10px] font-bold uppercase text-emerald-400">Doğru</span>
                <p className="mt-0.5 text-2xl font-black text-emerald-400">{dogruSayisi}</p>
              </div>
              <div className="rounded-2xl bg-destructive/10 p-3 ring-1 ring-destructive/20">
                <span className="text-[10px] font-bold uppercase text-destructive">Yanlış</span>
                <p className="mt-0.5 text-2xl font-black text-destructive">{yanlisSayisi}</p>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-muted/20 p-2.5 text-xs font-semibold text-muted-foreground">
              Başarı Oranı: <span className="text-white font-bold">%{basariOrani}</span>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => setGorunum("ana_menu")}
                className="rounded-xl bg-violet-600 py-3.5 text-sm font-bold text-white shadow-md transition hover:brightness-110 active:scale-[0.98]"
              >
                Menüye Dön
              </button>
            </div>
          </div>
        </div>
      );
    }

    const soru = sorular[aktifSoruIndex];
    if (!soru) return null;

    const ilerlemeYuzdesi = ((aktifSoruIndex + (secim ? 1 : 0)) / sorular.length) * 100;

    return (
      <div className="animate-rise max-w-md mx-auto w-full flex-1 flex flex-col justify-start p-2 gap-3">
        {/* 1. Motivasyon Baloncuğu (image_6.png tepesi) */}
        {motivasyonGoster && (
          <div className="flex items-center justify-between gap-2.5 rounded-2xl bg-[#0c121e]/90 border border-border/50 px-4 py-3 shadow-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-base shrink-0">💬</span>
              <p className="text-xs text-slate-300 truncate font-medium">{motivasyonMetni}</p>
            </div>
            <button
              onClick={() => setMotivasyonGoster(false)}
              className="text-muted-foreground hover:text-white p-1 shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* 2. Soru İlerleme & Çıkış Kartı (image_6.png) */}
        <div className="rounded-2xl bg-[#0c121e] border border-border/50 p-4 shadow-md">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span className="uppercase tracking-wider text-[11px]">SORU</span>
            <span>
              {aktifSoruIndex + 1}/{sorular.length} · {dogruSayisi} doğru
            </span>
          </div>

          {/* İlerleme Çizgisi */}
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
            <div
              className="h-full bg-violet-500 transition-all duration-300 rounded-full"
              style={{ width: `${ilerlemeYuzdesi}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium truncate max-w-[200px]">{testAdi}</span>
            <button
              onClick={() => setGorunum("ana_menu")}
              className="flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              <RotateCcw className="h-3 w-3" /> Testten Çık
            </button>
          </div>
        </div>

        {/* 3. Ana Soru Kartı (image_6.png alt büyük kart) */}
        <div className="rounded-3xl bg-[#0c121e] border border-border/50 p-5 shadow-xl flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                {soru.kategoriUst}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/15 border border-pink-500/30 px-2.5 py-0.5 text-[10px] font-bold text-pink-400">
                <Flame className="h-3 w-3" /> {soru.rozetMetin}
              </span>
            </div>

            <h2 className="mt-3 font-serif text-2xl font-bold text-white tracking-tight leading-snug">
              {soru.vurgu}
            </h2>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">{soru.metin}</p>

            {/* Şıklar (image_6.png A, B, C, D kutuları) */}
            <div className="mt-5 space-y-2.5">
              {soru.secenekler.map((secenek, i) => {
                const secildi = secim === secenek;
                const dogruMu = secenek === soru.dogru;
                const gosterDogru = secim !== null && dogruMu;
                const gosterYanlis = secildi && !dogruMu;

                let kutuStil = "bg-[#111927] border-border/40 text-slate-200 hover:bg-[#162235]";
                let harfStil = "bg-[#1a2436] text-slate-400";

                if (gosterDogru) {
                  kutuStil = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold";
                  harfStil = "bg-emerald-500 text-white";
                } else if (gosterYanlis) {
                  kutuStil = "bg-destructive/20 border-destructive text-destructive font-bold";
                  harfStil = "bg-destructive text-white";
                } else if (secim !== null) {
                  kutuStil = "bg-[#111927]/40 border-border/20 text-slate-500 opacity-40";
                }

                return (
                  <button
                    key={secenek}
                    onClick={() => cevapVer(secenek)}
                    disabled={secim !== null}
                    className={`flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left text-sm font-medium transition-all ${kutuStil} ${
                      gosterYanlis ? "animate-shake" : ""
                    }`}
                  >
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${harfStil}`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{secenek}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sonraki Soru Butonu */}
          {secim !== null && (
            <button
              onClick={sonrakiSoru}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 active:scale-[0.99] animate-rise shrink-0"
            >
              {aktifSoruIndex + 1 >= sorular.length ? "Testi Bitir" : "Sonraki Soru"}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // EKRAN 2: DÖNEM SEÇİM EKRANI (Birebir image_7.png)
  // ============================================================
  if (gorunum === "donem_secim") {
    return (
      <div className="flex-1 flex flex-col gap-3 p-1 animate-rise max-w-md mx-auto w-full">
        {/* ← Kategorilere Dön */}
        <button
          onClick={() => setGorunum("ana_menu")}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition px-1 py-1"
        >
          <ArrowLeft className="h-4 w-4" /> Kategorilere Dön
        </button>

        {/* Bir Dönem Seç Banner (image_7.png) */}
        <div className="rounded-3xl bg-[#0c121e] border border-border/60 p-5 text-center shadow-md">
          <h2 className="font-serif text-lg font-bold text-white">Bir Dönem Seç</h2>
          <p className="mt-0.5 text-xs text-slate-400">Eksiğin olan dönemi belirle ve teste dal!</p>
        </div>

        {/* Dönemler Dikey Listesi (image_7.png) */}
        <div className="flex flex-col gap-2">
          {/* Tüm Dönemler (Mor Buton) */}
          <button
            onClick={() => standartBaslat("donem", "Tüm Dönemler")}
            className="flex items-center gap-3 rounded-2xl bg-violet-600 px-4 py-3.5 text-sm font-bold text-white shadow-md transition hover:brightness-110 active:scale-[0.99]"
          >
            <Target className="h-5 w-5" />
            <span>Tüm Dönemler</span>
          </button>

          {/* Diğer Dönemler (Numaralı Butonlar) */}
          {anaDonemler
            .filter((d) => d !== "Tüm Dönemler")
            .map((donem, i) => (
              <button
                key={donem}
                onClick={() => standartBaslat("donem", donem)}
                className="flex items-center gap-3.5 rounded-2xl bg-[#0c121e] border border-border/50 px-4 py-3.5 text-left text-sm font-semibold text-slate-200 shadow-sm transition hover:bg-[#111927] hover:border-border active:scale-[0.99]"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#141d2e] text-xs font-bold text-slate-400">
                  {i + 1}
                </span>
                <span className="flex-1 truncate">{donem}</span>
              </button>
            ))}
        </div>
      </div>
    );
  }

  // ============================================================
  // EKRAN 3: TEST ANA LİSTESİ (Birebir image_8.png + ÖSYM SEVER DAHİL)
  // ============================================================
  return (
    <div className="flex-1 flex flex-col gap-3 p-1 animate-rise max-w-md mx-auto w-full">
      {/* Test Modu Ana Banner (image_8.png) */}
      <div className="rounded-3xl bg-[#0c121e] border border-border/60 p-6 text-center shadow-lg">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30">
          <Brain className="h-6 w-6" strokeWidth={1.8} />
        </div>
        <h2 className="font-serif text-xl font-bold text-white">Test Modu</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Dönemleri tara veya özel seçkilerle bilgilerini pekiştir. Sınav provasına başla.
        </p>
      </div>

      {/* Dikey Seçenek Kartları (image_8.png) */}
      <div className="flex flex-col gap-2.5">
        {/* 1. Dönem Testleri */}
        <button
          onClick={() => setGorunum("donem_secim")}
          className="flex items-center justify-between rounded-2xl bg-[#0c121e] border border-border/60 p-4 transition hover:bg-[#111927] hover:border-border active:scale-[0.99] text-left shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/25">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-sm font-bold text-white">Dönem Testleri</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Eksiklerini bul, teste başla! 🚀</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
        </button>

        {/* 2. ÖSYM Sever (İşte listeye eklenen 20 soruluk sınav modu!) */}
        <button
          onClick={osymBaslat}
          className="flex items-center justify-between rounded-2xl bg-[#0c121e] border border-osym/40 p-4 transition hover:bg-osym/5 hover:border-osym/70 active:scale-[0.99] text-left shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-osym/15 text-osym ring-1 ring-osym/30">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-serif text-sm font-bold text-white">ÖSYM Sever</p>
                <span className="rounded-full bg-osym/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-osym ring-1 ring-osym/30">
                  Banko 20
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Dönem sınırı yok! Banko sorularla gerçek sınav provası 🔥
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-osym/70" />
        </button>

        {/* 3. Kadın Yazarlar & Eserleri (🌸 Emojili, image_8.png) */}
        <button
          onClick={() => standartBaslat("kadin")}
          className="flex items-center justify-between rounded-2xl bg-[#0c121e] border border-border/60 p-4 transition hover:bg-[#111927] hover:border-border active:scale-[0.99] text-left shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-pink-500/15 text-pink-400 ring-1 ring-pink-500/25 text-lg">
              🌸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-serif text-sm font-bold text-white">Kadın Yazarlar & Eserleri</p>
                <span className="rounded-full bg-pink-500/15 px-1.5 py-0.5 text-[9px] font-bold text-pink-400">
                  Özel
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Sadece kadın yazar ve eserleri! 🌸</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
        </button>

        {/* 4. Eser – Kahraman (image_8.png) */}
        <button
          onClick={() => standartBaslat("kahraman")}
          className="flex items-center justify-between rounded-2xl bg-[#0c121e] border border-border/60 p-4 transition hover:bg-[#111927] hover:border-border active:scale-[0.99] text-left shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-serif text-sm font-bold text-white">Eser – Kahraman</p>
                <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
                  Karakter
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Eser ↔ karakter eşleştir, bankoları ezberle! 🎭
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
        </button>

        {/* 5. Batı Edebi Akımları (🌐 Global Dünya, image_8.png) */}
        <button
          onClick={() => standartBaslat("akim")}
          className="flex items-center justify-between rounded-2xl bg-[#0c121e] border border-border/60 p-4 transition hover:bg-[#111927] hover:border-border active:scale-[0.99] text-left shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/25 text-lg">
              🌐
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-serif text-sm font-bold text-white">Batı Edebi Akımları</p>
                <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[9px] font-bold text-sky-400">
                  Akım
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Akımları, temsilcileri ve özellikleriyle tanı! 🌐
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
        </button>
      </div>
    </div>
  );
}
