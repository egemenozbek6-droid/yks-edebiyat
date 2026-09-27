"use client";

import { useState } from "react";
import { Fraunces } from "next/font/google";

/**
 * Not: app layout'ta --font-serif şu an sans'a bağlanmış.
 * Onboarding kimliği için Fraunces'i burada ayrıca yüklüyoruz.
 */
const baslikFont = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

type AdimId = "kart" | "test" | "duelo";

const ADIMLAR: {
  id: AdimId;
  etiket: string;
  baslik: string;
  metin: string;
  kutu: string;
  etiketRenk: string;
  buton: string;
  accentBar: string;
  stroke: string;
}[] = [
  {
    id: "kart",
    etiket: "Kartlar",
    baslik: "Kartlarla ezberle",
    metin:
      "Ön yüzde eser, arkada yazar. Kartı çevir: biliyorsan Kaptım (kutun yükselir), takıldıysan Tekrar Et (Kutu 1). Dönem seçip sağa-sola kaydırarak desteyi gezersin.",
    kutu: "border-primary/35 bg-primary/10",
    etiketRenk: "text-primary",
    buton: "bg-primary text-primary-foreground",
    accentBar: "bg-primary",
    stroke: "currentColor",
  },
  {
    id: "test",
    etiket: "Test",
    baslik: "Çoktan seçmeli prova",
    metin:
      "Dönem testleri, ÖSYM Sever, kadın yazarlar, eser–kahraman ve Batı akımları. Yanlışlar Tekrar Köşen’e düşer; oradan tekrar çözüp eksiğini kapatırsın.",
    kutu: "border-violet-500/35 bg-violet-500/10",
    etiketRenk: "text-violet-400",
    buton: "bg-violet-600 text-white",
    accentBar: "bg-violet-600",
    stroke: "currentColor",
  },
  {
    id: "duelo",
    etiket: "Düello",
    baslik: "Rakiple yarış, EP kazan",
    metin:
      "Ranked’de canlı rakip (veya bot); özel odada arkadaşınla oda kodu. Ranked galibiyetinde EP gelir, Kariyer Yolu’nda rütbe atarsın.",
    kutu: "border-duello/35 bg-duello/10",
    etiketRenk: "text-duello",
    buton: "bg-duello text-duello-foreground",
    accentBar: "bg-duello",
    stroke: "currentColor",
  },
];

/** Anlamlı ince çizgi illüstrasyonlar */
function Illu({ id, className }: { id: AdimId; className?: string }) {
  if (id === "kart") {
    // Eğik fiş + tüy kalem
    return (
      <svg viewBox="0 0 64 72" className={className} fill="none" aria-hidden>
        <rect
          x="10"
          y="8"
          width="36"
          height="52"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="1.75"
          transform="rotate(-7 28 34)"
        />
        <path
          d="M16 24h24M16 33h18M16 42h21"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.75"
          transform="rotate(-7 28 34)"
        />
        <path d="M42 50 L54 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <path d="M54 18l-5 1.5 1.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "test") {
    // Kurşun kalem + kırık uç + tik
    return (
      <svg viewBox="0 0 64 72" className={className} fill="none" aria-hidden>
        <path
          d="M24 58 V26 L32 16 L40 26 V58 Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path d="M24 26h16" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M32 16 L28 8 M32 16 L36 8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M26 44 L31 49 L40 36"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  // Düello: çapraz tüy kalemler (X / iptal değil)
  return (
    <svg viewBox="0 0 64 72" className={className} fill="none" aria-hidden>
      <path d="M14 56 L46 16" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
      <path d="M46 16l-5 1 1 5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M18 18c2-1 5-1 7 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
      <path d="M50 56 L18 16" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
      <path d="M18 16l5 1 -1 5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M46 18c-2-1-5-1-7 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
      <circle cx="32" cy="36" r="4" stroke="currentColor" strokeWidth="1.4" opacity="0.85" />
    </svg>
  );
}

type Props = {
  onBitti: () => void;
};

export default function OnboardingEkran({ onBitti }: Props) {
  const [adim, setAdim] = useState(0);
  const mevcut = ADIMLAR[adim];
  const sonMu = adim === ADIMLAR.length - 1;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-label="EdebiKart tanıtım"
    >
      {/* İçerik: masaüstünde aşırı boşluk olmasın diye max yükseklik + ortala */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-6">
        <div className="flex w-full max-w-[22rem] flex-col items-center">
          <div
            className={`mb-6 grid h-[5.25rem] w-[4.25rem] place-items-center rounded-md border ${mevcut.kutu} ${mevcut.etiketRenk}`}
          >
            <Illu id={mevcut.id} className="h-12 w-11" />
          </div>

          <p
            className={`mb-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] ${mevcut.etiketRenk}`}
          >
            {mevcut.etiket}
          </p>

          <h2
            className={`${baslikFont.className} text-balance text-center text-[1.75rem] font-semibold leading-[1.25] tracking-tight text-foreground`}
          >
            {mevcut.baslik}
          </h2>

          <p className="mt-4 text-pretty text-center text-[14px] leading-relaxed text-muted-foreground">
            {mevcut.metin}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mb-5 flex flex-col items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
            Fiş {adim + 1} / {ADIMLAR.length}
          </p>
          <div className="flex w-full max-w-[200px] gap-1.5">
            {ADIMLAR.map((a, i) => (
              <span
                key={a.id}
                className={`h-[3px] flex-1 rounded-full transition-colors ${
                  i <= adim ? mevcut.accentBar : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBitti}
            className="w-20 py-3.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Atla
          </button>
          <button
            type="button"
            onClick={() => (sonMu ? onBitti() : setAdim((n) => n + 1))}
            className={`flex-1 rounded-lg py-3.5 text-[15px] font-bold tracking-wide shadow-md transition hover:brightness-110 active:scale-[0.99] ${mevcut.buton}`}
          >
            {sonMu ? "Hadi başla" : "Devam"}
          </button>
        </div>
      </div>
    </div>
  );
}
