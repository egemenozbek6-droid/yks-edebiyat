"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TriangleAlert as AlertTriangle, Brain, Flame, Info, Layers, Swords, Target, X } from "lucide-react";
import Flashcard, { TamamlamaEkrani } from "@/components/Flashcard";
import TestModul from "@/components/TestModul";
import OsymSeverModul from "@/components/OsymSeverModul";
import TemaAnahtari from "@/components/TemaAnahtari";
import RuhHaliModal, { type RuhHali } from "@/components/RuhHaliModal";
import DueloModulu from "@/components/DueloModulu";
import ProfilModal from "@/components/ProfilModal";
import { anaDonemFiltrele, anaDonemler, type AnaDonem } from "@/src/data";
import { useKartSeviyeleri } from "@/lib/useKartSeviyeleri";

const APP_NAME = "EdebiKart";
const APP_SUBTITLE = "YKS Yazar Eser";

type Mod = "kart" | "test" | "osym" | "duelo";

const modOeleri: { mod: Mod; etiket: string; ikon: typeof Layers; aktifKlass: string }[] = [
  { mod: "kart", etiket: "Kartlar", ikon: Layers, aktifKlass: "bg-primary/15 shadow-sm text-primary ring-1 ring-primary/30" },
  { mod: "test", etiket: "Test", ikon: Brain, aktifKlass: "bg-primary/15 shadow-sm text-primary ring-1 ring-primary/30" },
  { mod: "osym", etiket: "ÖSYM", ikon: Flame, aktifKlass: "bg-osym/15 shadow-sm text-osym ring-1 ring-osym/30" },
  { mod: "duelo", etiket: "Düello", ikon: Swords, aktifKlass: "bg-duello/15 shadow-sm text-duello ring-1 ring-duello/30" },
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
  const [profilAcik, setProfilAcik] = useState(false);

  // Navigation guard
  const [dueloAktif, setDueloAktif] = useState(false);
  const [cikisOnayAcik, setCikisOnayAcik] = useState(false);
  const [cikisMesaj, setCikisMesaj] = useState("");
  const cikisOnayCallback = useRef<(() => void) | null>(null);

  // Intro animasyonu: ruh hali modalı kapanana kadar bekle, sonra 1 kez çalış
  const [introAktif, setIntroAktif] = useState(false);
  const [modalKapandi, setModalKapandi] = useState(false);
  const introYapildi = useRef(false);

  useEffect(() => {
    if (modalKapandi && !introYapildi.current) {
      introYapildi.current = true;
      const t1 = window.setTimeout(() => {
        setIntroAktif(true);
        const t2 = window.setTimeout(() => setIntroAktif(false), 1900);
        return () => clearTimeout(t2);
      }, 200);
      return () => clearTimeout(t1);
    }
  }, [modalKapandi]);

  // beforeunload guard — düello aktifken pencere kapatmayı uyar
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dueloAktif) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dueloAktif]);

  const cikisOnayGerekir = useCallback((mesaj: string, onOnayla: () => void) => {
    setCikisMesaj(mesaj);
    cikisOnayCallback.current = onOnayla;
    setCikisOnayAcik(true);
  }, []);

  const cikisOnayla = useCallback(() => {
    setCikisOnayAcik(false);
    if (cikisOnayCallback.current) {
      cikisOnayCallback.current();
      cikisOnayCallback.current = null;
    }
  }, []);

  const cikisReddet = useCallback(() => {
    setCikisOnayAcik(false);
    cikisOnayCallback.current = null;
  }, []);

  // Navigation guard: düello aktifken mod değiştirmeyi engelle
  const modDegistir = useCallback(
    (yeniMod: Mod) => {
      if (dueloAktif && yeniMod !== "duelo") {
        cikisOnayGerekir(
          "Düellodan ayrılırsanız maçı kaybetmiş sayılacaksınız!",
          () => {
            setDueloAktif(false);
            setMod(yeniMod);
          },
        );
        return;
      }
      setMod(yeniMod);
    },
    [dueloAktif, cikisOnayGerekir],
  );

  const [seciliAnaDonem, setSeciliAnaDonem] = useState<AnaDonem>("Tüm Dönemler");
  const kartVerisi = anaDonemFiltrele(seciliAnaDonem);
  const [deste, setDeste] = useState<number[]>(() => karistir(kartVerisi.map((_, i) => i)));
  const [ogrenilenler, setOgrenilenler] = useState<Set<number>>(new Set());

  const { seviyeler, ogren, tekrar } = useKartSeviyeleri();

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
  }, [kartVerisi]);

  const onOgrenildi = useCallback(() => {
    setDeste((onceki) => {
      if (onceki.length === 0) return onceki;
      const [ilk, ...geriKalan] = onceki;
      setOgrenilenler((s) => new Set(s).add(ilk));
      ogren(ilk);
      return geriKalan;
    });
  }, [ogren]);

  const onTekrar = useCallback(() => {
    setDeste((onceki) => {
      if (onceki.length <= 1) return onceki;
      const [ilk, ...geriKalan] = onceki;
      tekrar(ilk);
      return [...geriKalan, ilk];
    });
  }, [tekrar]);

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
        className="fixed inset-0 pointer-events-none opacity-[0.04]"
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
            <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center shadow-md shrink-0 ring-1 ring-primary/30">
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
              className="w-8 h-8 rounded-full glass-card shadow-sm flex items-center justify-center text-muted-foreground hover:text-primary transition shrink-0 ring-1 ring-border"
              aria-label="Bilgi"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mod seçici — 4'lü */}
        <div className="max-w-3xl mx-auto px-4 pb-2.5">
          <div className="grid grid-cols-4 gap-1 p-1 glass-card rounded-2xl ring-1 ring-border">
            {modOeleri.map(({ mod: m, etiket, ikon: Ikon, aktifKlass }) => {
              const aktif = mod === m;
              return (
                <button
                  key={m}
                  onClick={() => modDegistir(m)}
                  aria-current={aktif ? "page" : undefined}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition ${
                    aktif
                      ? aktifKlass
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
          <div className="mb-3 flex items-start gap-3 rounded-2xl glass-card p-3 ring-1 ring-border animate-rise shrink-0">
            <span className="text-xl leading-none" aria-hidden="true">
              {ruhHali.emoji || "💬"}
            </span>
            <p className="flex-1 text-xs font-medium leading-relaxed text-pretty text-accent-foreground">
              {ruhHali.mesaj}
            </p>
            <button
              onClick={() => setRuhHali(null)}
              className="text-muted-foreground transition hover:text-primary shrink-0"
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
                        : "glass-card text-muted-foreground hover:text-foreground ring-1 ring-border"
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
              introAktif={introAktif}
            />
          ) : null
        ) : mod === "test" ? (
          <TestModul />
        ) : mod === "osym" ? (
          <OsymSeverModul />
        ) : (
          <DueloModulu
            onCikis={() => {
              setDueloAktif(false);
              setMod("kart");
            }}
            onDueloAktifDegisti={setDueloAktif}
            onProfilAc={() => setProfilAcik(true)}
            onCikisOnayGerekir={cikisOnayGerekir}
          />
        )}
      </main>

      <RuhHaliModal
        onSecim={(rh) => {
          setRuhHali(rh);
          window.setTimeout(() => setModalKapandi(true), 2800);
        }}
        onKapat={() => setModalKapandi(true)}
      />

      {/* Profil modalı */}
      {profilAcik && (
        <ProfilModal onKapat={() => setProfilAcik(false)} onGuncellendi={() => {}} />
      )}

      {/* Navigation guard onay modalı */}
      {cikisOnayAcik && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-5"
          onClick={cikisReddet}
        >
          <div
            className="glass-card rounded-[1.75rem] shadow-2xl max-w-sm w-full p-6 animate-pop ring-1 ring-destructive/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-destructive/15 text-destructive ring-1 ring-destructive/30">
              <AlertTriangle className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <p className="text-center text-sm font-semibold text-pretty text-card-foreground">
              {cikisMesaj}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={cikisReddet}
                className="rounded-2xl bg-muted/60 py-3 text-sm font-semibold text-muted-foreground transition hover:text-foreground active:scale-[0.98]"
              >
                İptal
              </button>
              <button
                onClick={cikisOnayla}
                className="rounded-2xl bg-destructive py-3 text-sm font-bold text-white shadow-md transition hover:brightness-110 active:scale-[0.98]"
              >
                Ayrıl
              </button>
            </div>
          </div>
        </div>
      )}

      {infoAcik && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-5"
          onClick={() => setInfoAcik(false)}
        >
          <div
            className="glass-card rounded-[1.75rem] shadow-2xl max-w-md w-full p-7 animate-pop ring-1 ring-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-serif font-bold text-xl text-card-foreground">{APP_NAME}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{APP_SUBTITLE}</p>
              </div>
              <button
                onClick={() => setInfoAcik(false)}
                className="text-muted-foreground hover:text-primary transition"
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
                <span className="font-semibold text-primary">Kartlar:</span> Dönem seç, sağa kaydır = Öğrendim, sola
                kaydır = Tekrar Et. Leitner sistemi ile kart seviyelerin takip edilir.
              </p>
              <p>
                <span className="font-semibold text-primary">Test:</span> Dönem seç, 4 şıklı soruları çöz. Çeldiriciler
                aynı dönemden gelir.
              </p>
              <p>
                <span className="font-semibold text-osym">ÖSYM Sever:</span> Sadece banko eserlerden karışık mini
                deneme.
              </p>
              <p>
                <span className="font-semibold text-duello">Düello:</span> Rakibinle 10 soruda yarış. Hız bonusu kazan!
                Senkron soru geçişi — rakibini bekle, sonra birlikte geçin.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
