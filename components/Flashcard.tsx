"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  RotateCcw,
  Trophy,
  Undo2,
  ArrowLeftRight,
  Sparkles,
} from "lucide-react";
import type { LiteratureItem } from "@/src/data";
import {
  kartHafizaGetir,
  kartOgrenildiKaydet,
  kartTekrarKaydet,
  kutuRozetBilgisi,
  type KartHafiza,
} from "@/lib/leitner";

type Props = {
  item: LiteratureItem;
  total: number;
  ogrenilenSayi: number;
  introAktif: boolean;
  onPrev: () => void;
  onNext: () => void;
  onOgrenildi: () => void;
  onTekrar: () => void;
};

const ESIK = 110;

export default function Flashcard({
  item,
  total,
  ogrenilenSayi,
  introAktif,
  onPrev,
  onNext,
  onOgrenildi,
  onTekrar,
}: Props) {
  const [cevrildi, setCevrildi] = useState(false);
  const [dx, setDx] = useState(0);
  const [surukleniyor, setSurukleniyor] = useState(false);
  const [ucus, setUcus] = useState<"sag" | "sol" | null>(null);
  const [hafiza, setHafiza] = useState<KartHafiza>({
    kutu: 1,
    sonTekrar: 0,
    tekrarSayisi: 0,
  });
  const hareket = useRef(0);
  const baslangic = useRef(0);

  const intro = introAktif;

  useEffect(() => {
    setCevrildi(false);
    setDx(0);
    setUcus(null);
    setHafiza(kartHafizaGetir(String(item.id)));
  }, [item.id]);

  const tamamla = useCallback(
    (yon: "sag" | "sol") => {
      setUcus(yon);
      setSurukleniyor(false);
      setDx(yon === "sag" ? 520 : -520);

      if (yon === "sag") {
        const yeni = kartOgrenildiKaydet(String(item.id));
        setHafiza(yeni);
      } else {
        const yeni = kartTekrarKaydet(String(item.id));
        setHafiza(yeni);
      }

      window.setTimeout(() => {
        if (yon === "sag") onOgrenildi();
        else onTekrar();
      }, 320);
    },
    [item.id, onOgrenildi, onTekrar],
  );

  const basla = (e: React.PointerEvent) => {
    if (ucus || intro) return;
    baslangic.current = e.clientX;
    hareket.current = 0;
    setSurukleniyor(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const suruklu = (e: React.PointerEvent) => {
    if (!surukleniyor || ucus || intro) return;
    const fark = e.clientX - baslangic.current;
    hareket.current = Math.max(hareket.current, Math.abs(fark));
    setDx(fark);
  };

  const bitir = () => {
    if (!surukleniyor || ucus || intro) return;
    setSurukleniyor(false);
    if (dx > ESIK) tamamla("sag");
    else if (dx < -ESIK) tamamla("sol");
    else setDx(0);
  };

  const tikla = () => {
    if (hareket.current > 8 || ucus || intro) return;
    setCevrildi((v) => !v);
  };

  const osymFreqHam = item.osym_stats?.osym_freq;
  const osymFreq = osymFreqHam?.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim();

  const donus = Math.max(-12, Math.min(12, dx / 14));
  const sagOran = Math.min(1, Math.max(0, dx / ESIK));
  const solOran = Math.min(1, Math.max(0, -dx / ESIK));

  const rozet = kutuRozetBilgisi(hafiza.kutu);

  return (
    <div className="flex flex-col flex-1 min-h-0 animate-rise max-w-xl mx-auto w-full">
      {/* Kart alanı */}
      <div className="relative select-none flex-1 min-h-0 flex items-center" style={{ perspective: "1600px" }}>
        <div className="absolute inset-x-4 top-3 h-full rounded-3xl bg-card/40 border border-border/40" aria-hidden="true" />
        <div className="absolute inset-x-2 top-1.5 h-full rounded-3xl bg-card/60 border border-border/60" aria-hidden="true" />

        <div
          onPointerDown={basla}
          onPointerMove={suruklu}
          onPointerUp={bitir}
          onPointerCancel={bitir}
          onClick={tikla}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setCevrildi((v) => !v);
            }
          }}
          aria-label={cevrildi ? `Cevap: ${item.author}, ${item.period}.` : `Eser: ${item.work}.`}
          className={`relative w-full h-full cursor-pointer ${intro ? "animate-card-intro" : ""} ${
            surukleniyor && !intro ? "" : "transition-all duration-300 ease-out"
          }`}
          style={{
            transform: intro ? undefined : `translateX(${dx}px) rotate(${donus}deg)`,
            opacity: ucus ? 0 : 1,
            transitionProperty: surukleniyor || intro ? "none" : "transform, opacity",
            touchAction: "pan-y",
          }}
        >
          <div
            className="relative h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              transformStyle: "preserve-3d",
              transform: cevrildi ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* ÖN YÜZ */}
            <div
              className="absolute inset-0 overflow-hidden rounded-3xl border border-border bg-card shadow-xl"
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
            >
              <div className="absolute inset-y-0 left-0 w-1.5 bg-primary" aria-hidden="true" />

              <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
                {/* Üst Rozet Satırı */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/20">
                      <BookOpen className="h-3.5 w-3.5" strokeWidth={2} />
                      Eser
                    </span>
                    {/* Leitner Seviye Rozeti */}
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${rozet.bg} ${rozet.renk}`}>
                      <Sparkles className="h-3 w-3" />
                      {rozet.etiket}
                    </span>
                  </div>

                  {osymFreq && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-osym/15 px-2.5 py-1 text-[11px] font-bold text-osym ring-1 ring-osym/30">
                      <Flame className="h-3.5 w-3.5" strokeWidth={2.5} />
                      {osymFreq}
                    </span>
                  )}
                </div>

                {/* Orta Başlık */}
                <div className="flex flex-col items-center justify-center text-center px-2 py-4">
                  <h2 className="font-serif text-3xl font-extrabold tracking-tight leading-tight text-balance text-card-foreground sm:text-4xl">
                    {item.work}
                  </h2>
                  <span className="mt-3 rounded-full bg-muted/60 px-3 py-1 text-xs font-semibold text-muted-foreground ring-1 ring-border">
                    {item.genre}
                  </span>
                </div>

                {/* Alt Çevirme İpucu */}
                <div className="flex items-center justify-center text-center text-xs text-muted-foreground/70 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <ArrowLeftRight className="h-3.5 w-3.5" /> Yazarı görmek için dokun
                  </span>
                </div>
              </div>
            </div>

            {/* ARKA YÜZ */}
            <div
              className="absolute inset-0 overflow-hidden rounded-3xl border border-border bg-card shadow-xl"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="absolute inset-y-0 left-0 w-1.5 bg-emerald-500" aria-hidden="true" />

              <div className="relative flex h-full flex-col justify-between p-5 sm:p-6">
                {/* Üst Dönem Rozeti */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-500 ring-1 ring-emerald-500/25">
                    {item.period}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {item.genre}
                  </span>
                </div>

                {/* Orta: Yazar */}
                <div className="flex flex-col items-center justify-center text-center px-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Yazar
                  </p>
                  <h2 className="mt-1 font-serif text-3xl font-extrabold leading-tight text-balance text-card-foreground sm:text-4xl">
                    {item.author}
                  </h2>

                  {/* Bilgi Kutusu */}
                  {item.info && (
                    <div className="mt-4 w-full rounded-2xl border border-border bg-muted/40 p-3.5 text-left">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">
                        Eser Özeti & Bilgi
                      </p>
                      <p className="text-xs leading-relaxed text-pretty text-muted-foreground">
                        {item.info}
                      </p>
                    </div>
                  )}
                </div>

                {/* Alt Çevirme İpucu */}
                <div className="flex items-center justify-center text-center text-xs text-muted-foreground/70 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <ArrowLeftRight className="h-3.5 w-3.5" /> Eseri görmek için dokun
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Swipe Göstergeleri */}
          <div
            className="pointer-events-none absolute right-6 top-6 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500 text-white shadow-lg"
            style={{ opacity: sagOran, transform: `scale(${0.6 + sagOran * 0.4})` }}
            aria-hidden="true"
          >
            <Check className="h-7 w-7" strokeWidth={3} />
          </div>
          <div
            className="pointer-events-none absolute left-6 top-6 grid h-14 w-14 place-items-center rounded-2xl bg-destructive text-white shadow-lg"
            style={{ opacity: solOran, transform: `scale(${0.6 + solOran * 0.4})` }}
            aria-hidden="true"
          >
            <Undo2 className="h-7 w-7" strokeWidth={3} />
          </div>
        </div>
      </div>

      {/* Alt Aksiyon Butonları (Kutu Bildirimli) */}
      <div className="mt-4 grid grid-cols-2 gap-3 shrink-0">
        <button
          onClick={() => tamamla("sol")}
          className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-sm font-bold text-muted-foreground shadow-sm transition hover:bg-muted/70 hover:text-foreground active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4 text-destructive" /> Tekrar Et (Kutu 1)
        </button>
        <button
          onClick={() => tamamla("sag")}
          className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
        >
          <Check className="h-4 w-4" /> Kaptım (+1 Kutu)
        </button>
      </div>

      {/* Alt Gezinme Okları */}
      <div className="mt-2.5 flex items-center justify-between shrink-0 px-1">
        <button
          onClick={onPrev}
          className="flex items-center gap-1 rounded-xl p-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Önceki kart"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => setCevrildi((v) => !v)}
          className="rounded-xl px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/10"
        >
          {cevrildi ? "Ön Yüzü Gör" : "Arka Yüzü Gör"}
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-1 rounded-xl p-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Sonraki kart"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export function TamamlamaEkrani({ toplam, onSifirla }: { toplam: number; onSifirla: () => void }) {
  return (
    <div className="animate-rise rounded-3xl border border-border bg-card p-8 text-center shadow-xl max-w-sm mx-auto">
      <div className="mx-auto mb-5 grid h-18 w-18 place-items-center rounded-2xl bg-primary/10 text-primary animate-pop ring-1 ring-primary/25">
        <Trophy className="h-8 w-8" strokeWidth={1.75} />
      </div>
      <h2 className="font-serif text-2xl font-bold tracking-tight text-card-foreground">
        Desteyi Bitirdin! 🎉
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
        Seçtiğin dönemdeki kartları başarıyla tamamladın. Kutu durumların kaydedildi!
      </p>
      <button
        onClick={onSifirla}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
      >
        <RotateCcw className="h-4 w-4" /> Baştan Tekrar Et
      </button>
    </div>
  );
}
