"use client";

import { useState, useCallback, useEffect } from "react";
import {
  BookOpen,
  Sparkles,
  Users,
  Compass,
  ChevronRight,
  Brain,
  Flame,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Check,
  X,
} from "lucide-react";
import { anaDonemler, anaDonemFiltrele, type AnaDonem, type LiteratureItem } from "@/src/data";
import kadinYazarlarTest from "@/src/data/kadin_yazarlar_test.json";
import { osymSeverSorulari, type Soru as OsymSoru } from "@/lib/soru";
import { sfxCorrect, sfxWrong } from "@/lib/sfx";
import { kartTekrarKaydet } from "@/lib/leitner";
import IlerlemeBari from "@/components/IlerlemeBari";

const OSYM_EN_IYI_KEY = "edebikart-osym-eniyi";

type Gorunum = "ana_menu" | "donem_secim" | "standart_test" | "osym_test";

type StandartSoru = {
  soruMetni: string;
  dogruCevap: string;
  secenekler: string[];
  aciklama?: string;
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
      let soruMetni = `"${item.work}" adlı eserin yazarı kimdir?`;
      let dogruCevap = item.author;

      if (tur === "kahraman" && item.hero) {
        soruMetni = `"${item.hero}" kahramanı hangi esere aittir?`;
        dogruCevap = item.work;
      }

      const digerleri = Array.from(
        new Set(havuz.map((x) => (tur === "kahraman" ? x.work : x.author)).filter((a) => a !== dogruCevap))
      )
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      return {
        soruMetni,
        dogruCevap,
        secenekler: [dogruCevap, ...digerleri].sort(() => Math.random() - 0.5),
        aciklama: `${item.period || ""} · ${item.genre || ""}`,
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
  // 1. ÖSYM TESTİ EKRANI (20 Soru)
  // ============================================================
  if (gorunum === "osym_test") {
    if (osymBitti) {
      const oran = Math.round((osymDogruSayi / osymSorular.length) * 100);
      const basari =
        oran >= 80 ? "Süpersin!" : oran >= 60 ? "İyi gidiyorsun" : oran >= 40 ? "Gelişebilir" : "Tekrar çalış";

      return (
        <div className="flex-1 flex items-center justify-center p-4 animate-rise max-w-xl mx-auto w-full">
          <div className="rounded-3xl bg-card p-6 text-center border border-border shadow-2xl max-w-sm w-full">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-osym/15 text-osym ring-1 ring-osym/30">
              <Flame className="h-8 w-8" strokeWidth={1.8} />
            </div>
            <h2 className="font-serif text-2xl font-bold text-card-foreground">{basari}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {osymSorular.length} soruda <span className="font-bold text-osym">{osymDogruSayi}</span> doğru — %{oran}
            </p>

            <div className="mt-5">
              <IlerlemeBari mevcut={osymDogruSayi} toplam={osymSorular.length} etiket="Doğru cevap" />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <button
                onClick={osymBaslat}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-osym py-3 text-xs font-bold text-osym-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
              >
                <RotateCcw className="h-4 w-4" /> Tekrar Çöz
              </button>
              <button
                onClick={() => setGorunum("ana_menu")}
                className="rounded-xl bg-muted/60 py-3 text-xs font-semibold text-muted-foreground hover:bg-muted active:scale-[0.98]"
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
      <div className="animate-rise max-w-xl mx-auto w-full flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar p-1 pb-4">
        <div className="mb-3 rounded-2xl bg-card border border-border p-3 shadow-sm shrink-0">
          <IlerlemeBari
            mevcut={osymAktif + (osymSecim ? 1 : 0)}
            toplam={osymSorular.length}
            etiket="Soru"
            sagEtiket={`${osymAktif + 1} / ${osymSorular.length} · ${osymDogruSayi} doğru`}
          />
          <div className="mt-2.5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-osym">
              <Flame className="h-3.5 w-3.5" /> Banko ÖSYM Sorusu
            </span>
            <button
              onClick={() => setGorunum("ana_menu")}
              className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-[11px] font-semibold text-destructive ring-1 ring-destructive/20 transition hover:bg-destructive/15 active:scale-95"
            >
              <X className="h-3 w-3" /> Çıkış
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-card p-5 border border-border shadow-lg flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {soru.tip === "eser" ? "Yazarın eseri" : "Eserin yazarı"}
              </p>
              {soru.osymFreq && (
                <span className="inline-flex items-center gap-1 rounded-full bg-osym/15 px-2.5 py-1 text-[10px] font-bold text-osym ring-1 ring-osym/30">
                  <Flame className="h-3 w-3" strokeWidth={2} />
                  {soru.osymFreq}
                </span>
              )}
            </div>

            <h2 className="mt-2 font-serif text-2xl font-bold leading-snug text-balance text-card-foreground">
              {soru.vurgu}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{soru.metin}</p>

            <div className="mt-5 space-y-2.5">
              {soru.secenekler.map((secenek, i) => {
                const secildi = osymSecim === secenek;
                const dogruSecenek = secenek === soru.dogru;
                const gosterDogru = osymSecim !== null && dogruSecenek;
                const gosterYanlis = secildi && !dogruSecenek;

                let stil = "bg-background border border-border text-card-foreground hover:border-osym/60 hover:bg-muted/40";
                if (gosterDogru) stil = "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400";
                else if (gosterYanlis) stil = "bg-destructive/10 border-destructive/50 text-destructive";
                else if (osymSecim !== null) stil = "bg-background border-border text-muted-foreground opacity-50";

                return (
                  <button
                    key={secenek}
                    onClick={() => osymCevapla(secenek)}
                    disabled={osymSecim !== null}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition-colors ${stil} ${
                      gosterYanlis ? "animate-shake" : ""
                    } ${osymSecim === null ? "active:scale-[0.99]" : ""}`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold tabular-nums ${
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

          {osymSecim !== null && (
            <button
              onClick={osymSonraki}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-osym py-3.5 text-sm font-bold text-osym-foreground shadow-md transition hover:brightness-110 active:scale-[0.98] animate-rise shrink-0"
            >
              {osymAktif + 1 >= osymSorular.length ? "Sonucu Gör" : "Sonraki Soru"}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // 2. STANDART TEST EKRANI (Dönem, Kadın, Kahraman, Akım)
  // ============================================================
  if (gorunum === "standart_test") {
    if (standartBitti) {
      const basariOrani = Math.round((standartDogru / standartSorular.length) * 100);
      return (
        <div className="flex-1 flex items-center justify-center p-4 animate-rise max-w-xl mx-auto w-full">
          <div className="rounded-3xl bg-card p-6 text-center border border-border shadow-2xl max-w-sm w-full">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-violet-500/15 text-violet-500 ring-1 ring-violet-500/30">
              <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-card-foreground">Test Bitti!</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {testBaslik} testi tamamlandı. Yanlışlar akıllı tekrar için Leitner <b>Kutu 1</b>'e işlendi.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-3 ring-1 ring-emerald-500/20">
                <span className="text-[10px] font-bold uppercase text-emerald-500">Doğru</span>
                <p className="mt-0.5 text-2xl font-black text-emerald-500">{standartDogru}</p>
              </div>
              <div className="rounded-xl bg-destructive/10 p-3 ring-1 ring-destructive/20">
                <span className="text-[10px] font-bold uppercase text-destructive">Yanlış</span>
                <p className="mt-0.5 text-2xl font-black text-destructive">{standartYanlis}</p>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-muted/40 p-2.5 text-xs font-semibold text-muted-foreground">
              Başarı Oranı: <span className="text-foreground font-bold">%{basariOrani}</span>
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
      <div className="animate-rise max-w-xl mx-auto w-full flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar p-1 pb-4">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <button
            onClick={() => setGorunum("ana_menu")}
            className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Vazgeç
          </button>
          <span className="rounded-full bg-muted/60 px-3 py-1 text-xs font-bold text-violet-500">
            Soru {standartIndex + 1} / {standartSorular.length}
          </span>
        </div>

        <div className="rounded-3xl bg-card p-5 border border-border shadow-lg flex-1 flex flex-col justify-between">
          <div>
            <div className="rounded-2xl bg-muted/40 p-4 border border-border/80 text-center mb-5">
              {aktifSoru.aciklama && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {aktifSoru.aciklama}
                </span>
              )}
              <h2 className="font-serif text-2xl font-bold mt-1 text-card-foreground">{aktifSoru.soruMetni}</h2>
            </div>

            <div className="space-y-2.5">
              {aktifSoru.secenekler.map((secenek) => {
                const secildi = standartSecim === secenek;
                const dogruMu = secenek === aktifSoru.dogruCevap;

                let stil = "bg-card border-border text-foreground hover:border-violet-500/50";
                if (standartSecim !== null) {
                  if (dogruMu) stil = "bg-emerald-500/15 border-emerald-500 text-emerald-400 font-bold";
                  else if (secildi) stil = "bg-destructive/15 border-destructive text-destructive font-bold";
                  else stil = "bg-card/50 border-border/50 text-muted-foreground opacity-50";
                }

                return (
                  <button
                    key={secenek}
                    onClick={() => standartCevapla(secenek)}
                    disabled={standartSecim !== null}
                    className={`flex w-full items-center justify-between rounded-xl border p-4 text-left text-sm font-semibold transition-all ${stil}`}
                  >
                    <span>{secenek}</span>
                    {standartSecim !== null &&
                      (dogruMu ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : secildi ? (
                        <XCircle className="h-5 w-5 text-destructive" />
                      ) : null)}
                  </button>
                );
              })}
            </div>
          </div>

          {standartSecim !== null && (
            <button
              onClick={standartSonraki}
              className="mt-6 w-full rounded-xl bg-violet-600 py-3.5 text-sm font-bold text-white shadow-md transition hover:brightness-110 active:scale-[0.98] animate-pop shrink-0"
            >
              {standartIndex + 1 === standartSorular.length ? "Testi Bitir" : "Sonraki Soru"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // 3. DÖNEM TESTLERİ SEÇİM IZGARASI (Görsel 1 Ekranı)
  // ============================================================
  if (gorunum === "donem_secim") {
    return (
      <div className="flex-1 flex flex-col gap-3 p-1 animate-rise max-w-xl mx-auto w-full">
        {/* Test Modu Ana Banner */}
        <div className="rounded-3xl bg-card border border-border p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/15 text-violet-500 ring-1 ring-violet-500/30">
            <Brain className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <h2 className="font-serif text-xl font-bold text-card-foreground">Test Modu</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Dönemleri tara veya özel seçkilerle bilgilerini pekiştir. Sınav provasına başla.
          </p>
        </div>

        {/* Dönemler Listesi */}
        <div className="rounded-3xl bg-card border border-border/80 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setGorunum("ana_menu")}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
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
                className="flex items-center justify-between rounded-2xl bg-muted/40 p-3.5 text-xs font-semibold text-muted-foreground ring-1 ring-border/60 transition hover:bg-muted/70 hover:text-foreground active:scale-[0.98]"
              >
                <span className="truncate">{donem}</span>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // 4. TEST ANA LİSTESİ (Görsel 2 Tasarımı + ÖSYM SEVER EKLİ)
  // ============================================================
  return (
    <div className="flex-1 flex flex-col gap-3 p-1 animate-rise max-w-xl mx-auto w-full">
      {/* Test Modu Ana Banner */}
      <div className="rounded-3xl bg-card border border-border p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/15 text-violet-500 ring-1 ring-violet-500/30">
          <Brain className="h-6 w-6" strokeWidth={1.8} />
        </div>
        <h2 className="font-serif text-xl font-bold text-card-foreground">Test Modu</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Dönemleri tara veya özel seçkilerle bilgilerini pekiştir. Sınav provasına başla.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {/* 1. Dönem Testleri (Tıklayınca Seçim Izgarasını Açar) */}
        <button
          onClick={() => setGorunum("donem_secim")}
          className="flex items-center justify-between rounded-2xl bg-card border border-border/80 p-4 transition hover:bg-muted/40 active:scale-[0.99] text-left shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500/15 text-violet-500 ring-1 ring-violet-500/25">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-sm font-bold text-card-foreground">Dönem Testleri</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Eksiklerini bul, teste başla! 🚀</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
        </button>

        {/* 2. ÖSYM Sever (İşte aradığın VIP Test Kartı, tam diğerleriyle aynı hizada) */}
        <button
          onClick={osymBaslat}
          className="flex items-center justify-between rounded-2xl bg-card border border-osym/40 p-4 transition hover:bg-osym/5 hover:border-osym/60 active:scale-[0.99] text-left shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-osym/15 text-osym ring-1 ring-osym/30">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-serif text-sm font-bold text-card-foreground">ÖSYM Sever</p>
                <span className="rounded-full bg-osym/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-osym ring-1 ring-osym/20">
                  Banko 20
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Dönem sınırı yok! Banko sorularla gerçek AYT provası 🔥
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-osym/70" />
        </button>

        {/* 3. Kadın Yazarlar & Eserleri */}
        <button
          onClick={() => standartTestBaslat("kadin")}
          className="flex items-center justify-between rounded-2xl bg-card border border-border/80 p-4 transition hover:bg-muted/40 active:scale-[0.99] text-left shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-pink-500/15 text-pink-500 ring-1 ring-pink-500/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-serif text-sm font-bold text-card-foreground">Kadın Yazarlar & Eserleri</p>
                <span className="rounded-full bg-pink-500/15 px-1.5 py-0.5 text-[9px] font-bold text-pink-500">
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
          className="flex items-center justify-between rounded-2xl bg-card border border-border/80 p-4 transition hover:bg-muted/40 active:scale-[0.99] text-left shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/25">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-serif text-sm font-bold text-card-foreground">Eser – Kahraman</p>
                <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-500">
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

        {/* 5. Batı Edebi Akımları */}
        <button
          onClick={() => standartTestBaslat("akim")}
          className="flex items-center justify-between rounded-2xl bg-card border border-border/80 p-4 transition hover:bg-muted/40 active:scale-[0.99] text-left shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-500/15 text-sky-500 ring-1 ring-sky-500/25">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-serif text-sm font-bold text-card-foreground">Batı Edebi Akımları</p>
                <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[9px] font-bold text-sky-500">
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
