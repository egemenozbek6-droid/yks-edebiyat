type Props = {
  mevcut: number
  toplam: number
  etiket?: string
  sagEtiket?: string
}

export default function IlerlemeBari({ mevcut, toplam, etiket, sagEtiket }: Props) {
  const oran = toplam > 0 ? Math.min(100, Math.round((mevcut / toplam) * 100)) : 0

  return (
    <div className="w-full">
      <div className="flex items-end justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {etiket ?? "İlerleme"}
        </p>
        <p className="text-xs font-semibold text-muted-foreground">
          {sagEtiket ?? (
            <>
              <span className="text-primary text-sm font-bold">{mevcut}</span>
              <span> / {toplam}</span>
            </>
          )}
        </p>
      </div>

      <div
        className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted ring-1 ring-border"
        role="progressbar"
        aria-valuenow={oran}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={etiket ?? "İlerleme"}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${oran}%` }}
        >
          <div className="absolute inset-0 rounded-full bg-foreground/10 mix-blend-overlay" />
        </div>
        {oran > 6 && (
          <div
            className="absolute top-0 h-full w-6 rounded-full bg-primary-foreground/40 blur-[3px] transition-all duration-500"
            style={{ left: `calc(${oran}% - 1.5rem)` }}
          />
        )}
      </div>
    </div>
  )
}
