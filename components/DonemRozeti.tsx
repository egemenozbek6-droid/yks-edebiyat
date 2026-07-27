import { donemStil, type Donem } from "@/data/yazarlar"

type Props = {
  donem: Donem
  className?: string
  boyut?: "sm" | "md"
}

export default function DonemRozeti({ donem, className = "", boyut = "md" }: Props) {
  const olcu = boyut === "sm" ? "text-[10px] px-2 py-0.5" : "text-[11px] px-2.5 py-1"
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide ring-1 ${olcu} ${donemStil[donem]} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {donem}
    </span>
  )
}
