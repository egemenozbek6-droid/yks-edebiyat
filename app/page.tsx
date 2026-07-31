"use client"

import { useCallback, useMemo, useState } from "react"
import { Brain, Info, Layers, X } from "lucide-react"
import Flashcard, { TamamlamaEkrani } from "@/components/Flashcard"
import TestModul from "@/components/TestModul"
import IstatistikModul, { type TestSayaci } from "@/components/IstatistikModul"
import AltMenu, { type Mod } from "@/components/AltMenu"
import TemaAnahtari from "@/components/TemaAnahtari"
import RuhHaliModal, { type RuhHali } from "@/components/RuhHaliModal"
import { yazarlar, baslik, amac, notu, type Donem } from "@/data/yazarlar"

function karistir<T>(dizi: T[]): T[] {
  const kopya = [...dizi]
  for (let i = kopya.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[kopya[i], kopya[j]] = [kopya[j], kopya[i]]
  }
  return kopya
}

export default function App() {
  const [mod, setMod] = useState<Mod>("kart")
  const [infoAcik, setInfoAcik] = useState(false)

  const [ruhHali, setRuhHali] = useState<RuhHali | null>(null)

  // Kart destesi — her yüklendiğinde karışık gelir
  const [deste, setDeste] = useState<number[]>(() => karistir(yazarlar.map((_, i) => i)))
  const [ogrenilenler, setOgrenilenler] = useState<Set<number>>(new Set())

  const [testSayaci, setTestSayaci] = useState<TestSayaci>({ dogru: 0, yanlis: 0 })
  const [donemSayaci, setDonemSayaci] = useState<Record<string, TestSayaci>>({})

  const bitti = deste.length === 0

  const sifirla = useCallback(() => {
    setDeste(karistir(yazarlar.map((_, i) => i)))
    setOgrenilenler(new Set())
  }, [])

  const istatistikSifirla = useCallback(() => {
    setDeste(karistir(yazarlar.map((_, i) => i)))
    setOgrenilenler(new Set())
    setTestSayaci({ dogru: 0, yanlis: 0 })
    setDonemSayaci({})
  }, [])

  const onOgrenildi = useCallback(() => {
    setDeste((onceki) => {
      if (onceki.length === 0) return onceki
      const [ilk, ...geriKalan] = onceki
      setOgrenilenler((s) => new Set(s).add(ilk))
      return geriKalan
    })
  }, [])

  const onTekrar = useCallback(() => {
    setDeste((onceki) => {
      if (onceki.length <= 1) return onceki
      const [ilk, ...geriKalan] = onceki
      return [...geriKalan, ilk]
    })
  }, [])

  const onPrev = useCallback(() => {
    setDeste((onceki) => {
      if (onceki.length <= 1) return onceki
      const son = onceki[onceki.length - 1]
      return [son, ...onceki.slice(0, -1)]
    })
  }, [])

  const onNext = useCallback(() => {
    setDeste((onceki) => {
      if (onceki.length <= 1) return onceki
      const [ilk, ...geriKalan] = onceki
      return [...geriKalan, ilk]
    })
  }, [])

  const onTestSonuc = useCallback((dogruMu: boolean, donem: Donem) => {
    setTestSayaci((s) => ({
      dogru: s.dogru + (dogruMu ? 1 : 0),
      yanlis: s.yanlis + (dogruMu ? 0 : 1),
    }))
    setDonemSayaci((s) => {
      const mevcut = s[donem] ?? { dogru: 0, yanlis: 0 }
      return {
        ...s,
        [donem]: {
          dogru: mevcut.dogru + (dogruMu ? 1 : 0),
          yanlis: mevcut.yanlis + (dogruMu ? 0 : 1),
        },
      }
    })
  }, [])

  const aktifIndex = deste[0] ?? 0
  const aktifYazar = yazarlar[aktifIndex]

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, currentColor 1px, transparent 1px), radial-gradient(circle at 80% 70%, currentColor 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Header */}
      <header className="relative sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-md">
              <Layers className="w-5 h-5 text-primary-foreground" strokeWidth={1.5} />
            </div>
            <div className="leading-tight">
              <h1 className="font-serif font-bold text-lg tracking-tight">YKS Edebiyat</h1>
              <p className="text-[11px] text-muted-foreground">Yazar - Eser Ezberi</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <TemaAnahtari />
            <button
              onClick={() => setInfoAcik(true)}
              className="w-9 h-9 rounded-full bg-card ring-1 ring-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-primary hover:ring-primary/40 transition"
              aria-label="Bilgi"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mod seçici (masaüstü) */}
        <div className="max-w-3xl mx-auto px-5 pb-3 hidden sm:block">
          <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-muted rounded-2xl ring-1 ring-border">
            <button
              onClick={() => setMod("kart")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition ${
                mod === "kart"
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="w-4 h-4" /> Kart Modu
            </button>
            <button
              onClick={() => setMod("test")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition ${
                mod === "test"
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Brain className="w-4 h-4" /> Test Modu
            </button>
          </div>
        </div>
      </header>

      {/* İçerik */}
      <main className="relative max-w-3xl mx-auto px-5 py-8 pb-32">
        {ruhHali && (
          <div className="mb-6 flex items-start gap-3 rounded-3xl bg-accent/60 p-4 ring-1 ring-border shadow-sm animate-rise">
            <span className="text-2xl leading-none" aria-hidden="true">
              {ruhHali.emoji}
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

        {mod === "kart" ? (
          bitti ? (
            <TamamlamaEkrani toplam={yazarlar.length} onSifirla={sifirla} />
          ) : (
            <Flashcard
              key={aktifIndex}
              yazar={aktifYazar}
              index={0}
              total={yazarlar.length}
              ogrenilenSayi={ogrenilenler.size}
              onPrev={onPrev}
              onNext={onNext}
              onOgrenildi={onOgrenildi}
              onTekrar={onTekrar}
            />
          )
        ) : mod === "test" ? (
          <TestModul onSonuc={onTestSonuc} />
        ) : (
          <IstatistikModul
            ogrenilenler={ogrenilenler}
            toplamKart={yazarlar.length}
            testSayaci={testSayaci}
            donemSayaci={donemSayaci}
            onSifirla={istatistikSifirla}
          />
        )}
      </main>

      {/* Mobil alt menü */}
      <AltMenu mod={mod} setMod={setMod} />

      {/* Ruh hali pop-up'ı */}
      <RuhHaliModal onSecim={setRuhHali} />

      {/* Bilgi modalı */}
      {infoAcik && (
        <div
          className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={() => setInfoAcik(false)}
        >
          <div
            className="bg-card rounded-[1.75rem] shadow-2xl max-w-md w-full p-7 ring-1 ring-border animate-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="font-serif font-bold text-xl text-card-foreground">Hakkında</h2>
              <button
                onClick={() => setInfoAcik(false)}
                className="text-muted-foreground hover:text-foreground transition"
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="font-serif text-base text-primary font-semibold mb-1">{baslik}</p>
            <p className="text-sm text-muted-foreground mb-4">{amac}</p>
            {notu && (
              <div className="bg-accent/60 ring-1 ring-border rounded-2xl p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent-foreground mb-1.5">Not</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{notu}</p>
              </div>
            )}
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Kart Modu:</span> Sağa kaydır = Öğrendim, Sola kaydır =
                Tekrar Et. Tüm kartlar bitince tebrikler ekranı.
              </p>
              <p>
                <span className="font-semibold text-foreground">Test Modu:</span> Dönem seç, 4 şıklı soruları çöz.
              </p>
              <p>
                <span className="font-semibold text-foreground">İstatistik:</span> Dönem bazlı öğrenme ve test başarı
                oranların.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
