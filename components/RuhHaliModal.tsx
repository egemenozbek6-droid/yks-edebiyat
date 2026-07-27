"use client"

import { useEffect, useState } from "react"
import { Sparkles, X } from "lucide-react"

export type RuhHali = {
  id: string
  emoji: string
  etiket: string
  mesaj: string
}

export const ruhHalleri: RuhHali[] = [
  {
    id: "harika",
    emoji: "🔥",
    etiket: "Harika / Bomba Gibiyim",
    mesaj: "O zaman bu enerjiyi kartlarda patlatıyoruz! Hedef 24'te 24! 🔥",
  },
  {
    id: "mukemmel",
    emoji: "⚡",
    etiket: "Mükemmel",
    mesaj: "Mükemmel bir gün! Hadi edebiyatı da mükemmel yapalım! ⚡",
  },
  {
    id: "ehiste",
    emoji: "😐",
    etiket: "Eh İşte / İdare Eder",
    mesaj: "Sorun değil, kartları karıştırdıkça açılırsın. Başlamak bitirmenin yarısıdır! ⭐",
  },
  {
    id: "yorgun",
    emoji: "🥱",
    etiket: "Kötü / Yorgunum",
    mesaj: "Anlıyorum, o zaman bugün sadece 10 kart bakalım, kendini çok yorma. 🧘",
  },
  {
    id: "bitik",
    emoji: "😞",
    etiket: "Bitik / Beynim Dönüştü",
    mesaj: "Pes etmek yok! Gel sadece en önemli eserlere hızlıca bir göz atalım, beynin yerine gelir! 💪",
  },
]

const ANAHTAR = "yks-edebiyat-ruh-hali"

function bugun() {
  return new Date().toISOString().slice(0, 10)
}

type Props = {
  /** Kullanıcı bir ruh hali seçtiğinde ana ekranda gösterilecek motivasyon mesajı */
  onSecim: (ruhHali: RuhHali) => void
}

export default function RuhHaliModal({ onSecim }: Props) {
  const [acik, setAcik] = useState(false)
  const [secilen, setSecilen] = useState<RuhHali | null>(null)

  // Günde bir kez: bugünün tarihi kayıtlı değilse aç
  useEffect(() => {
    try {
      if (window.localStorage.getItem(ANAHTAR) !== bugun()) {
        setAcik(true)
      }
    } catch {
      setAcik(true)
    }
  }, [])

  const kaydet = () => {
    try {
      window.localStorage.setItem(ANAHTAR, bugun())
    } catch {
      /* localStorage kullanılamıyorsa sessizce geç */
    }
  }

  const gec = () => {
    kaydet()
    setAcik(false)
  }

  const sec = (ruhHali: RuhHali) => {
    kaydet()
    setSecilen(ruhHali)
    onSecim(ruhHali)
    window.setTimeout(() => setAcik(false), 2400)
  }

  if (!acik) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/45 p-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Bugün nasıl hissediyorsun?"
    >
      <div className="w-full max-w-md animate-pop rounded-3xl bg-card p-7 ring-1 ring-border shadow-2xl">
        {secilen ? (
          // Motivasyon mesajı
          <div className="py-4 text-center">
            <div className="mx-auto mb-5 grid h-20 w-20 animate-pop place-items-center rounded-3xl bg-primary/10 text-4xl ring-1 ring-primary/20">
              <span aria-hidden="true">{secilen.emoji}</span>
            </div>
            <p className="font-serif text-xl font-bold leading-snug text-balance text-card-foreground">
              {secilen.mesaj}
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Hadi başlıyoruz
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary ring-1 ring-primary/20">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
                Günün ilk sorusu
              </div>
              <button
                onClick={gec}
                className="text-muted-foreground transition hover:text-foreground"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h2 className="mt-4 font-serif text-2xl font-bold leading-tight text-balance text-card-foreground">
              Naber? Bugün kendini nasıl hissediyorsun?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
              YKS maratonu uzun; moduna göre çalışalım. Sadece bir dokunuş, sonra kartlara geçiyoruz.
            </p>

            <div className="mt-5 flex flex-col gap-2.5">
              {ruhHalleri.map((rh) => (
                <button
                  key={rh.id}
                  onClick={() => sec(rh)}
                  className="flex items-center gap-3 rounded-2xl bg-muted/70 px-4 py-3 text-left ring-1 ring-border transition hover:bg-accent hover:ring-primary/40 active:scale-[0.98]"
                >
                  <span className="text-xl" aria-hidden="true">
                    {rh.emoji}
                  </span>
                  <span className="text-sm font-semibold text-card-foreground">{rh.etiket}</span>
                </button>
              ))}
            </div>

            <button
              onClick={gec}
              className="mt-4 w-full rounded-xl py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              Şimdi değil, direkt çalışmaya başla
            </button>
          </>
        )}
      </div>
    </div>
  )
}
