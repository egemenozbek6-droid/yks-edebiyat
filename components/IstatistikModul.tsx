"use client"

import { CheckCircle2, Layers, Target, XCircle } from "lucide-react"
import DonemRozeti from "@/components/DonemRozeti"
import IlerlemeBari from "@/components/IlerlemeBari"
import { donemler, yazarlar, type Donem } from "@/data/yazarlar"

export type TestSayaci = { dogru: number; yanlis: number }

type Props = {
  ogrenilenler: Set<number>
  toplamKart: number
  testSayaci: TestSayaci
  donemSayaci: Record<string, TestSayaci>
  onSifirla: () => void
}

export default function IstatistikModul({
  ogrenilenler,
  toplamKart,
  testSayaci,
  donemSayaci,
  onSifirla,
}: Props) {
  const toplamTest = testSayaci.dogru + testSayaci.yanlis
  const basari = toplamTest > 0 ? Math.round((testSayaci.dogru / toplamTest) * 100) : 0

  const donemOgrenilen = (donem: Donem) => {
    const indeksler = yazarlar.map((y, i) => ({ y, i })).filter(({ y }) => y.donem === donem)
    const ogrenilen = indeksler.filter(({ i }) => ogrenilenler.has(i)).length
    return { ogrenilen, toplam: indeksler.length }
  }

  return (
    <div className="animate-rise space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Kutu
          ikon={<Layers className="h-4 w-4" />}
          etiket="Öğrenilen"
          deger={`${ogrenilenler.size}`}
          alt={`/ ${toplamKart} kart`}
        />
        <Kutu
          ikon={<CheckCircle2 className="h-4 w-4" />}
          etiket="Doğru"
          deger={`${testSayaci.dogru}`}
          alt="test cevabı"
        />
        <Kutu ikon={<XCircle className="h-4 w-4" />} etiket="Yanlış" deger={`${testSayaci.yanlis}`} alt="test cevabı" />
      </div>

      <div className="rounded-3xl bg-card p-6 ring-1 ring-border shadow-sm">
        <IlerlemeBari mevcut={ogrenilenler.size} toplam={toplamKart} etiket="Kart destesi" />
        <div className="mt-5">
          <IlerlemeBari
            mevcut={testSayaci.dogru}
            toplam={Math.max(1, toplamTest)}
            etiket="Test başarısı"
            sagEtiket={toplamTest > 0 ? `%${basari}` : "Henüz test yok"}
          />
        </div>
      </div>

      <div className="rounded-3xl bg-card p-6 ring-1 ring-border shadow-sm">
        <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Target className="h-3.5 w-3.5 text-primary" /> Dönem bazlı durum
        </p>
        <div className="space-y-4">
          {donemler.map((donem) => {
            const { ogrenilen, toplam } = donemOgrenilen(donem)
            const test = donemSayaci[donem] ?? { dogru: 0, yanlis: 0 }
            const testToplam = test.dogru + test.yanlis
            return (
              <div key={donem}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <DonemRozeti donem={donem} boyut="sm" />
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {ogrenilen}/{toplam} kart
                    {testToplam > 0 && ` · ${test.dogru}/${testToplam} test`}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted ring-1 ring-border">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{ width: `${toplam > 0 ? (ogrenilen / toplam) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <button
        onClick={onSifirla}
        className="w-full rounded-2xl bg-card py-3.5 text-sm font-semibold text-muted-foreground ring-1 ring-border shadow-sm transition hover:text-destructive hover:ring-destructive/40 active:scale-[0.99]"
      >
        Tüm istatistikleri sıfırla
      </button>
    </div>
  )
}

function Kutu({
  ikon,
  etiket,
  deger,
  alt,
}: {
  ikon: React.ReactNode
  etiket: string
  deger: string
  alt: string
}) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border shadow-sm">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
        {ikon}
      </span>
      <p className="mt-3 font-serif text-2xl font-bold leading-none text-card-foreground">{deger}</p>
      <p className="mt-1.5 text-[11px] font-semibold text-muted-foreground">{etiket}</p>
      <p className="text-[10px] text-muted-foreground/80">{alt}</p>
    </div>
  )
}
