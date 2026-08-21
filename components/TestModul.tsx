"use client";

import { useCallback, useState } from "react";
import { ArrowRight, Brain, Check, Flame, RotateCcw, Target, X } from "lucide-react";
import IlerlemeBari from "@/components/IlerlemeBari";
import { anaDonemler, anaDonemFiltrele, type AnaDonem } from "@/src/data";
import { sorulariUret, type Soru } from "@/lib/soru";
import { sfxCorrect, sfxWrong } from "@/lib/sfx";

type Props = {
  onSonuc?: (dogruMu: boolean, donem: string) => void;
};

export default function TestModul({ onSonuc }: Props) {
  const [secilenDonem, setSecilenDonem] = useState<AnaDonem | null>(null);
  const [sorular, setSorular] = useState<Soru[]>([]);
  const [aktif, setAktif] = useState(0);
  const [secim, setSecim] = useState<string | null>(null);
  const [dogruSayi, setDogruSayi] = useState(0);
  const [bitti, setBitti] = useState(false);

  const basla = useCallback((donem: AnaDonem) => {
    const havuz = anaDonemFiltrele(donem);
    setSecilenDonem(donem);
    setSorular(sorulariUret(havuz));
    setAktif(0);
    setSecim(null);
    setDogruSayi(0);
    setBitti(false);
  }, []);

  const cevapla = (secenek: string) => {
    if (secim) return;
    const soru = sorular[aktif];
    const dogruMu = secenek === soru.dogru;
    if (dogruMu) sfxCorrect(); else sfxWrong();
    setSecim(secenek);
    if (dogruMu) setDogruSayi((s) => s + 1);
    onSonuc?.(dogruMu, soru.donem);
  };

  const sonraki = () => {
    if (aktif + 1 >= sorular.length) {
      setBitti(true);
      return;
    }
    setAktif((a) => a + 1);
    setSecim(null);
  };

  // Dönem seçim ekranı
  if (!secilenDonem || sorular.length === 0) {
    return (
      <div className="animate-rise">
        <div className="mb-6 rounded-[1.75rem] bg-card p-7 text-center shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)]">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Brain className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-xl font-bold tracking-tight text-balance text-card-foreground">Bir dönem seç</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-pretty text-muted-foreground">
            Seçtiğin dönemdeki tüm eserlerden soru gelir. Soru sayısı dönemdeki eser sayısına göre dinamiktir.
          </p>
        </div>

        <div className="space-y-2.5">
          {anaDonemler.map((donem, i) => {
            const tumMu = donem === "Tüm Dönemler";
            return (
              <button
                key={donem}
                onClick={() => basla(donem)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition active:scale-[0.99] ${
                  tumMu
                    ? "bg-primary text-primary-foreground shadow-md hover:brightness-110"
                    : "bg-card text-card-foreground shadow-sm hover:shadow-md"
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

  // Sonuç ekranı
  if (bitti) {
    const oran = Math.round((dogruSayi / sorular.length) * 100);
    return (
      <div className="animate-rise rounded-[1.75rem] bg-card p-9 text-center shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)]">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-primary/10 text-primary animate-pop">
          <Target className="h-9 w-9" strokeWidth={1.5} />
        </div>
        <h2 className="font-serif text-2xl font-bold tracking-tight text-card-foreground">Test bitti</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {sorular.length} soruda <span className="font-bold text-primary">{dogruSayi}</span> doğru — %{oran}
        </p>
        <div className="mt-6">
          <IlerlemeBari mevcut={dogruSayi} toplam={sorular.length} etiket="Doğru cevap" />
        </div>
        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            onClick={() => basla(secilenDonem)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4" /> Tekrar Çöz
          </button>
          <button
            onClick={() => {
              setSecilenDonem(null);
              setSorular([]);
            }}
            className="rounded-2xl bg-card py-3.5 text-sm font-semibold text-muted-foreground shadow-sm transition hover:text-foreground active:scale-[0.98]"
          >
            Dönem Değiştir
          </button>
        </div>
      </div>
    );
  }

  // Soru ekranı
  const soru = sorular[aktif];

  return (
    <div className="animate-rise">
      <div className="mb-6 rounded-3xl bg-card/70 p-4 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] backdrop-blur">
        <IlerlemeBari
          mevcut={aktif + (secim ? 1 : 0)}
          toplam={sorular.length}
          etiket="Soru"
          sagEtiket={`${aktif + 1} / ${sorular.length} · ${dogruSayi} doğru`}
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground">{soru.donem}</span>
          <button
            onClick={() => {
              setSecilenDonem(null);
              setSorular([]);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-[11px] font-semibold text-muted-foreground ring-1 ring-border transition hover:text-foreground hover:ring-primary/30 active:scale-95"
          >
            <RotateCcw className="h-3 w-3" /> Dönemi değiştir
          </button>
        </div>
      </div>

      <div className="rounded-[1.75rem] bg-card p-7 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)]">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {soru.tip === "eser" ? "Yazarın eseri" : "Eserin yazarı"}
          </p>
          {soru.osymFreq && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-[10px] font-bold text-orange-600 dark:text-orange-400">
              <Flame className="h-3 w-3" strokeWidth={2} />
              {soru.osymFreq}
            </span>
          )}
        </div>
        <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight leading-snug text-balance text-card-foreground">
          {soru.vurgu}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{soru.metin}</p>

        <div className="mt-6 space-y-2.5">
          {soru.secenekler.map((secenek, i) => {
            const secildi = secim === secenek;
            const dogruSecenek = secenek === soru.dogru;
            const gosterDogru = secim !== null && dogruSecenek;
            const gosterYanlis = secildi && !dogruSecenek;

            let stil =
              "bg-card text-card-foreground hover:bg-muted/60";
            if (gosterDogru) stil = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
            else if (gosterYanlis) stil = "bg-destructive/15 text-destructive";
            else if (secim !== null) stil = "bg-card text-muted-foreground opacity-60";

            return (
              <button
                key={secenek}
                onClick={() => cevapla(secenek)}
                disabled={secim !== null}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-sm font-semibold transition-all duration-200 ${stil} ${
                  gosterYanlis ? "animate-shake" : ""
                } ${gosterDogru ? "animate-pop" : ""} ${secim === null ? "active:scale-[0.99]" : ""}`}
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
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

        {secim !== null && (
          <button
            onClick={sonraki}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:brightness-110 active:scale-[0.98] animate-rise"
          >
            {aktif + 1 >= sorular.length ? "Sonucu Gör" : "Sonraki Soru"}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
