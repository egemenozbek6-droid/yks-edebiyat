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
} from "lucide-react";
import { anaDonemler, anaDonemFiltrele, type AnaDonem, type LiteratureItem } from "@/src/data";
import kadinYazarlarTest from "@/src/data/kadin_yazarlar_test.json";
import { osymSeverSorulari, type Soru as OsymSoru } from "@/lib/soru";
import { sfxCorrect, sfxWrong } from "@/lib/sfx";
import { kartTekrarKaydet } from "@/lib/leitner";

const OSYM_EN_IYI_KEY = "edebikart-osym-eniyi";

type Gorunum = "ana_menu" | "donem_secim" | "standart_test" | "osym_test";

type StandartSoru = {
  kategoriEtiketi: string;
  vurguBaslik: string;
  soruMetni: string;
  dogruCevap: string;
  secenekler: string[];
  kartId?: string;
};

export default function TestModul() {
  const [gorunum, setGorunum] = useState<Gorunum>("ana_menu");

  // --- ÖSYM SEVER STATE'LERİ ---
  const [osymSorular, setOsymSorular] = useState<OsymSoru[]>([]);
  const [osymAktif, setOsymAktif] = useState(0);
  const [osymSecim, setOsymSecim] = useState<string | null>(null);
  const [osymDogruSayi, setOsymDogruSayi] = useState(0);
  const [osymBitti, setOsymBitti] = useState(false);
  const [osymEnIyiSkor, setOsymEnIyiSkor] = useState(0);

  useEffect(() => {
    const kayitli = localStorage.getItem(OSYM_EN_IYI_KEY);
    setOsymEnIyiSkor(kayitli ? parseInt(kayitli, 10) : 0);
  }, []);

  const osymBaslat = useCallback(() => {
    setOsymSorular(osymSeverSorulari());
    setOsymAktif(0);
    setOsymSecim(null);
    setOsymDogruSayi(0);
    setOsymBitti(false);
    setGorunum("osym_test");
  }, []);

  const osymCevapla = (secenek: string) => {
    if (osymSecim) return;
    const soru = osymSorular[osymAktif];
    if (secenek === soru.dogru) {
      sfxCorrect();
      setOsymDogruSayi((s) => s + 1);
    } else {
      sfxWrong();
      const v = soru.vurgu.toLocaleLowerCase("tr").trim();
      const tumu = anaDonemFiltrele("Tüm Dönemler");
      const eslesenKart = tumu.find(
        (y) =>
          y.work.toLocaleLowerCase("tr").trim() === v ||
          y.author.toLocaleLowerCase("tr").trim() === v
      );
      if (eslesenKart) {
        kartTekrarKaydet(String(eslesenKart.id));
      }
    }
    setOsymSecim(secenek);
  };

  const osymSonraki = () => {
    if (osymAktif + 1 >= osymSorular.length) {
      if (osymDogruSayi > osymEnIyiSkor) {
        localStorage.setItem(OSYM_EN_IYI_KEY, String(osymDogruSayi));
        setOsymEnIyiSkor(osymDogruSayi);
      }
      setOsymBitti(true);
      return;
    }
    setOsymAktif((a) => a + 1);
    setOsymSecim(null);
  };

  // --- STANDART TEST STATE'LERİ ---
  const [standartSorular, setStandartSorular] = useState<StandartSoru[]>([]);
  const [standartIndex, setStandartIndex] = useState(0);
  const [standartSecim, setStandartSecim] = useState<string | null>(null);
  const [standartDogru, setStandartDogru] = useState(0);
  const [standartYanlis, setStandartYanlis] = useState(0);
  const [standartBitti, setStandartBitti] = useState(false);
  const [testBaslik, setTestBaslik] = useState("");

  const standartTestBaslat = (tur: "donem" | "kadin" | "kahraman" | "akim", donemParam?: AnaDonem) => {
    let havuz: LiteratureItem[] = anaDonemFiltrele("Tüm Dönemler");
    let baslik = "Test";

    if (tur === "donem" && donemParam) {
      baslik = donemParam;
      if (donemParam !== "Tüm Dönemler") {
        havuz = havuz.filter((item) => item.period === donemParam);
      }
    } else if (tur === "kadin") {
      baslik = "Kadın Yazarlar & Eserleri";
      havuz = kadinYazarlarTest as unknown as LiteratureItem[];
    } else if (tur === "kahraman") {
      baslik = "Eser – Kahraman";
      havuz = havuz.filter((item) => item.hero);
    } else if (tur === "akim") {
      baslik = "Batı Edebi Akımları";
      havuz = havuz.filter((item) => item.genre?.includes("Akım") || item.period);
    }

    if (havuz.length === 0) havuz = anaDonemFiltrele("Tüm Dönemler");

    const karisik = [...havuz].sort(() => Math.random() - 0.5);
    const secilenler = karisik.slice(0, 15);

    const olusan: StandartSoru[] = secilenler.map((item) => {
      let kategoriEtiketi = `${(item.period || "GENEL EDEBİYAT").toUpperCase()} · ${(item.genre || "ESER").toUpperCase()}`;
      let vurguBaslik = item.work;
      let soruMetni = `Aşağıdaki yazarlardan hangisi bu eserin sahibidir?`;
      let dogruCevap = item.author;

      if (tur === "kahraman" && item.hero) {
        kategoriEtiketi = "ESER – KAHRAMAN EŞLEŞTİRME";
        vurguBaslik = item.hero;
        soruMetni = `Bu karakter aşağıdaki eserlerin hangisinde yer alır?`;
        dogruCevap = item.work;
      }

      const digerleri = Array.from(
        new Set(havuz.map((x) => (tur === "kahraman" ? x.work : x.author)).filter((a) => a !== dogruCevap))
      )
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      return {
        kategoriEtiketi,
        vurguBaslik,
        soruMetni,
        dogruCevap,
        secenekler: [dogruCevap, ...digerleri].sort(() => Math.random() - 0.5),
        kartId: String(item.id),
      };
    });

    setStandartSorular(olusan);
    setTestBaslik(baslik);
    setStandartIndex(0);
    setStandartSecim(null);
    setStandartDogru(0);
    setStandartYanlis(0);
    setStandartBitti(false);
    setGorunum("standart_test");
  };

  const standartCevapla = (secenek: string) => {
    if (standartSecim !== null) return;
    setStandartSecim(secenek);

    const soru = standartSorular[standartIndex];
    if (secenek === soru.dogruCevap) {
      sfxCorrect();
      setStandartDogru((p) => p + 1);
    } else {
      sfxWrong();
      setStandartYanlis((p) => p + 1);
      if (soru.kartId) {
        kartTekrarKaydet(soru.kartId);
      }
    }
  };

  const standartSonraki = () => {
    if (standartIndex + 1 < standartSorular.length) {
      setStandartIndex((p) => p + 1);
      setStandartSecim(null);
    } else {
      setStandartBitti(true);
    }
  };

  // ============================================================
  // GÖRÜNÜM 1: ÖSYM SEVER TESTİ (Düello Arayüzü Formatında)
  // ============================================================
  if (gorunum === "osym_test") {
    if (osymBitti) {
      const oran = Math.round((osymDogruSayi / osymSorular.length) * 100);
      const basari =
        oran >= 80 ? "Mükemmel!" : oran >= 60 ? "Çok İyi" : oran >= 40 ? "Gelişebilir" : "Tekrar Çalış";

      return (
        <div className="flex-1 flex items-center justify-center p-4 animate-rise max-w-xl mx-auto w-full">
          <div className="rounded-2xl bg-[#0d131f] border border-border/60 p-6 text-center shadow-2xl max-w-sm w-full">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-osym/15 text-osym ring-1 ring-osym/30">
              <Flame className="h-8 w-8" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-white">{basari}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {osymSorular.length} soruda <span className="font-bold text-osym">{osymDogruSayi}</span> doğru — %{oran}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <button
                onClick={osymBaslat}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-osym py-3 text-xs font-bold text-osym-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
              >
                <RotateCcw className="h-4 w-4" /> Tekrar Çöz
              </button>
              <button
                onClick={() => setGorunum("ana_menu")}
                className="rounded-xl bg-muted/30 py-3 text-xs font-semibold text-muted-foreground hover:bg-muted/50 active:scale-[0.98]"
              >
                Menüye Dön
              </button>
            </div>
          </div>
        </div>
      );
    }

    const soru = osymSorular[osymAktif];
    if (!soru) return null;

    return (
      <div className="animate-rise max-w-xl mx-auto w-full flex-1 flex flex-col justify-start p-2">
        {/* Üst Bar: Vazgeç ve Soru Sayacı */}
        <div className="flex items-center justify-between mb-3 px-1">
          <button
            onClick={() => setGorunum("ana_menu")}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" /> Vazgeç
          </button>
          <span className="rounded-full bg-osym/15 px-3 py-1 text-xs font-bold text-osym ring-1 ring-osym/30">
            Soru {osymAktif + 1} / {osymSorular.length}
          </span>
        </div>

        {/* Düello Tipi Koyu Soru Kartı */}
        <div className="rounded-2xl bg-[#0c121e] border border-border/50 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-osym uppercase">
              {soru.tip === "eser" ? "YAZARIN ESERİ" : "ESERİN YAZARI"}
            </span>
            {soru.osymFreq && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500">
                <Flame className="h-3 w-3" /> {soru.osymFreq}
              </span>
            )}
          </div>

          <h2 className="mt-2 text-xl font-bold text-white tracking-tight">{soru.vurgu}</h2>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{soru.metin}</p>

          {/* Düello Tipi Şıklar */}
          <div className="mt-5 space-y-2.5">
            {soru.secenekler.map((secenek, i) => {
              const secildi = osymSecim === secenek;
              const dogruMu = secenek === soru.dogru;
              const gosterDogru = osymSecim !== null && dogruMu;
              const gosterYanlis = secildi && !dogruMu;

              let kutuStil = "bg-[#111927] border-border/40 text-slate-200 hover:bg-[#162235] hover:border-border";
              let harfStil = "bg-[#1a2436] text-muted-foreground";

              if (gosterDogru) {
                kutuStil = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold";
                harfStil = "bg-emerald-500 text-white";
              } else if (gosterYanlis) {
                kutuStil = "bg-destructive/20 border-destructive text-destructive font-bold";
                harfStil = "bg-destructive text-white";
              } else if (osymSecim !== null) {
                kutuStil = "bg-[#111927]/40 border-border/20 text-muted-foreground/50 opacity-40";
              }

              return (
                <button
                  key={secenek}
                  onClick={() => osymCevapla(secenek)}
                  disabled={osymSecim !== null}
                  className={`flex w-full items-center gap-3.5 rounded-xl border p-3.5 text-left text-sm font-medium transition-all ${kutuStil} ${
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

          {osymSecim !== null && (
            <button
              onClick={osymSonraki}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-osym py-3.5 text-sm font-bold text-osym-foreground shadow-lg transition hover:brightness-110 active:scale-[0.99] animate-rise"
            >
              {osymAktif + 1 >= osymSorular.length ? "Testi Tamamla" : "Sonraki Soru"}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // GÖRÜNÜM 2: STANDART TESTLER (Düello Arayüzü Formatında)
  // ============================================================
  if (gorunum === "standart_test") {
    if (standartBitti) {
      const basariOrani = Math.round((standartDogru / standartSorular.length) * 100);
      return (
        <div className="flex-1 flex items-center justify-center p-4 animate-rise max-w-xl mx-auto w-full">
          <div className="rounded-2xl bg-[#0d131f] border border-border/60 p-6 text-center shadow-2xl max-w-sm w-full">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30">
              <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-white">Test Bitti!</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {testBaslik} tamamlandı. Yanlışlar akıllı tekrar için Leitner <b>Kutu 1</b>'e işlendi.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-3 ring-1 ring-emerald-500/20">
                <span className="text-[10px] font-bold uppercase text-emerald-400">Doğru</span>
                <p className="mt-0.5 text-2xl font-black text-emerald-400">{standartDogru}</p>
              </div>
              <div className="rounded-xl bg-destructive/10 p-3 ring-1 ring-destructive/20">
                <span className="text-[10px] font-bold uppercase text-destructive">Yanlış</span>
                <p className="mt-0.5 text-2xl font-black text-destructive">{standartYanlis}</p>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-muted/20 p-2.5 text-xs font-semibold text-muted-foreground">
              Başarı Oranı: <span className="text-white font-bold">%{basariOrani}</span>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => setGorunum("ana_menu")}
                className="rounded-xl bg-violet-600 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-110 active:scale-[0.98]"
              >
                Menüye Dön
              </button>
            </div>
          </div>
        </div>
      );
    }

    const aktifSoru = standartSorular[standartIndex];
    if (!aktifSoru) return null;

    return (
      <div className="animate-rise max-w-xl mx-auto w-full flex-1 flex flex-col justify-start p-2">
        {/* Üst Bar: Vazgeç ve Soru Sayacı */}
        <div className="flex items-center justify-between mb-3 px-1">
          <button
            onClick={() => setGorunum("ana_menu")}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" /> Vazgeç
          </button>
          <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-bold text-violet-400 ring-1 ring-violet-500/30">
            Soru {standartIndex + 1} / {standartSorular.length}
          </span>
        </div>

        {/* Düello Tipi Koyu Soru Kartı */}
        <div className="rounded-2xl bg-[#0c121e] border border-border/50 p-5 shadow-xl">
          <span className="text-[11px] font-bold tracking-wider text-rose-500 uppercase">
            {aktifSoru.kategoriEtiketi}
          </span>

          <h2 className="mt-2 text-xl font-bold text-white tracking-tight">{aktifSoru.vurguBaslik}</h2>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{aktifSoru.soruMetni}</p>

          {/* Düello Tipi Şıklar */}
          <div className="mt-5 space-y-2.5">
            {aktifSoru.secenekler.map((secenek, i) => {
              const secildi = standartSecim === secenek;
              const dogruMu = secenek === aktifSoru.dogruCevap;
              const gosterDogru = standartSecim !== null && dogruMu;
              const gosterYanlis = secildi && !dogruMu;

              let kutuStil = "bg-[#111927] border-border/40 text-slate-200 hover:bg-[#162235] hover:border-border";
              let harfStil = "bg-[#1a2436] text-muted-foreground";

              if (gosterDogru) {
                kutuStil = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold";
                harfStil = "bg-emerald-500 text-white";
              } else if (gosterYanlis) {
                kutuStil = "bg-destructive/20 border-destructive text-destructive font-bold";
                harfStil = "bg-destructive text-white";
              } else if (standartSecim !== null) {
                kutuStil = "bg-[#111927]/40 border-border/20 text-muted-foreground/50 opacity-40";
              }

              return (
                <button
                  key={secenek}
                  onClick={() => standartCevapla(secenek)}
                  disabled={standartSecim !== null}
                  className={`flex w-full items-center gap-3.5 rounded-xl border p-3.5 text-left text-sm font-medium transition-all ${kutuStil} ${
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

          {standartSecim !== null && (
            <button
              onClick={standartSonraki}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 active:scale-[0.99] animate-rise"
            >
              {standartIndex + 1 === standartSorular.length ? "Testi Bitir" : "Sonraki Soru"}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // GÖRÜNÜM 3: DÖNEM TESTLERİ SEÇİM IZGARASI
  // ============================================================
  if (gorunum === "donem_secim") {
    return (
      <div className="flex-1 flex flex-col gap-3 p-1 animate-rise max-w-xl mx-auto w-full">
        {/* Test Modu Ana Banner */}
        <div className="rounded-3xl bg-[#0c121e] border border-border/60 p-6 text-center shadow-lg">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30">
            <Brain className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <h2 className="font-serif text-xl font-bold text-white">Test Modu</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Dönemleri tara veya özel seçkilerle bilgilerini pekiştir. Sınav provasına başla.
          </p>
        </div>

        {/* Dönemler Listesi */}
        <div className="rounded-3xl bg-[#0c121e] border border-border/60 p-5 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setGorunum("ana_menu")}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-white transition"
            >
              <ArrowLeft className="h-4 w-4" /> Geri Dön
            </button>
            <span className="text-[11px] font-semibold text-muted-foreground">15 Soru</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {anaDonemler.map((donem) => (
              <button
                key={donem}
                onClick={() => standartTestBaslat("donem", donem)}
                className="flex items-center justify-between rounded-xl bg-[#111927] p-3.5 text-xs font-semibold text-slate-300 ring-1 ring-border/40 transition hover:bg-[#162235] hover:text-white active:scale-[0.98]"
              >
                <span className="truncate">{donem}</span>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-40" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // GÖRÜNÜM 4: TEST ANA MENÜSÜ (ÖSYM SEVER + 🌸 KADIN + 🌐 AKIMLAR)
  // ============================================================
  return (
    <div className="flex-1 flex flex-col gap-3 p-1 animate-rise max-w-xl mx-auto w-full">
      {/* Test Modu Ana Banner */}
      <div className="rounded-3xl bg-[#0c121e] border border-border/60 p-6 text-center shadow-lg">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30">
          <Brain className="h-6 w-6" strokeWidth={1.8} />
        </div>
        <h2 className="font-serif text-xl font-bold text-white">Test Modu</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Dönemleri tara veya özel seçkilerle bilgilerini pekiştir. Sınav provasına başla.
        </p>
      </div>

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

        {/* 2. ÖSYM Sever (20 Soru Banko Prova) */}
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

        {/* 3. Kadın Yazarlar & Eserleri (🌸 Emojili) */}
        <button
          onClick={() => standartTestBaslat("kadin")}
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

        {/* 4. Eser – Kahraman */}
        <button
          onClick={() => standartTestBaslat("kahraman")}
          className="flex items-center justify-between rounded-2xl bg-[#0c121e] border border-border/60 p-4 transition hover:bg-[#111927] hover:border-border active:scale-[0.99] text-left shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25 text-lg">
              🎭
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

        {/* 5. Batı Edebi Akımları (🌐 Emojili) */}
        <button
          onClick={() => standartTestBaslat("akim")}
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
