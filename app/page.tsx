"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TriangleAlert as AlertTriangle,
  Layers,
  NotebookPen,
  Flame,
  Swords,
  Info,
  X,
  ChevronDown,
  Volume2,
  VolumeX,
} from "lucide-react";
import Flashcard, { TamamlamaEkrani } from "@/components/Flashcard";
import TestModul from "@/components/TestModul";
import OsymSeverModul from "@/components/OsymSeverModul";
import RuhHaliModal, { type RuhHali } from "@/components/RuhHaliModal";
import DueloModulu from "@/components/DueloModulu";
import ProfilModal from "@/components/ProfilModal";
import SplashEkran from "@/components/SplashEkran";
import { anaDonemFiltrele, anaDonemler, type AnaDonem, type LiteratureItem } from "@/src/data";
import kadinYazarlarData from "@/src/data/kadin_yazarlar_test.json";
import { kartTekrarGerekiyorMu, kartHafizaGetir } from "@/lib/leitner";
import { useKartSeviyeleri } from "@/lib/useKartSeviyeleri";
import { sfxMuted, sfxMuteToggle } from "@/lib/sfx";

const APP_NAME = "EdebiKart";
const APP_SUBTITLE = "YKS Yazar Eser & Düello";

type Mod = "kart" | "test" | "osym" | "duelo";
type KategoriTuru = AnaDonem | "Tekrar Gerekenler" | "Kadın Yazarlar";

const modOeleri: { mod: Mod; etiket: string; ikon: typeof Layers; aktifKlass: string }[] = [
  { mod: "kart", etiket: "Kartlar", ikon: Layers, aktifKlass: "bg-primary text-primary-foreground shadow-sm" },
  { mod: "test", etiket: "Test", ikon: NotebookPen, aktifKlass: "bg-violet-600 text-white shadow-sm" },
  { mod: "osym", etiket: "ÖSYM", ikon: Flame, aktifKlass: "bg-osym text-osym-foreground shadow-sm" },
  { mod: "duelo", etiket: "Düello", ikon: Swords, aktifKlass: "bg-duello text-duello-foreground shadow-sm" },
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
  const [sfxSesli, setSfxSesli] = useState(!sfxMuted());

  // Navigation guard
  const [dueloAktif, setDueloAktif] = useState(false);
  const [cikisOnayAcik, setCikisOnayAcik] = useState(false);
  const [cikisMesaj, setCikisMesaj] = useState("");
  const cikisOnayCallback = useRef<(() => void) | null>(null);

  const [splashAktif, setSplashAktif] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setSplashAktif(false), 1500);
    return () => clearTimeout(t);
  }, []);

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

  // Kategori & Deste Yönetimi
  const [seciliKategori, setSeciliKategori] = useState<KategoriTuru>("Tüm Dönemler");

  // Deste verisini belirleme (Özel seçkiler dahil)
  const kartVerisi = useMemo(() => {
    if (seciliKategori === "Kadın Yazarlar") {
      return kadinYazarlarData as unknown as LiteratureItem[];
    }
    if (seciliKategori === "Tekrar Gerekenler") {
      const tumu = anaDonemFiltrele("Tüm Dönemler");
      const tekrarlar = tumu.filter((item) => {
        const hafiza = kartHafizaGetir(String(item.id));
        return hafiza.kutu === 1 || kartTekrarGerekiyorMu(String(item.id));
      });
      return tekrarlar.length > 0 ? tekrarlar : tumu;
    }
    return anaDonemFiltrele(seciliKategori as AnaDonem);
  }, [seciliKategori]);

  const [deste, setDeste] = useState<number[]>(() => karistir(kartVerisi.map((_, i) => i)));
  const [ogrenilenler, setOgrenilenler] = useState<Set<number>>(new Set());

  const { seviyeler, ogren, tekrar } = useKartSeviyeleri();
  const bitti = deste.length === 0;

  const kategoriSec = useCallback((yeniKategori: KategoriTuru) => {
    setSeciliKategori(yeniKategori);
    let liste: LiteratureItem[] = [];
    if (yeniKategori === "Kadın Yazarlar") {
      liste = kadinYazarlarData as unknown as LiteratureItem[];
    } else if (yeniKategori === "Tekrar Gerekenler") {
      const tumu = anaDonemFiltrele("Tüm Dönemler");
      const tekrarlar = tumu.filter((item) => {
        const hafiza = kartHafizaGetir(String(item.id));
        return hafiza.kutu === 1 || kartTekrarGerekiyorMu(String(item.id));
      });
      liste = tekrarlar.length > 0 ? tekrarlar : tumu;
    } else {
      liste = anaDonemFiltrele(yeniKategori as AnaDonem);
    }
    setDeste(karistir(liste.map((_, i) => i)));
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
      {splashAktif && <SplashEkran />}
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
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-md shrink-0 ring-1 ring-primary/30">
              <Layers className="w-4.5 h-4.5 text-primary-foreground" strokeWidth={1.5} />
            </div>
            <div className="leading-tight">
              <h1 className="font-serif font-bold text-base tracking-tight">{APP_NAME}</h1>
              <p className="text-[10px] text-muted-foreground">{APP_SUBTITLE}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSfxSesli(!sfxMuteToggle())}
              className="w-8 h-8 rounded-full glass-card shadow-sm flex items-center justify-center text-muted-foreground hover:text-primary transition shrink-0 ring-1 ring-border"
              aria-label={sfxSesli ? "Sesi kapat" : "Sesi aç"}
            >
              {sfxSesli ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setInfoAcik(true)}
              className="w-8 h-8 rounded-full glass-card shadow-sm flex items-center justify-center text-muted-foreground hover:text-primary transition shrink-0 ring-1 ring-border"
              aria-label="Bilgi"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mod seçici — 4'lü Bar */}
        <div className="max-w-3xl mx-auto px-4 pb-2.5">
          <div className="grid grid-cols-4 gap-1 p-1 bg-card border border-border rounded-xl">
            {modOeleri.map(({ mod: m, etiket, ikon: Ikon, aktifKlass }) => {
              const aktif = mod === m;
              return (
                <button
                  key={m}
                  onClick={() => modDegistir(m)}
                  aria-current={aktif ? "page" : undefined}
                  className={`flex flex-col items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-semibold transition ${
                    aktif ? aktifKlass : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <Ikon className="h-4 w-4" strokeWidth={aktif ? 2.4 : 1.8} />
                  {etiket}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Ana İçerik */}
      <main className="relative flex-1 overflow-y-auto no-scrollbar max-w-3xl mx-auto w-full px-4 py-2.5 flex flex-col">
        {ruhHali && (
          <div className="mb-2.5 flex items-start gap-3 rounded-xl glass-card p-3 ring-1 ring-border animate-rise shrink-0">
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

        {/* Kart Modu Tek Satırlık Kompakt Kontrol Barı (Dönem & Özel Seçkiler) */}
        {mod === "kart" && (
          <div className="mb-3 shrink-0 flex items-center justify-between gap-2.5 rounded-2xl bg-card border border-border p-2.5 shadow-sm">
            {/* Kategori Dropdown */}
            <div className="relative flex-1 min-w-0">
              <select
                value={seciliKategori}
                onChange={(e) => kategoriSec(e.target.value as KategoriTuru)}
                className="w-full appearance-none rounded-xl bg-muted/50 border border-border/80 px-3 py-2 pr-8 text-xs font-bold text-foreground outline-none transition focus:border-primary/50"
              >
                <optgroup label="Akıllı Tekrar & Özel Deste">
                  <option value="Tekrar Gerekenler">🔥 Tekrar Etmen Gerekenler</option>
                  <option value="Kadın Yazarlar">🌸 Kadın Yazarlar Özel Deste</option>
                </optgroup>
                <optgroup label="Edebi Dönemler">
                  {anaDonemler.map((donem) => (
                    <option key={donem} value={donem}>
                      {donem}
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            </div>

            {/* İlerleme Kapsülü */}
            <div className="shrink-0 flex items-center gap-2 rounded-xl bg-muted/40 border border-border/60 px-3 py-1.5">
              <div className="flex flex-col text-right">
                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">İlerleme</span>
                <span className="text-xs font-extrabold text-primary tabular-nums">
                  {ogrenilenler.size} / {kartVerisi.length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Mod Panelleri */}
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
          <div className="flex flex-1 min-h-0 flex-col">
            <TestModul />
          </div>
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
        onModSec={(hedefMod) => modDegistir(hedefMod)}
      />

      {/* Profil Modalı */}
      {profilAcik && (
        <ProfilModal onKapat={() => setProfilAcik(false)} onGuncellendi={() => {}} />
      )}

      {/* Navigation Guard Onay Modalı */}
      {cikisOnayAcik && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={cikisReddet}
        >
          <div
            className="glass-card rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-pop ring-1 ring-destructive/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-destructive/15 text-destructive ring-1 ring-destructive/30">
              <AlertTriangle className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <p className="text-center text-sm font-semibold text-pretty text-card-foreground">
              {cikisMesaj}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                onClick={cikisReddet}
                className="rounded-xl bg-muted/60 py-3 text-sm font-semibold text-muted-foreground transition hover:text-foreground active:scale-[0.98]"
              >
                İptal
              </button>
              <button
                onClick={cikisOnayla}
                className="rounded-xl bg-destructive py-3 text-sm font-bold text-white shadow-md transition hover:brightness-110 active:scale-[0.98]"
              >
                Ayrıl
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modalı */}
      {infoAcik && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={() => setInfoAcik(false)}
        >
          <div
            className="glass-card rounded-2xl shadow-2xl max-w-md w-full p-6 animate-pop ring-1 ring-border max-h-[90vh] overflow-y-auto no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="font-serif font-bold text-lg text-card-foreground">
                  Edebikart Nasıl Kullanılır?
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  YKS/AYT edebiyat yazar-eser ezber & düello uygulaması
                </p>
              </div>
              <button
                onClick={() => setInfoAcik(false)}
                className="text-muted-foreground hover:text-primary transition shrink-0"
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-start gap-3 rounded-xl bg-slate-500/5 p-3.5 ring-1 ring-slate-500/15">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
                  <Layers className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-card-foreground">Kartlar</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Dönem seç, kartları sağa/sola kaydırarak ezberle. Leitner akıllı tekrar sistemiyle öğren.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-slate-500/5 p-3.5 ring-1 ring-slate-500/15">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-500 ring-1 ring-violet-500/20">
                  <NotebookPen className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-card-foreground">Test</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Dönemlere özel 4 şıklı sorularla kendini sına.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-slate-500/5 p-3.5 ring-1 ring-slate-500/15">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-osym/15 text-osym ring-1 ring-osym/20">
                  <Flame className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-card-foreground">ÖSYM Sever</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    YKS'de çıkma ihtimali en yüksek banko eserlerden oluşan özel denemeler.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-slate-500/5 p-3.5 ring-1 ring-slate-500/15">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-duello/15 text-duello ring-1 ring-duello/20">
                  <Swords className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-card-foreground">Düello & Rank</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Canlı rakiplerle yarış, EP kazan ve Günlük Görevleri tamamlayarak lig atla!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
