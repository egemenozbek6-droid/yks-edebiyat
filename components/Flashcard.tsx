"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { BookOpen, Check, ChevronLeft, ChevronRight, Flame, Lightbulb, RotateCcw, Sparkles, Trophy, Undo2 } from "lucide-react"
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

  const baslangic = useRef(0)
  const hareket = useRef(0)

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
    if (ucus) return
    baslangic.current = e.clientX
    hareket.current = 0
    setSurukleniyor(true)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const suruklu = (e: React.PointerEvent) => {
    if (!surukleniyor || ucus) return
    const fark = e.clientX - baslangic.current
    hareket.current = Math.max(hareket.current, Math.abs(fark))
    setDx(fark)
  }

  const bitir = () => {
    if (!surukleniyor || ucus) return
    setSurukleniyor(false)
    if (dx > ESIK) tamamla("sag")
    else if (dx < -ESIK) tamamla("sol")
    else setDx(0)
  }

  const tikla = () => {
    if (hareket.current > 8 || ucus) return
    setCevrildi((v) => !v)
  }

  const kisaIpucu = `${item.period} · ${item.genre}`
  const osymFreq = item.osym_stats?.osym_freq

  const donus = Math.max(-12, Math.min(12, dx / 14))
  const sagOran = Math.min(1, Math.max(0, dx / ESIK))
  const solOran = Math.min(1, Math.max(0, -dx / ESIK))

  return (
    <div className="animate-rise">
      <div className="mb-6 rounded-3xl bg-card/70 p-4 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] backdrop-blur">
        <IlerlemeBari mevcut={ogrenilenSayi} toplam={total} etiket="Öğrenilen kart" />
        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Sağa kaydır: Öğrendim
          </span>
          <span className="inline-flex items-center gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Sola kaydır: Tekrar
          </span>
        </div>
      </div>

      <div className="relative select-none" style={{ perspective: "1600px" }}>
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
              ? `Cevap: ${item.author}, ${item.period}. Ön yüze dönmek için tıkla.`
              : `Eser: ${item.work}. Yazarı görmek için tıkla.`
          }
          className={`relative touch-pan-y cursor-pointer ${
            surukleniyor ? "" : "transition-all duration-300 ease-out"
          }`}
          style={{
            transform: `translateX(${dx}px) rotate(${donus}deg)`,
            opacity: ucus ? 0 : 1,
            transitionProperty: surukleniyor ? "none" : "transform, opacity",
          }}
        >
          <div
            className="relative h-[440px] w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:h-[460px]"
            style={{
              transformStyle: "preserve-3d",
              transform: cevrildi ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* ÖN YÜZ — Eser gösterilir */}
            <div
              className="absolute inset-0 flex flex-col rounded-[1.75rem] bg-card p-7 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)]"
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary ring-1 ring-primary/20">
                  <BookOpen className="h-3.5 w-3.5" strokeWidth={2} />
                  Bu eser kimin?
                </span>
                {osymFreq && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-[10px] font-bold text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/30">
                    <Flame className="h-3 w-3" strokeWidth={2} />
                    {osymFreq}
                  </span>
                )}
              </div>

              <div className="mt-5 flex flex-1 flex-col items-center justify-center text-center">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Eser
                </p>
                <h2 className="font-serif text-2xl font-extrabold leading-tight text-balance text-card-foreground sm:text-3xl">
                  {item.work}
                </h2>
                <p className="mt-3 text-sm font-medium text-muted-foreground">{item.genre}</p>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-accent/50 px-3.5 py-2.5">
                <Lightbulb className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2} />
                <p className="text-center text-[12px] font-medium italic leading-snug text-pretty text-accent-foreground">
                  {kisaIpucu}
                </p>
              </div>

              <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Yazarı gör: karta dokun
              </p>
            </div>

            {/* ARKA YÜZ — Yazar gösterilir */}
            <div
              className="absolute inset-0 flex flex-col rounded-[1.75rem] bg-card p-7 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)]"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary ring-1 ring-primary/20">
                  {item.period}
                </span>
                {osymFreq && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-[10px] font-bold text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/30">
                    <Flame className="h-3 w-3" strokeWidth={2} />
                    {osymFreq}
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Cevap
                </p>
                <h2 className="font-serif text-3xl font-extrabold uppercase leading-tight tracking-wide text-balance text-card-foreground sm:text-4xl">
                  {item.author}
                </h2>
                <p className="mt-4 inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-md">
                  {item.period}
                </p>

                {/* Bilgi Notu */}
                <div className="mt-5 w-full rounded-2xl bg-accent/50 p-3.5">
                  <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-foreground">
                    <Lightbulb className="h-3 w-3" strokeWidth={2} />
                    Bilgi Notu
                  </p>
                  <p className="text-xs leading-relaxed text-pretty text-muted-foreground">{item.info}</p>
                </div>
              </div>
            </div>
          </div>

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

      <div className="mt-7 grid grid-cols-2 gap-3">
        <button
          onClick={() => tamamla("sol")}
          className="flex items-center justify-center gap-2 rounded-2xl bg-card py-3.5 text-sm font-semibold text-muted-foreground shadow-sm transition hover:text-destructive active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" /> Tekrar Et
        </button>
        <button
          onClick={() => tamamla("sag")}
          className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
        >
          <Check className="h-4 w-4" /> Öğrendim
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={onPrev}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Önceki
        </button>
        <button
          onClick={() => setCevrildi((v) => !v)}
          className="rounded-xl px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10"
        >
          Kartı Çevir
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          Sonraki <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function TamamlamaEkrani({ toplam, onSifirla }: { toplam: number; onSifirla: () => void }) {
  return (
    <div className="animate-rise rounded-[1.75rem] bg-card p-9 text-center shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)]">
      <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-primary/10 text-primary ring-1 ring-primary/20 animate-pop">
        <Trophy className="h-9 w-9" strokeWidth={1.5} />
      </div>
      <h2 className="font-serif text-2xl font-bold text-balance text-card-foreground">Deste tamamlandı!</h2>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-pretty text-muted-foreground">
        {toplam} kartın tamamını öğrendin olarak işaretledin. Kalıcı hale gelmesi için desteyi tekrar çalışabilir veya
        test moduna geçebilirsin.
      </p>
      <div className="mt-6">
        <IlerlemeBari mevcut={toplam} toplam={toplam} etiket="Tamamlanan" />
      </div>
      <button
        onClick={onSifirla}
        className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
      >
        <RotateCcw className="h-4 w-4" /> Desteyi Sıfırla
      </button>
    </div>
  )
}
