"use client";

import { useState } from "react";

type AdimId = "kart" | "test" | "duelo";

const ADIMLAR: {
  id: AdimId;
  etiket: string;
  baslik: string;
  metin: string;
  /** mürekkep / kehribar / bordo */
  accent: string;
  accentSoft: string;
  accentRing: string;
  buton: string;
  cta: string;
}[] = [
  {
    id: "kart",
    etiket: "Kartlar",
    baslik: "Ön yüz eser, arka yüz yazar",
    metin:
      "Kartı çevir. Biliyorsan Kaptım — üst kutuya çıkar. Takıldıysan Tekrar Et, aynı kart geri gelir. Sağa sola basarak desteyi gezersin.",
    accent: "#C9A227",
    accentSoft: "rgba(201,162,39,0.12)",
    accentRing: "rgba(201,162,39,0.35)",
    buton: "bg-[#C9A227] text-[#0B0F17]",
    cta: "Devam",
  },
  {
    id: "test",
    etiket: "Test",
    baslik: "Yanlışın kaybolmaz",
    metin:
      "Dönem, ÖSYM Sever, eser–kahraman, akımlar… Kaçırdığın soru Tekrar Köşen’e düşer. Oradan tekrar çözersin; net oradan toparlanır.",
    accent: "#8B7EC8",
    accentSoft: "rgba(139,126,200,0.12)",
    accentRing: "rgba(139,126,200,0.35)",
    buton: "bg-[#8B7EC8] text-white",
    cta: "Devam",
  },
  {
    id: "duelo",
    etiket: "Düello",
    baslik: "EP ile lig yürür",
    metin:
      "Canlı rakip veya oda koduyla arkadaşın. Kazanınca EP gelir, rütbe atarsın. Prestij avatar maçtan açılır — lig buradan ilerler.",
    accent: "#B33A3A",
    accentSoft: "rgba(179,58,58,0.12)",
    accentRing: "rgba(179,58,58,0.35)",
    buton: "bg-[#B33A3A] text-white",
    cta: "Hadi başla",
  },
];

/** İnce çizgi illüstrasyonlar — Lucide kutu yok */
function Illu({ id, color }: { id: AdimId; color: string }) {
  if (id === "kart") {
    return (
      <svg viewBox="0 0 80 96" className="h-16 w-14" fill="none" aria-hidden>
        {/* kütüphane fişi */}
        <rect
          x="14"
          y="10"
          width="44"
          height="68"
          rx="3"
          stroke={color}
          strokeWidth="1.6"
          transform="rotate(-8 36 44)"
        />
        <path
          d="M22 28h28M22 38h22M22 48h26"
          stroke={color}
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.7"
          transform="rotate(-8 36 44)"
        />
        {/* tüy kalem */}
        <path
          d="M52 62 L68 22"
          stroke={color}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M68 22 l-6 2 2 6"
          stroke={color}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M52 62 l4-1 -1 4" stroke={color} strokeWidth="1.3" />
      </svg>
    );
  }
  if (id === "test") {
    return (
      <svg viewBox="0 0 80 96" className="h-16 w-14" fill="none" aria-hidden>
        {/* kurşun kalem gövde */}
        <path
          d="M28 72 L28 28 L40 18 L52 28 L52 72 Z"
          stroke={color}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M28 28 L52 28" stroke={color} strokeWidth="1.4" />
        {/* kırık uç */}
        <path
          d="M40 18 L36 10 M40 18 L44 10"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* tik */}
        <path
          d="M34 52 L40 58 L50 44"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  // duelo — çapraz tüy kalemler
  return (
    <svg viewBox="0 0 80 96" className="h-16 w-14" fill="none" aria-hidden>
      <path
        d="M18 70 L58 22"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M58 22 l-6 1 1 6"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M62 70 L22 22"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M22 22 l6 1 -1 6"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="40" cy="46" r="5" stroke={color} strokeWidth="1.4" opacity="0.8" />
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
      className="fixed inset-0 z-[80] flex flex-col"
      style={{ background: "#0B0F17" }}
      role="dialog"
      aria-modal="true"
      aria-label="EdebiKart tanıtım"
    >
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        {/* Fiş / mühür alanı */}
        <div
          className="mb-8 grid place-items-center rounded-md px-5 py-6"
          style={{
            background: mevcut.accentSoft,
            boxShadow: `0 0 0 1px ${mevcut.accentRing}`,
          }}
        >
          <Illu id={mevcut.id} color={mevcut.accent} />
        </div>

        <p
          className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: mevcut.accent }}
        >
          {mevcut.etiket}
        </p>

        <h2 className="font-serif text-balance text-center text-[1.65rem] font-bold leading-snug tracking-tight text-white">
          {mevcut.baslik}
        </h2>

        <p className="mt-4 max-w-[34ch] text-pretty text-center text-[14px] leading-relaxed text-white/55">
          {mevcut.metin}
        </p>
      </div>

      <div className="px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {/* Fiş ilerleme */}
        <div className="mb-5 flex flex-col items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
            Fiş {adim + 1} / {ADIMLAR.length}
          </p>
          <div className="flex w-full max-w-[200px] gap-1.5">
            {ADIMLAR.map((a, i) => (
              <span
                key={a.id}
                className="h-[3px] flex-1 rounded-full transition-colors"
                style={{
                  background: i <= adim ? mevcut.accent : "rgba(255,255,255,0.12)",
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBitti}
            className="w-[4.5rem] py-3.5 text-sm font-medium text-white/40 transition hover:text-white/60"
          >
            Atla
          </button>
          <button
            type="button"
            onClick={() => (sonMu ? onBitti() : setAdim((n) => n + 1))}
            className={`flex-1 rounded-lg py-3.5 text-[15px] font-bold tracking-wide transition hover:brightness-110 active:scale-[0.99] ${mevcut.buton}`}
          >
            {mevcut.cta}
          </button>
        </div>
      </div>
    </div>
  );
}
