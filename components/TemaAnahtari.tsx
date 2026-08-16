"use client"

import { Moon } from "lucide-react"

export default function TemaAnahtari() {
  return (
    <div
      aria-label="Karanlık mod aktif"
      className="relative h-9 w-9 rounded-full glass-card shadow-sm flex items-center justify-center text-primary ring-1 ring-border shrink-0"
    >
      <Moon className="h-4 w-4" strokeWidth={2} />
    </div>
  )
}
