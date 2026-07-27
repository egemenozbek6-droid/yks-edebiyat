"use client"

import { BarChart3, Brain, Layers } from "lucide-react"

export type Mod = "kart" | "test" | "istatistik"

const ogeler: { mod: Mod; etiket: string; ikon: typeof Layers }[] = [
  { mod: "kart", etiket: "Kartlar", ikon: Layers },
  { mod: "test", etiket: "Test", ikon: Brain },
  { mod: "istatistik", etiket: "İstatistik", ikon: BarChart3 },
]

export default function AltMenu({ mod, setMod }: { mod: Mod; setMod: (m: Mod) => void }) {
  return (
    <nav
      aria-label="Ana gezinme"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto grid max-w-3xl grid-cols-3">
        {ogeler.map(({ mod: m, etiket, ikon: Ikon }) => {
          const aktif = mod === m
          return (
            <button
              key={m}
              onClick={() => setMod(m)}
              aria-current={aktif ? "page" : undefined}
              className="group relative flex flex-col items-center gap-1 py-3 transition"
            >
              <span
                className={`grid h-9 w-14 place-items-center rounded-2xl transition-all duration-300 ${
                  aktif
                    ? "bg-primary/12 text-primary scale-100"
                    : "text-muted-foreground group-hover:text-foreground group-active:scale-95"
                }`}
              >
                <Ikon className="h-5 w-5" strokeWidth={aktif ? 2.4 : 1.8} />
              </span>
              <span className={`text-[11px] font-semibold ${aktif ? "text-primary" : "text-muted-foreground"}`}>
                {etiket}
              </span>
              <span
                className={`absolute top-0 h-0.5 rounded-full bg-primary transition-all duration-300 ${
                  aktif ? "w-10 opacity-100" : "w-0 opacity-0"
                }`}
              />
            </button>
          )
        })}
      </div>
    </nav>
  )
}
