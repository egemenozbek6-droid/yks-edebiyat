"use client"

import { useCallback, useState } from "react"
import { ArrowRight, Brain, Check, RotateCcw, Target, X } from "lucide-react"
import DonemRozeti from "@/components/DonemRozeti"
import IlerlemeBari from "@/components/IlerlemeBari"
import { donemler, yazarlar, type Donem, type Yazar } from "@/data/yazarlar"

type Soru = {
  metin: string
  vurgu: string
  secenekler: string[]
  dogru: string
  donem: Donem
  tip: "eser" | "yazar"
}

type Props = {
  onSonuc?: (dogruMu: boolean, donem: Donem) => void
}

const SORU_SAYISI = 10

function karistir<T>(dizi: T[]): T[] {
  const kopya = [...dizi]
  for (let i = kopya.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[kopya[i], kopya[j]] = [kopya[j], kopya[i]]
  }
  return kopya
}

function sorulariUret(havuz: Yazar[]): Soru[] {
  const tumEserler = yazarlar.flatMap((y) => y.eserler)
  const tumYazarlar = yazarlar.map((y) => y.ad)

  return karistir(havuz)
    .slice(0, SORU_SAYISI)
    .map((yazar, i): Soru => {
      const dogruEser = karistir(yazar.eserler)[0]

      if (i % 2 === 0) {
        // "Bu yazarın eseri hangisidir?"
        const yanlislar = karistir(tumEserler.filter((e) => !yazar.eserler.includes(e))).slice(0, 3)
        return {
          metin: "Aşağıdaki eserlerden hangisi bu yazara aittir?",
          vurgu: yazar.ad,
          secenekler: karistir([dogruEser, ...yanlislar]),
          dogru: dogruEser,
          donem: yazar.donem,
          tip: "eser",
        }
      }

      // "Bu eser kime aittir?"
      const yanlislar = karistir(tumYazarlar.filter((a) => a !== yazar.ad)).slice(0, 3)
      return {
        metin: "Aşağıdaki yazarlardan hangisi bu eserin yazarıdır?",
        vurgu: dogruEser,
        secenekler: karistir([yazar.ad, ...yanlislar]),
        dogru: yazar.ad,
        donem: yazar.donem,
        tip: "yazar",
      }
    })
}

export default function TestModul({ onSonuc }: Props) {
  const [secilenDonem, setSecilenDonem] = useState<Donem | "Tümü" | null>(null)
  const [sorular, setSorular] = useState<Soru[]>([])
  const [aktif, setAktif] = useState(0)
  const [secim, setSecim] = useState<string | null>(null)
  const [dogruSayi, setDogruSayi] = useState(0)
  const [bitti, setBitti] = useState(false)

  const basla = useCallback((donem: Donem | "Tümü") => {
    const secilenHavuz = donem === "Tümü" ? yazarlar : yazarlar.filter((y) => y.donem === donem)
    setSecilenDonem(donem)
    setSorular(sorulariUret(secilenHavuz))
    setAktif(0)
    setSecim(null)
    setDogruSayi(0)
    setBitti(false)
  }, [])

  const cevapla = (secenek: string) => {
    if (secim) return
    const soru = sorular[aktif]
    const dogruMu = secenek === soru.dogru
    setSecim(secenek)
    if (dogruMu) setDogruSayi((s) => s + 1)
    onSonuc?.(dogruMu, soru.donem)
  }

  const sonraki = () => {
    if (aktif + 1 >= sorular.length) {
      setBitti(true)
      return
    }
    setAktif((a) => a + 1)
    setSecim(null)
  }

  /* ——— Dönem seçim ekranı ——— */
  if (!secilenDonem || sorular.length === 0) {
    return (
      <div className="animate-rise">
        <div className="mb-6 rounded-3xl bg-card p-7 text-center ring-1 ring-border shadow-sm">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Brain className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-xl font-bold text-balance text-card-foreground">Bir dönem seç</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-pretty text-muted-foreground">
            Seçtiğin dönemden {SORU_SAYISI} soruluk, 4 şıklı bir test hazırlanır.
          </p>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={() => basla("Tümü")}
            className="flex w-full items-center justify-between rounded-2xl bg-primary px-5 py-4 text-left text-primary-foreground shadow-md transition hover:brightness-110 active:scale-[0.99]"
          >
            <span className="flex items-center gap-3">
              <Target className="h-5 w-5" />
              <span className="text-sm font-bold">Tüm Dönemler</span>
            </span>
            <span className="text-xs font-semibold opacity-80">{yazarlar.length} yazar</span>
          </button>

          {donemler.map((donem) => {
            const adet = yazarlar.filter((y) => y.donem === donem).length
            return (
              <button
                key={donem}
                onClick={() => basla(donem)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3.5 text-left ring-1 ring-border shadow-sm transition hover:ring-primary/40 active:scale-[0.99]"
              >
                <DonemRozeti donem={donem} />
                <span className="text-xs font-semibold text-muted-foreground">{adet} yazar</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  /* ——— Sonuç ekranı ——— */
  if (bitti) {
    const oran = Math.round((dogruSayi / sorular.length) * 100)
    return (
      <div className="animate-rise rounded-3xl bg-card p-9 text-center ring-1 ring-border shadow-xl shadow-foreground/5">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-primary/10 text-primary ring-1 ring-primary/20 animate-pop">
          <Target className="h-9 w-9" strokeWidth={1.5} />
        </div>
        <h2 className="font-serif text-2xl font-bold text-card-foreground">Test bitti</h2>
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
              setSecilenDonem(null)
              setSorular([])
            }}
            className="rounded-2xl bg-card py-3.5 text-sm font-semibold text-muted-foreground ring-1 ring-border shadow-sm transition hover:text-foreground hover:ring-primary/40 active:scale-[0.98]"
          >
            Dönem Değiştir
          </button>
        </div>
      </div>
    )
  }

  /* ——— Soru ekranı ——— */
  const soru = sorular[aktif]

  return (
    <div className="animate-rise">
      <div className="mb-6 rounded-3xl bg-card/70 p-4 ring-1 ring-border shadow-sm backdrop-blur">
        <IlerlemeBari
          mevcut={aktif + (secim ? 1 : 0)}
          toplam={sorular.length}
          etiket="Soru"
          sagEtiket={`${aktif + 1} / ${sorular.length} · ${dogruSayi} doğru`}
        />
        <div className="mt-3 flex items-center justify-between">
          <DonemRozeti donem={soru.donem} boyut="sm" />
          <button
            onClick={() => {
              setSecilenDonem(null)
              setSorular([])
            }}
            className="text-[11px] font-semibold text-muted-foreground transition hover:text-foreground"
          >
            Dönemi değiştir
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-card p-7 ring-1 ring-border shadow-xl shadow-foreground/5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {soru.tip === "eser" ? "Yazarın eseri" : "Eserin yazarı"}
        </p>
        <h2 className="mt-2 font-serif text-2xl font-bold leading-snug text-balance text-card-foreground">
          {soru.vurgu}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{soru.metin}</p>

        <div className="mt-6 space-y-2.5">
          {soru.secenekler.map((secenek, i) => {
            const secildi = secim === secenek
            const dogruSecenek = secenek === soru.dogru
            const gosterDogru = secim !== null && dogruSecenek
            const gosterYanlis = secildi && !dogruSecenek

            let stil =
              "bg-card ring-border text-card-foreground hover:ring-primary/40 hover:bg-muted/60"
            if (gosterDogru) stil = "bg-emerald-500/15 ring-emerald-500/60 text-emerald-700 dark:text-emerald-300"
            else if (gosterYanlis) stil = "bg-destructive/15 ring-destructive/60 text-destructive"
            else if (secim !== null) stil = "bg-card ring-border text-muted-foreground opacity-60"

            return (
              <button
                key={secenek}
                onClick={() => cevapla(secenek)}
                disabled={secim !== null}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-sm font-semibold ring-1 transition-all duration-200 ${stil} ${
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
            )
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
  )
}
