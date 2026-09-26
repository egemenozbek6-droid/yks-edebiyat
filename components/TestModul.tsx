"use client";

import { useState } from "react";
import { BookOpen, Sparkles, Users, Compass, ChevronRight, Brain, ArrowLeft, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { anaDonemler, anaDonemFiltrele, type AnaDonem, type LiteratureItem } from "@/src/data";
import kadinYazarlarTest from "@/src/data/kadin_yazarlar_test.json";
import { sfxCorrect, sfxWrong } from "@/lib/sfx";
import { kartTekrarKaydet } from "@/lib/leitner";

type AltMod = "menu" | "test";

type Soru = {
  soruMetni: string;
  dogruCevap: string;
  secenekler: string[];
  aciklama?: string;
  kartId?: string;
};

export default function TestModul() {
  const [altMod, setAltMod] = useState<AltMod>("menu");
  const [testBaslik, setTestBaslik] = useState("");
  const [sorular, setSorular] = useState<Soru[]>([]);
  const [aktifIndex, setAktifIndex] = useState(0);
  const [secim, setSecim] = useState<string | null>(null);
  const [dogruSayisi, setDogruSayisi] = useState(0);
  const [yanlisSayisi, setYanlisSayisi] = useState(0);
  const [bitti, setBitti] = useState(false);

  const testiBaslat = (tur: "donem" | "kadin" | "kahraman" | "akim", donemAdi?: AnaDonem) => {
    let havuz: LiteratureItem[] = anaDonemFiltrele("Tüm Dönemler");
    let baslik = "Test";

    if (tur === "donem" && donemAdi) {
      baslik = donemAdi;
      if (donemAdi !== "Tüm Dönemler") {
        havuz = havuz.filter((item) => item.period === donemAdi);
      }
    } else if (tur === "kadin") {
      baslik = "Kadın Yazarlar & Eserleri";
      havuz = kadinYazarlarTest as unknown as LiteratureItem[];
    } else if (tur === "kahraman") {
      baslik = "Eser – Kahraman";
      // Kahraman verisi olanlar
      havuz = havuz.filter((item) => item.hero);
    } else if (tur === "akim") {
      baslik = "Batı Edebi Akımları";
      havuz = havuz.filter((item) => item.genre?.includes("Akım") || item.period);
    }

    if (havuz.length === 0) havuz = anaDonemFiltrele("Tüm Dönemler");

    const karisik = [...havuz].sort(() => Math.random() - 0.5);
    const secilenler = karisik.slice(0, 15);

    const olusanSorular: Soru[] = secilenler.map((item) => {
      let soruMetni = `"${item.work}" adlı eserin yazarı kimdir?`;
      let dogruCevap = item.author;
      let cevapHavuzu = havuz;

      if (tur === "kahraman" && item.hero) {
        soruMetni = `"${item.hero}" kahramanı hangi esere aittir?`;
        dogruCevap = item.work;
      }

      const digerleri = Array.from(
        new Set(cevapHavuzu.map((x) => (tur === "kahraman" ? x.work : x.author)).filter((a) => a !== dogruCevap))
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

    setSorular(olusanSorular);
    setTestBaslik(baslik);
    setAktifIndex(0);
    setSecim(null);
    setDogruSayisi(0);
    setYanlisSayisi(0);
    setBitti(false);
    setAltMod("test");
  };

  const cevapla = (secenek: string) => {
    if (secim !== null) return;
    setSecim(secenek);

    const soru = sorular[aktifIndex];
    if (secenek === soru.dogruCevap) {
      sfxCorrect();
      setDogruSayisi((p) => p + 1);
    } else {
      sfxWrong();
      setYanlisSayisi((p) => p + 1);
      if (soru.kartId) {
        kartTekrarKaydet(soru.kartId);
      }
    }
  };

  const sonrakiSoru = () => {
    if (aktifIndex + 1 < sorular.length) {
      setAktifIndex((p) => p + 1);
      setSecim(null);
    } else {
      setBitti(true);
    }
  };

  if (altMod === "test") {
    if (bitti) {
      const basariOrani = Math.round((dogruSayisi / sorular.length) * 100);
      return (
        <div className="flex-1 flex items-center justify-center p-4 animate-rise max-w-xl mx-auto w-full">
          <div className="rounded-2xl bg-card p-6 text-center border border-border shadow-xl max-w-sm w-full">
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
                <p className="mt-0.5 text-2xl font-black text-emerald-500">{dogruSayisi}</p>
              </div>
              <div className="rounded-xl bg-destructive/10 p-3 ring-1 ring-destructive/20">
                <span className="text-[10px] font-bold uppercase text-destructive">Yanlış</span>
                <p className="mt-0.5 text-2xl font-black text-destructive">{yanlisSayisi}</p>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-muted/40 p-2.5 text-xs font-semibold text-muted-foreground">
              Başarı Oranı: <span className="text-foreground font-bold">%{basariOrani}</span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <button
                onClick={() => testiBaslat("donem", "Tüm Dönemler")}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 py-3 text-xs font-bold text-white shadow-md transition hover:brightness-110 active:scale-[0.98]"
              >
                <RotateCcw className="h-4 w-4" /> Tekrar Çöz
              </button>
              <button
                onClick={() => setAltMod("menu")}
                className="rounded-xl bg-muted/60 py-3 text-xs font-semibold text-muted-foreground hover:bg-muted active:scale-[0.98]"
              >
                Menüye Dön
              </button>
            </div>
          </div>
        </div>
      );
    }

    const aktifSoru = sorular[aktifIndex];
    if (!aktifSoru) return null;

    return (
      <div className="animate-rise max-w-xl mx-auto w-full flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar p-1 pb-4">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <button
            onClick={() => setAltMod("menu")}
            className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Vazgeç
          </button>
          <span className="rounded-full bg-muted/60 px-3 py-1 text-xs font-bold text-violet-500">
            Soru {aktifIndex + 1} / {sorular.length}
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
                const secildi = secim === secenek;
                const dogruMu = secenek === aktifSoru.dogruCevap;

                let stil = "bg-card border-border text-foreground hover:border-violet-500/50";
                if (secim !== null) {
                  if (dogruMu) stil = "bg-emerald-500/15 border-emerald-500 text-emerald-400 font-bold";
                  else if (secildi) stil = "bg-destructive/15 border-destructive text-destructive font-bold";
                  else stil = "bg-card/50 border-border/50 text-muted-foreground opacity-50";
                }

                return (
                  <button
                    key={secenek}
                    onClick={() => cevapla(secenek)}
                    disabled={secim !== null}
                    className={`flex w-full items-center justify-between rounded-xl border p-4 text-left text-sm font-semibold transition-all ${stil}`}
                  >
                    <span>{secenek}</span>
                    {secim !== null &&
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

          {secim !== null && (
            <button
              onClick={sonrakiSoru}
              className="mt-6 w-full rounded-xl bg-violet-600 py-3.5 text-sm font-bold text-white shadow-md transition hover:brightness-110 active:scale-[0.98] animate-pop shrink-0"
            >
              {aktifIndex + 1 === sorular.length ? "Testi Bitir" : "Sonraki Soru"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-3 p-1 animate-rise max-w-xl mx-auto w-full">
      {/* Test Modu Ana Banner */}
      <div className="rounded-2xl bg-card border border-border p-5 text-center shadow-sm">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-violet-500/15 text-violet-500 ring-1 ring-violet-500/30">
          <Brain className="h-6 w-6" strokeWidth={1.8} />
        </div>
        <h2 className="font-serif text-xl font-bold text-card-foreground">Test Modu</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Dönemleri tara veya özel seçkilerle bilgilerini pekiştir. Sınav provasına başla.
        </p>
      </div>

      {/* Dönem Testleri */}
      <div className="glass-card rounded-2xl p-4 ring-1 ring-border/80">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-violet-500" />
            <p className="font-serif text-sm font-bold text-card-foreground">Dönem Testleri</p>
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground">15 Soru</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {anaDonemler.map((donem) => (
            <button
              key={donem}
              onClick={() => testiBaslat("donem", donem)}
              className="flex items-center justify-between rounded-xl bg-muted/40 p-3 text-xs font-semibold text-muted-foreground ring-1 ring-border/60 transition hover:bg-muted/70 hover:text-foreground active:scale-[0.98]"
            >
              <span className="truncate">{donem}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </button>
          ))}
        </div>
      </div>

      {/* Kadın Yazarlar */}
      <button
        onClick={() => testiBaslat("kadin")}
        className="glass-card flex items-center justify-between rounded-2xl p-4 ring-1 ring-border/80 transition hover:border-pink-500/40 hover:bg-pink-500/5 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-pink-500/15 text-pink-500 ring-1 ring-pink-500/25">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <p className="font-serif text-sm font-bold text-card-foreground">Kadın Yazarlar & Eserleri</p>
              <span className="rounded-full bg-pink-500/15 px-1.5 py-0.5 text-[9px] font-bold text-pink-500">Özel</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Sadece kadın yazar ve eserleri! 🌸</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Eser - Kahraman & Edebi Akımlar */}
      <div className="grid grid-cols-1 gap-2.5">
        <button
          onClick={() => testiBaslat("kahraman")}
          className="glass-card flex items-center justify-between rounded-2xl p-4 ring-1 ring-border/80 transition hover:border-amber-500/40 hover:bg-amber-500/5 active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/25">
              <Users className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <p className="font-serif text-sm font-bold text-card-foreground">Eser – Kahraman</p>
                <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-500">Karakter</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Eser ↔ karakter eşleştir, bankoları ezberle! 🎭</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        <button
          onClick={() => testiBaslat("akim")}
          className="glass-card flex items-center justify-between rounded-2xl p-4 ring-1 ring-border/80 transition hover:border-sky-500/40 hover:bg-sky-500/5 active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/15 text-sky-500 ring-1 ring-sky-500/25">
              <Compass className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <p className="font-serif text-sm font-bold text-card-foreground">Batı Edebi Akımları</p>
                <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[9px] font-bold text-sky-500">Akım</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Akımları, temsilcileri ve özellikleriyle tanı! 🌐</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
