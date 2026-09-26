"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Compass,
  Flame,
  RotateCcw,
  Sparkles,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { anaDonemler, type AnaDonem, type LiteratureItem, tumYazarlar } from "@/src/data";
import kadinYazarlarTest from "@/src/data/kadin_yazarlar_test.json";
import { osymSeverSorulari, type Soru as OsymSoru } from "@/lib/soru";
import { sfxCorrect, sfxWrong } from "@/lib/sfx";
import { kartTekrarKaydet } from "@/lib/leitner";
import IlerlemeBari from "@/components/IlerlemeBari";

const OSYM_EN_IYI_KEY = "edebikart-osym-eniyi";
const OSYM_SORU_SAYISI = 20;

type StandartSoru = {
  soruMetni: string;
  dogruCevap: string;
  secenekler: string[];
  aciklama?: string;
  kartId?: string;
};

export default function TestModul() {
  // Mod seçimi
  const [aktifMod, setAktifMod] = useState<"menu" | "osym" | "standart">("menu");

  // --- ÖSYM SEVER STATE'LERİ (Orijinal Mantık) ---
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
    setAktifMod("osym");
  }, []);

  const osymCevapla = (secenek: string) => {
    if (osymSecim) return;
    const soru = osymSorular[osymAktif];
    if (secenek === soru.dogru) {
      sfxCorrect();
      setOsymDogruSayi((s) => s + 1);
    } else {
      sfxWrong();
      // Yanlış yapılanı anında Leitner Kutu 1'e pasla!
      const eslesenKart = tumYazarlar().find(
        (y) => y.work.toLowerCase() === soru.vurgu.toLowerCase() || y.author.toLowerCase() === soru.vurgu.toLowerCase()
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

  // --- DÖNEM VE DİĞER SEÇKİLER STATE'LERİ ---
  const [standartSorular, setStandartSorular] = useState<StandartSoru[]>([]);
  const [standartIndex, setStandartIndex] = useState(0);
  const [standartSecim, setStandartSecim] = useState<string | null>(null);
  const [standartDogru, setStandartDogru] = useState(0);
  const [standartYanlis, setStandartYanlis] = useState(0);
  const [standartBitti, setStandartBitti] = useState(false);
  const [seciliBaslik, setSeciliBaslik] = useState("");

  const standartTestBaslat = (tur: "donem" | "kadin", param?: AnaDonem) => {
    let havuz: LiteratureItem[] = tumYazarlar();
    let baslik = "Dönem Testi";

    if (tur === "donem" && param) {
      baslik = param;
      if (param !== "Tüm Dönemler") {
        havuz = havuz.filter((item) => item.period === param);
      }
    } else if (tur === "kadin") {
      baslik = "Kadın Yazarlar";
      havuz = kadinYazarlarTest as unknown as LiteratureItem[];
    }

    const karisik = [...havuz].sort(() => Math.random() - 0.5);
    const secilenler = karisik.slice(0, 15);

    const olusan: StandartSoru[] = secilenler.map((item) => {
      const digerleri = Array.from(new Set(havuz.map((x) => x.author).filter((a) => a !== item.author)))
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      return {
        soruMetni: `"${item.work}" adlı eserin yazarı kimdir?`,
        dogruCevap: item.author,
        secenekler: [item.author, ...digerleri].sort(() => Math.random() - 0.5),
        aciklama: `${item.period} · ${item.genre}`,
        kartId: String(item.id),
      };
    });

    setStandartSorular(olusan);
    setStandartIndex(0);
    setStandartSecim(null);
    setStandartDogru(0);
    setStandartYanlis(0);
    setStandartBitti(false);
    setSeciliBaslik(baslik);
    setAktifMod("standart");
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
  // GÖRÜNÜM 1: ÖSYM SEVER EKRANI
  // ============================================================
  if (aktifMod === "osym") {
    if (osymBitti) {
      const oran = Math.round((osymDogruSayi / osymSorular.length) * 100);
      const basari =
        oran >= 80 ? "Süpersin!" : oran >= 60 ? "İyi gidiyorsun" : oran >= 40 ? "Gelişebilir" : "Tekrar çalış";
      const yeniRekor = osymDogruSayi >= osymEnIyiSkor;

      return (
        <div className="animate-rise rounded-2xl bg-card p-6 text-center border border-border max-w-sm mx-auto w-full my-auto">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-osym/15 text-osym ring-1 ring-osym/30">
            <Flame className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-2xl font-bold text-card-foreground">{basari}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {osymSorular.length} soruda <span className="font-bold text-osym">{osymDogruSayi}</span> doğru — %{oran}
          </p>
          {yeniRekor && <p className="mt-1.5 text-xs font-bold text-amber-500">🏆 Yeni Rekor!</p>}

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
              onClick={() => setAktifMod("menu")}
              className="rounded-xl bg-muted/60 py-3 text-xs font-semibold text-muted-foreground hover:bg-muted active:scale-[0.98]"
            >
              Menüye Dön
            </button>
          </div>
        </div>
      );
    }

    const soru = osymSorular[osymAktif];
    if (!soru) return null;

    return (
      <div className="animate-rise max-w-xl mx-auto w-full flex flex-col flex-1 justify-between p-1">
        <div>
          <div className="mb-4 rounded-2xl bg-card border border-border p-3 shadow-sm">
            <IlerlemeBari
              mevcut={osymAktif + (osymSecim ? 1 : 0)}
              toplam={osymSorular.length}
              etiket="Soru"
              sagEtiket={`${osymAktif + 1} / ${osymSorular.length} · ${osymDogruSayi} doğru`}
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-osym">
                <Flame className="h-3.5 w-3.5" /> Banko ÖSYM Sorusu
              </span>
              <button
                onClick={() => setAktifMod("menu")}
                className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-[11px] font-semibold text-destructive ring-1 ring-destructive/20 transition hover:bg-destructive/15 active:scale-95"
              >
                <X className="h-3 w-3" /> Çıkış
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-card p-5 border border-border shadow-lg">
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

                let stil =
                  "bg-background border border-border text-card-foreground hover:border-osym/60 hover:bg-muted/40";
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

            {osymSecim !== null && (
              <button
                onClick={osymSonraki}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-osym py-3.5 text-sm font-bold text-osym-foreground shadow-md transition hover:brightness-110 active:scale-[0.98] animate-rise"
              >
                {osymAktif + 1 >= osymSorular.length ? "Sonucu Gör" : "Sonraki Soru"}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // GÖRÜNÜM 2: DÖNEM & KADIN YAZARLAR TEST EKRANI
  // ============================================================
  if (aktifMod === "standart") {
    if (standartBitti) {
      const basariOrani = Math.round((standartDogru / standartSorular.length) * 100);
      return (
        <div className="flex-1 flex items-center justify-center p-4 animate-rise">
          <div className="glass-card rounded-2xl p-6 text-center shadow-xl max-w-sm w-full ring-1 ring-border">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary animate-pop">
              <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-card-foreground">Test Bitti!</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {seciliBaslik} testi tamamlandı. Yanlışlar Leitner <b>Kutu 1</b>'e işlendi.
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
                onClick={() => setAktifMod("menu")}
                className="rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
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
      <div className="flex-1 flex flex-col justify-between p-1 max-w-xl mx-auto w-full animate-rise">
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setAktifMod("menu")}
              className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Vazgeç
            </button>
            <span className="rounded-full bg-muted/60 px-3 py-1 text-xs font-bold text-primary">
              Soru {standartIndex + 1} / {standartSorular.length}
            </span>
          </div>

          <div className="glass-card rounded-2xl p-6 ring-1 ring-border text-center">
            {aktifSoru.aciklama && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {aktifSoru.aciklama}
              </span>
            )}
            <h2 className="font-serif text-2xl font-bold mt-2 text-card-foreground">{aktifSoru.soruMetni}</h2>
          </div>

          <div className="mt-5 space-y-2.5">
            {aktifSoru.secenekler.map((secenek) => {
              const secildi = standartSecim === secenek;
              const dogruMu = secenek === aktifSoru.dogruCevap;

              let stil = "bg-card border-border text-foreground hover:border-primary/50";
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
            className="mt-6 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition hover:brightness-110 active:scale-[0.98] animate-pop"
          >
            {standartIndex + 1 === standartSorular.length ? "Testi Bitir" : "Sonraki Soru"}
          </button>
        )}
      </div>
    );
  }

  // ============================================================
  // GÖRÜNÜM 3: TEST ANA LİSTESİ (ÖSYM EN TEPEDE)
  // ============================================================
  return (
    <div className="flex-1 flex flex-col gap-3 p-1 animate-rise max-w-xl mx-auto w-full">
      {/* 1. ÖZEL VIP: ÖSYM BANKO TESTİ (20 Soru) */}
      <button
        onClick={osymBaslat}
        className="group relative overflow-hidden rounded-2xl border border-osym/40 bg-gradient-to-br from-osym/20 via-card to-card p-4.5 text-left shadow-lg transition-all hover:border-osym/70 hover:shadow-osym/10 active:scale-[0.99]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-osym text-osym-foreground shadow-[0_0_20px_rgba(249,115,22,0.35)] transition-transform group-hover:scale-105">
              <Flame className="h-6 w-6" strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-serif text-base font-extrabold text-card-foreground">ÖSYM Sever (Banko 20)</p>
                <span className="rounded-full bg-osym/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-osym">
                  20 Soru
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Dönem sınırı yok! Çıkmış ve en çok sorulan banko eserlerle gerçek prova.
              </p>
              {osymEnIyiSkor > 0 && (
                <p className="mt-1 text-[10px] font-bold text-amber-500">
                  🏆 En İyi Skorun: {osymEnIyiSkor} / {OSYM_SORU_SAYISI}
                </p>
              )}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-osym transition-transform group-hover:translate-x-1" />
        </div>
      </button>

      {/* 2. DÖNEM TESTLERİ */}
      <div className="glass-card rounded-2xl p-4 ring-1 ring-border/80">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <p className="font-serif text-sm font-bold text-card-foreground">Dönem Testleri</p>
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground">15 Soru</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {anaDonemler.map((donem) => (
            <button
              key={donem}
              onClick={() => standartTestBaslat("donem", donem)}
              className="flex items-center justify-between rounded-xl bg-muted/40 p-2.5 text-xs font-semibold text-muted-foreground ring-1 ring-border/60 transition hover:bg-muted/70 hover:text-foreground active:scale-[0.98]"
            >
              <span className="truncate">{donem}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </button>
          ))}
        </div>
      </div>

      {/* 3. KADIN YAZARLAR TESTİ */}
      <button
        onClick={() => standartTestBaslat("kadin")}
        className="glass-card flex items-center justify-between rounded-2xl p-3.5 ring-1 ring-border/80 transition hover:border-pink-500/40 hover:bg-pink-500/5 active:scale-[0.99]"
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
            <p className="text-[11px] text-muted-foreground">Sadece kadın edebiyatçılarımızdan oluşan seçki</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* 4. DİĞER SEÇKİLER */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => standartTestBaslat("donem", "Tüm Dönemler")}
          className="glass-card flex items-center gap-2.5 rounded-2xl p-3 ring-1 ring-border/80 transition hover:bg-muted/50 active:scale-[0.99] text-left"
        >
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/15 text-amber-500">
            <Users className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-card-foreground truncate">Eser – Kahraman</p>
            <p className="text-[10px] text-muted-foreground">Banko eşleştirmeler</p>
          </div>
        </button>

        <button
          onClick={() => standartTestBaslat("donem", "Tüm Dönemler")}
          className="glass-card flex items-center gap-2.5 rounded-2xl p-3 ring-1 ring-border/80 transition hover:bg-muted/50 active:scale-[0.99] text-left"
        >
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-sky-500/15 text-sky-500">
            <Compass className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-card-foreground truncate">Edebi Akımlar</p>
            <p className="text-[10px] text-muted-foreground">Temsilciler & İlkeler</p>
          </div>
        </button>
      </div>
    </div>
  );
}
