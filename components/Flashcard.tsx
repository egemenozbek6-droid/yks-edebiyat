"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { BookOpen, Check, ChevronLeft, ChevronRight, Flame, Lightbulb, RotateCcw, Trophy, Undo2 } from "lucide-react"
import IlerlemeBari from "@/components/IlerlemeBari"
import type { LiteratureItem } from "@/src/data"

type Props = {
  item: LiteratureItem
  total: number
  ogrenilenSayi: number
  onPrev: () => void
  onNext: () => void
  onOgrenildi: () => void
  onTekrar: () => void
}

let ilkAcilisTamam = false
const ESIK = 110

export default function Flashcard({
  item,
  total,
  ogrenilenSayi,
  onPrev,
  onNext,
  onOgrenildi,
  onTekrar,
}: Props) {
  const [cevrildi, setCevrildi] = useState(false)
  const [dx, setDx] = useState(0)
  const [surukleniyor, setSurukleniyor] = useState(false)
  const [ucus, setUcus] = useState<"sag" | "sol" | null>(null)
  const hareket = useRef(0)
  const baslangic = useRef(0)

  // Animasyon SADECE uygulama ilk açıldığında 1 kez çalışır
  const [intro, setIntro] = useState(() => !ilkAcilisTamam)
  useEffect(() => {
    if (!ilkAcilisTamam) {
      const t = window.setTimeout(() => {
        ilkAcilisTamam = true
        setIntro(false)
      }, 1900)
      return () => window.clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    setCevrildi(false)
    setDx(0)
    setUcus(null)
  }, [item.id])

  const tamamla = useCallback(
    (yon: "sag" | "sol") => {
      setUcus(yon)
      setSurukleniyor(false)
      setDx(yon === "sag" ? 520 : -520)
      window.setTimeout(() => {
        if (yon === "sag") onOgrenildi()
        else onTekrar()
      }, 320)
    },
    [onOgrenildi, onTekrar],
  )

  const basla = (e: React.PointerEvent) => {
    if (ucus || intro) return
    baslangic.current = e.clientX
    hareket.current = 0
    setSurukleniyor(true)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const suruklu = (e: React.PointerEvent) => {
    if (!surukleniyor || ucus || intro) return
    const fark = e.clientX - baslangic.current
    hareket.current = Math.max(hareket.current, Math.abs(fark))
    setDx(fark)
  }

  const bitir = () => {
    if (!surukleniyor || ucus || intro) return
    setSurukleniyor(false)
    if (dx > ESIK) tamamla("sag")
    else if (dx < -ESIK) tamamla("sol")
    else setDx(0)
  }

  const tikla = () => {
    if (hareket.current > 8 || ucus || intro) return
    setCevrildi((v) => !v)
  }

  const kisaIpucu = `${item.period} · ${item.genre}`
  const osymFreq = item.osym_stats?.osym_freq

  const donus = Math.max(-12, Math.min(12, dx / 14))
  const sagOran = Math.min(1, Math.max(0, dx / ESIK))
  const solOran = Math.min(1, Math.max(0, -dx / ESIK))

  return (
    <div className="flex flex-col flex-1 min-h-0 animate-rise">
      {/* İlerleme barı — kompakt */}
      <div className="mb-3 rounded-2xl bg-card/70 p-3 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] backdrop-blur shrink-0">
        <IlerlemeBari mevcut={ogrenilenSayi} toplam={total} etiket="Öğrenilen" />
      </div>

      {/* Kart alanı — flex-1, ekranı doldur */}
      <div className="relative select-none flex-1 min-h-0 flex items-center" style={{ perspective: "1600px" }}>
        <div className="absolute inset-x-4 top-3 h-full rounded-[1.75rem] bg-card/40" aria-hidden="true" />
        <div className="absolute inset-x-2 top-1.5 h-full rounded-[1.75rem] bg-card/60" aria-hidden="true" />

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
              e.preventDefault()
              setCevrildi((v) => !v)
            }
          }}
          aria-label={
            cevrildi
              ? `Cevap: ${item.author}, ${item.period}.`
              : `Eser: ${item.work}.`
          }
          className={`relative w-full ${intro ? "animate-card-intro" : ""} ${
            surukleniyor && !intro ? "" : "transition-all duration-300 ease-out"
          }`}
          style={{
            transform: intro ? undefined : `translateX(${dx}px) rotate(${donus}deg)`,
            opacity: ucus ? 0 : 1,
            transitionProperty: surukleniyor || intro ? "none" : "transform, opacity",
          }}
        >
          <div
            className="relative h-[min(44vh,340px)] w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              transformStyle: "preserve-3d",
              transform: cevrildi ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* ÖN YÜZ */}
            <div
              className="absolute inset-0 flex flex-col rounded-[1.75rem] bg-card p-6 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)]"
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  <BookOpen className="h-3.5 w-3.5" strokeWidth={2} />
                  Eser
                </span>
                {osymFreq && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                    <Flame className="h-3 w-3" strokeWidth={2} />
                    {osymFreq}
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <h2 className="font-serif text-2xl font-extrabold leading-tight text-balance text-card-foreground sm:text-3xl">
                  {item.work}
                </h2>
                <p className="mt-3 text-sm font-medium text-muted-foreground">{item.genre}</p>
              </div>

              <div className="flex items-center justify-center gap-2 rounded-2xl bg-accent/50 px-3.5 py-2.5">
                <Lightbulb className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2} />
                <p className="text-center text-[12px] font-medium italic leading-snug text-pretty text-accent-foreground">
                  {kisaIpucu}
                </p>
              </div>
            </div>

            {/* ARKA YÜZ */}
            <div
              className="absolute inset-0 flex flex-col rounded-[1.75rem] bg-card p-6 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)]"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  {item.period}
                </span>
                {osymFreq && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                    <Flame className="h-3 w-3" strokeWidth={2} />
                    {osymFreq}
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Yazar
                </p>
                <h2 className="font-serif text-2xl font-extrabold uppercase leading-tight tracking-wide text-balance text-card-foreground sm:text-3xl">
                  {item.author}
                </h2>
                <p className="mt-3 inline-flex items-center rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-md">
                  {item.period}
                </p>

                <div className="mt-4 w-full rounded-2xl bg-accent/50 p-3">
                  <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-foreground">
                    <Lightbulb className="h-3 w-3" strokeWidth={2} />
                    Bilgi
                  </p>
                  <p className="text-xs leading-relaxed text-pretty text-muted-foreground">{item.info}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Swipe göstergeleri */}
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

      {/* Alt butonlar — kompakt */}
      <div className="mt-3 grid grid-cols-2 gap-2.5 shrink-0">
        <button
          onClick={() => tamamla("sol")}
          className="flex items-center justify-center gap-2 rounded-2xl bg-card py-3 text-sm font-semibold text-muted-foreground shadow-sm transition hover:text-destructive active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" /> Tekrar
        </button>
        <button
          onClick={() => tamamla("sag")}
          className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
        >
          <Check className="h-4 w-4" /> Öğrendim
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-between shrink-0">
        <button
          onClick={onPrev}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => setCevrildi((v) => !v)}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
        >
          Çevir
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function TamamlamaEkrani({ toplam, onSifirla }: { toplam: number; onSifirla: () => void }) {
  return (
    <div className="animate-rise rounded-[1.75rem] bg-card p-8 text-center shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] max-w-sm">
      <div className="mx-auto mb-5 grid h-18 w-18 place-items-center rounded-3xl bg-primary/10 text-primary animate-pop">
        <Trophy className="h-8 w-8" strokeWidth={1.5} />
      </div>
      <h2 className="font-serif text-xl font-bold tracking-tight text-balance text-card-foreground">Deste tamamlandı!</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-pretty text-muted-foreground">
        {toplam} kartın tamamını öğrendin olarak işaretledin.
      </p>
      <div className="mt-5">
        <IlerlemeBari mevcut={toplam} toplam={toplam} etiket="Tamamlanan" />
      </div>
      <button
        onClick={onSifirla}
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
      >
        <RotateCcw className="h-4 w-4" /> Sıfırla
      </button>
    </div>
  )
}
