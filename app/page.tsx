"use client";

import { useCallback, useState } from "react";
import { Brain, Flame, Info, Layers, Swords, Target, X } from "lucide-react";
import Flashcard, { TamamlamaEkrani } from "@/components/Flashcard";
import TestModul from "@/components/TestModul";
import OsymSeverModul from "@/components/OsymSeverModul";
import TemaAnahtari from "@/components/TemaAnahtari";
import RuhHaliModal, { type RuhHali } from "@/components/RuhHaliModal";
import { anaDonemFiltrele, anaDonemler, type AnaDonem } from "@/src/data";

const APP_NAME = "EdebiKart";
const APP_SUBTITLE = "YKS Yazar Eser";

type Mod = "kart" | "test" | "osym" | "duelo";

const modOeleri: { mod: Mod; etiket: string; ikon: typeof Layers }[] = [
  { mod: "kart", etiket: "Kartlar", ikon: Layers },
  { mod: "test", etiket: "Test", ikon: Brain },
  { mod: "osym", etiket: "ÖSYM", ikon: Flame },
  { mod: "duelo", etiket: "Düello", ikon: Swords },
];

function karistir<T>(dizi: T[]): T[] {
  const kopya = [...dizi];
  for (let i = kopya.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopya[i], kopya[j]] = [kopya[j], kopya[i]];
  }
  return kopya;
}

export default function App() {
  const [mod, setMod] = useState<Mod>("kart");
  const [infoAcik, setInfoAcik] = useState(false);
  const [ruhHali, setRuhHali] = useState<RuhHali | null>(null);

  const [seciliAnaDonem, setSeciliAnaDonem] = useState<AnaDonem>("Tüm Dönemler");
  const kartVerisi = anaDonemFiltrele(seciliAnaDonem);
  const [deste, setDeste] = useState<number[]>(() => karistir(kartVerisi.map((_, i) => i)));
  const [ogrenilenler, setOgrenilenler] = useState<Set<number>>(new Set());

  const bitti = deste.length === 0;

  const donemSec = useCallback((donem: AnaDonem) => {
    setSeciliAnaDonem(donem);
    const yeniVeri = anaDonemFiltrele(donem);
    setDeste(karistir(yeniVeri.map((_, i) => i)));
    setOgrenilenler(new Set());
  }, []);

  const sifirla = useCallback(() => {
    setDeste(karistir(kartVerisi.map((_, i) => i)));
    setOgrenilenler(new Set());
  }, []);

  const onOgrenildi = useCallback(() => {
    setDeste((onceki) => {
      if (onceki.length === 0) return onceki;
      const [ilk, ...geriKalan] = onceki;
      setOgrenilenler((s) => new Set(s).add(ilk));
      return geriKalan;
    });
  }, []);

  const onTekrar = useCallback(() => {
    setDeste((onceki) => {
      if (onceki.length <= 1) return onceki;
      const [ilk, ...geriKalan] = onceki;
      return [...geriKalan, ilk];
    });
  }, []);

  const onPrev = useCallback(() => {
    setDeste((onceki) => {
      if (onceki.length <= 1) return onceki;
      const son = onceki[onceki.length - 1];
      return [son, ...onceki.slice(0, -1)];
    });
  }, []);

  const onNext = useCallback(() => {
    setDeste((onceki) => {
      if (onceki.length <= 1) return onceki;
      const [ilk, ...geriKalan] = onceki;
      return [...geriKalan, ilk];
    });
  }, []);

  const aktifIndex = deste[0] ?? 0;
  const aktifItem = kartVerisi[aktifIndex];

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground font-sans flex flex-col">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, currentColor 1px, transparent 1px), radial-gradient(circle at 80% 70%, currentColor 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Header */}
      <header className="relative z-30 backdrop-blur-xl bg-background/75 border-b border-border shrink-0">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center shadow-md shrink-0">
              <Layers className="w-4.5 h-4.5 text-primary-foreground" strokeWidth={1.5} />
            </div>
            <div className="leading-tight">
              <h1 className="font-serif font-bold text-base tracking-tight">{APP_NAME}</h1>
              <p className="text-[10px] text-muted-foreground">{APP_SUBTITLE}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TemaAnahtari />
            <button
              onClick={() => setInfoAcik(true)}
              className="w-8 h-8 rounded-full bg-card shadow-sm flex items-center justify-center text-muted-foreground hover:text-primary transition shrink-0"
              aria-label="Bilgi"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mod seçici — 4'lü */}
        <div className="max-w-3xl mx-auto px-4 pb-2.5">
          <div className="grid grid-cols-4 gap-1 p-1 bg-muted rounded-2xl">
            {modOeleri.map(({ mod: m, etiket, ikon: Ikon }) => {
              const aktif = mod === m;
              const aktifRenk =
                m === "osym"
                  ? "text-orange-500"
                  : m === "duelo"
                    ? "text-rose-500"
                    : "text-primary";
              return (
                <button
                  key={m}
                  onClick={() => setMod(m)}
                  aria-current={aktif ? "page" : undefined}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition ${
                    aktif
                      ? `bg-card shadow-sm ${aktifRenk}`
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Ikon className="w-3.5 h-3.5" strokeWidth={aktif ? 2.4 : 1.8} />
                  {etiket}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* İçerik — kart modu no-scroll, diğer modlar gerektiğinde scroll */}
      <main className="relative flex-1 overflow-y-auto no-scrollbar max-w-3xl mx-auto w-full px-4 py-3 flex flex-col">
        {ruhHali && (
          <div className="mb-3 flex items-start gap-3 rounded-2xl bg-accent/60 p-3 shadow-sm animate-rise shrink-0">
            <span className="text-xl leading-none" aria-hidden="true">
              {ruhHali.emoji || "💬"}
            </span>
            <p className="flex-1 text-xs font-medium leading-relaxed text-pretty text-accent-foreground">
              {ruhHali.mesaj}
            </p>
            <button
              onClick={() => setRuhHali(null)}
              className="text-muted-foreground transition hover:text-foreground shrink-0"
              aria-label="Mesajı kapat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Kart modu dönem filtresi — yatay kaydırmalı */}
        {mod === "kart" && (
          <div className="mb-3 shrink-0">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
              {anaDonemler.map((donem) => {
                const aktif = seciliAnaDonem === donem;
                return (
                  <button
                    key={donem}
                    onClick={() => donemSec(donem)}
                    className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition shrink-0 ${
                      aktif
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {donem}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Kart içeriği — flex-1 ile ekranı doldur */}
        {mod === "kart" ? (
          bitti ? (
            <div className="flex-1 flex items-center justify-center">
              <TamamlamaEkrani toplam={kartVerisi.length} onSifirla={sifirla} />
            </div>
          ) : aktifItem ? (
            <Flashcard
              key={aktifItem.id}
              item={aktifItem}
              total={kartVerisi.length}
              ogrenilenSayi={ogrenilenler.size}
              onPrev={onPrev}
              onNext={onNext}
              onOgrenildi={onOgrenildi}
              onTekrar={onTekrar}
            />
          ) : null
        ) : mod === "test" ? (
          <TestModul />
        ) : mod === "osym" ? (
          <OsymSeverModul />
        ) : (
          <DueloModulu />
        )}
      </main>

      <RuhHaliModal onSecim={setRuhHali} />

      {infoAcik && (
        <div
          className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={() => setInfoAcik(false)}
        >
          <div
            className="bg-card rounded-[1.75rem] shadow-2xl max-w-md w-full p-7 animate-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-serif font-bold text-xl text-card-foreground">{APP_NAME}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{APP_SUBTITLE}</p>
              </div>
              <button
                onClick={() => setInfoAcik(false)}
                className="text-muted-foreground hover:text-foreground transition"
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              YKS/AYT edebiyat yazar-eser ezber uygulaması. 8 ana dönem, yüzlerce eser.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Kartlar:</span> Dönem seç, sağa kaydır = Öğrendim, sola
                kaydır = Tekrar Et.
              </p>
              <p>
                <span className="font-semibold text-foreground">Test:</span> Dönem seç, 4 şıklı soruları çöz. Çeldiriciler
                aynı dönemden gelir.
              </p>
              <p>
                <span className="font-semibold text-foreground">ÖSYM Sever:</span> Sadece banko eserlerden karışık mini
                deneme.
              </p>
              <p>
                <span className="font-semibold text-foreground">Düello:</span> Yakında gelecek!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DueloModulu() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="animate-rise rounded-[1.75rem] bg-card p-9 text-center shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)] max-w-sm">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-rose-500/15 text-rose-500 animate-pop">
          <Swords className="h-7 w-7" strokeWidth={1.5} />
        </div>
        <h2 className="font-serif text-xl font-bold tracking-tight text-card-foreground">Düello Modu</h2>
        <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
          Çok yakında! Arkadaşlarınla veya yapay zekaya karşı yarışacağın hızlı tahmin modu hazırlanıyor.
        </p>
      </div>
    </div>
  );
}
