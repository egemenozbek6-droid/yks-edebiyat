"use client";

import { useState } from "react";
import { Fraunces } from "next/font/google";

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
}[] = [
  {
    id: "kart",
    etiket: "Kartlar",
    baslik: "Kartlarla ezberle",
    metin: "Eser–yazar kartını çevir. Biliyorsan Kaptım, takıldıysan Tekrar Et.",
    kutu: "border-primary/35 bg-primary/10",
    etiketRenk: "text-primary",
    buton: "bg-primary text-primary-foreground",
    accentBar: "bg-primary",
  },
  {
    id: "test",
    etiket: "Test",
    baslik: "Çoktan seçmeli prova",
    metin: "Dönemden ÖSYM’ye kadar soru çöz. Yanlışların Tekrar Köşen’de birikir.",
    kutu: "border-violet-500/35 bg-violet-500/10",
    etiketRenk: "text-violet-400",
    buton: "bg-violet-600 text-white",
    accentBar: "bg-violet-600",
  },
  {
    id: "duelo",
    etiket: "Düello",
    baslik: "Rakiple yarış, EP kazan",
    metin: "Canlı rakiple ya da arkadaşınla yarış; kazandıkça rütbe atla.",
    kutu: "border-duello/35 bg-duello/10",
    etiketRenk: "text-duello",
    buton: "bg-duello text-duello-foreground",
    accentBar: "bg-duello",
  },
];

/**
 * Küçük boyutta da okunan çizgi illüstrasyonlar.
 * Düello: açıkça kılıç (X değil). Test: kalem gövdesi + uç + tik.
 */
function Illu({ id, className }: { id: AdimId; className?: string }) {
  if (id === "kart") {
    return (
      <svg viewBox="0 0 48 56" className={className} fill="none" aria-hidden>
        {/* arka kart */}
        <rect x="14" y="6" width="26" height="36" rx="3" stroke="currentColor" strokeWidth="1.8" opacity="0.45" />
        {/* ön kart */}
        <rect x="8" y="12" width="26" height="36" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M14 22h14M14 28h10M14 34h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      </svg>
    );
  }

  if (id === "test") {
    return (
      <svg viewBox="0 0 48 56" className={className} fill="none" aria-hidden>
        {/* kalem gövdesi (yatay değil, hafif eğik) */}
        <path
          d="M18 44 L18 20 L24 12 L30 20 L30 44 Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* metal halka */}
        <path d="M18 22h12" stroke="currentColor" strokeWidth="1.5" />
        {/* uç üçgen */}
        <path d="M24 12 L20 6 L28 6 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        {/* kırık çizgi */}
        <path d="M22 8 L26 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
        {/* tik — kalemin sağında net */}
        <path
          d="M32 30 L36 34 L44 22"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Düello — klasik çapraz kılıçlar (tüy/X değil)
  return (
    <svg viewBox="0 0 48 56" className={className} fill="none" aria-hidden>
      {/* kılıç 1 */}
      <path d="M14 42 L34 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* kabza 1 */}
      <path d="M12 40 L16 44" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M10 44 L18 40" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* sivri uç 1 */}
      <path d="M34 14 L32 10 L36 12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />

      {/* kılıç 2 */}
      <path d="M34 42 L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* kabza 2 */}
      <path d="M32 40 L36 44" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M30 44 L38 40" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* sivri uç 2 */}
      <path d="M14 14 L12 10 L16 12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
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
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-6">
        <div className="flex w-full max-w-[20rem] flex-col items-center">
          <div
            className={`mb-6 grid h-[4.75rem] w-[4rem] place-items-center rounded-md border ${mevcut.kutu} ${mevcut.etiketRenk}`}
          >
            <Illu id={mevcut.id} className="h-11 w-10" />
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

          <p className="mt-3.5 text-pretty text-center text-[14px] leading-relaxed text-muted-foreground">
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
