"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

export default function TemaAnahtari() {
  const [koyu, setKoyu] = useState(false)
  const [hazir, setHazir] = useState(false)

  useEffect(() => {
    setKoyu(document.documentElement.classList.contains("dark"))
    setHazir(true)
  }, [])

  const degistir = () => {
    const yeni = !koyu
    setKoyu(yeni)
    const kok = document.documentElement
    kok.classList.toggle("dark", yeni)
    kok.classList.toggle("light", !yeni)
    try {
      localStorage.setItem("yks-tema", yeni ? "dark" : "light")
    } catch {
      /* localStorage kapalı olabilir */
    }
  }

  return (
    <button
      onClick={degistir}
      aria-label={koyu ? "Aydınlık moda geç" : "Karanlık moda geç"}
      aria-pressed={koyu}
      className="relative h-9 w-16 rounded-full bg-muted ring-1 ring-border shadow-inner transition-colors hover:ring-primary/40"
    >
      <span
        className="absolute top-1 left-1 grid h-7 w-7 place-items-center rounded-full bg-card text-primary shadow-md ring-1 ring-border transition-transform duration-300 ease-out"
        style={{ transform: hazir && koyu ? "translateX(28px)" : "translateX(0)" }}
      >
        {koyu ? <Moon className="h-4 w-4" strokeWidth={2} /> : <Sun className="h-4 w-4" strokeWidth={2} />}
      </span>
      <span className="pointer-events-none absolute inset-0 flex items-center justify-between px-2.5 text-muted-foreground">
        <Sun className="h-3.5 w-3.5 opacity-60" />
        <Moon className="h-3.5 w-3.5 opacity-60" />
      </span>
    </button>
  )
}
