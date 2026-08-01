"use client";

import { useCallback, useState } from "react";
import { Brain, Flame, Info, Layers, Target, X } from "lucide-react";
import Flashcard, { TamamlamaEkrani } from "@/components/Flashcard";
import TestModul from "@/components/TestModul";
import OsymSeverModul from "@/components/OsymSeverModul";
import TemaAnahtari from "@/components/TemaAnahtari";
import RuhHaliModal, { type RuhHali } from "@/components/RuhHaliModal";
import { gecerliYazarlar, anaDonemFiltrele, anaDonemler, type AnaDonem } from "@/src/data";

const APP_NAME = "EdebiKart";
const APP_SUBTITLE = "YKS Yazar Eser";
const MOTTO = "EZBERLEME, NOKTA ATIŞI YAP!";

type Mod = "kart" | "test" | "osym";

const modOeleri: { mod: Mod; etiket: string; ikon: typeof Layers }[] = [
  { mod: "kart", etiket: "Kartlar", ikon: Layers },
  { mod: "test", etiket: "Test", ikon: Brain },
  { mod: "osym", etiket: "ÖSYM Sever", ikon: Flame },
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

  // Kart destesi — varsayılan tüm dönemler, karışık
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
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, currentColor 1px, transparent 1px), radial-gradient(circle at 80% 70%, currentColor 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Header */}
      <header className="relative sticky top-0 z-30 backdrop-blur-xl bg-background/75 border-b border-border">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-md">
              <Layers className="w-5 h-5 text-primary-foreground" strokeWidth={1.5} />
            </div>
            <div className="leading-tight">
              <h1 className="font-serif font-bold text-lg tracking-tight">{APP_NAME}</h1>
              <p className="text-[11px] text-muted-foreground">{APP_SUBTITLE}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <TemaAnahtari />
            <button
              onClick={() => setInfoAcik(true)}
              className="w-9 h-9 rounded-full bg-card shadow-sm flex items-center justify-center text-muted-foreground hover:text-primary transition"
              aria-label="Bilgi"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Motto */}
        <div className="max-w-3xl mx-auto px-5 pb-2">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-primary/80">
            {MOTTO} <span className="text-base">🎯</span>
          </p>
        </div>

        {/* Mod seçici — her zaman görünür */}
        <div className="max-w-3xl mx-auto px-5 pb-3">
          <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-muted rounded-2xl">
            {modOeleri.map(({ mod: m, etiket, ikon: Ikon }) => {
              const aktif = mod === m;
              const aktifRenk = m === "osym" ? "text-orange-500" : "text-primary";
              return (
                <button
                  key={m}
                  onClick={() => setMod(m)}
                  aria-current={aktif ? "page" : undefined}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition ${
                    aktif
                      ? `bg-card shadow-sm ${aktifRenk}`
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Ikon className="w-4 h-4" strokeWidth={aktif ? 2.4 : 1.8} />
                  {etiket}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* İçerik */}
      <main className="relative max-w-3xl mx-auto px-5 py-8">
        {ruhHali && (
          <div className="mb-6 flex items-start gap-3 rounded-3xl bg-accent/60 p-4 shadow-sm animate-rise">
            <span className="text-2xl leading-none" aria-hidden="true">
              {ruhHali.emoji || "💬"}
            </span>
            <p className="flex-1 text-sm font-medium leading-relaxed text-pretty text-accent-foreground">
              {ruhHali.mesaj}
            </p>
            <button
              onClick={() => setRuhHali(null)}
              className="text-muted-foreground transition hover:text-foreground"
              aria-label="Mesajı kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Kart modu dönem filtresi */}
        {mod === "kart" && (
          <div className="mb-6 flex flex-wrap gap-2">
            {anaDonemler.map((donem) => {
              const aktif = seciliAnaDonem === donem;
              return (
                <button
                  key={donem}
                  onClick={() => donemSec(donem)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
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
        )}

        {mod === "kart" ? (
          bitti ? (
            <TamamlamaEkrani toplam={kartVerisi.length} onSifirla={sifirla} />
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
        ) : (
          <OsymSeverModul />
        )}
      </main>

      {/* Ruh hali pop-up'ı */}
      <RuhHaliModal onSecim={setRuhHali} />

      {/* Bilgi modalı */}
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
            <p className="font-serif text-base text-primary font-semibold mb-1">{MOTTO} 🎯</p>
            <p className="text-sm text-muted-foreground mb-4">
              YKS/AYT edebiyat yazar-eser ezber uygulaması. 7 ana dönem, yüzlerce eser.
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
                <span className="font-semibold text-foreground">ÖSYM Sever 🔥:</span> Sadece banko eserlerden karışık
                mini deneme.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
