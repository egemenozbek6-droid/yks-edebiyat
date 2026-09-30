"use client";

import { useState } from "react";
import { Fraunces } from "next/font/google";
import { Swords } from "lucide-react";

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
    metin: "Dönemden ÖSYM’ye kadar soru çöz. Yanlışın Kaçırdıkların’a düşer, doğru yapınca çıkar.",
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

/** Kartlar: üst üste iki kart — net */
function IlluKart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 56" className={className} fill="none" aria-hidden>
      <rect x="14" y="8" width="24" height="32" rx="3" stroke="currentColor" strokeWidth="1.85" opacity="0.4" />
      <rect x="8" y="14" width="24" height="32" rx="3" stroke="currentColor" strokeWidth="1.85" />
      <path d="M14 24h12M14 30h9M14 36h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

/**
 * Test: A B C D şık listesi — şişe/kalem karışıklığı yok.
 * Bir şık dolu daire + tik ile seçilmiş.
 */
function IlluTest({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 56" className={className} fill="none" aria-hidden>
      {/* A — seçili */}
      <circle cx="12" cy="16" r="5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="16" r="2.2" fill="currentColor" />
      <path d="M20 16h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      {/* B */}
      <circle cx="12" cy="28" r="5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M20 28h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.7" />
      {/* C */}
      <circle cx="12" cy="40" r="5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M20 40h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.7" />
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
            {mevcut.id === "kart" && <IlluKart className="h-11 w-10" />}
            {mevcut.id === "test" && <IlluTest className="h-11 w-10" />}
            {mevcut.id === "duelo" && (
              <Swords className="h-9 w-9" strokeWidth={1.75} aria-hidden />
            )}
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
