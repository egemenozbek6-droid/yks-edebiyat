"use client";

import { useState } from "react";
import { Layers, NotebookPen, Swords } from "lucide-react";

const ADIMLAR = [
  {
    id: "kart",
    etiket: "Kartlar",
    ikon: Layers,
    kutu: "border-teal-500/30 bg-teal-500/10",
    ikonRenk: "text-teal-400",
    buton: "bg-teal-600",
    baslik: "Kartı çevir",
    metin:
      "Ön yüzde eser, arkada yazar. Biliyorsan Kaptım — kart üst kutuya çıkar. Takıldıysan Tekrar Et, aynı kart geri gelir. Sağa sola basarak desteyi gezersin.",
  },
  {
    id: "test",
    etiket: "Test",
    ikon: NotebookPen,
    kutu: "border-violet-500/30 bg-violet-500/10",
    ikonRenk: "text-violet-400",
    buton: "bg-violet-600",
    baslik: "Yanlışın kaybolmaz",
    metin:
      "Dönem testleri, ÖSYM Sever, eser-kahraman, batı akımları Test sekmesinde. Kaçırdığın soru Tekrar Köşen’e düşer. Oradan tekrar çözersin, net oradan toparlanır.",
  },
  {
    id: "duelo",
    etiket: "Düello",
    ikon: Swords,
    kutu: "border-red-500/30 bg-red-500/10",
    ikonRenk: "text-red-400",
    buton: "bg-red-600",
    baslik: "Zirveye düello atarak çıkarsın",
    metin:
      "Canlı rakip veya oda koduyla arkadaşın. Kazanınca EP gelir, rütbe atarsın. Prestij avatar da maçtan açılır. Lig buradan yürür.",
  },
] as const;

type Props = {
  onBitti: () => void;
};

export default function OnboardingEkran({ onBitti }: Props) {
  const [adim, setAdim] = useState(0);
  const mevcut = ADIMLAR[adim];
  const Ikon = mevcut.ikon;
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
        <div
          className={`mb-7 grid h-[4.5rem] w-[4.5rem] place-items-center rounded-2xl border ${mevcut.kutu}`}
        >
          <Ikon className={`h-8 w-8 ${mevcut.ikonRenk}`} strokeWidth={1.6} />
        </div>

        <p className={`mb-2 text-[11px] font-semibold ${mevcut.ikonRenk}`}>
          {mevcut.etiket}
        </p>

        <h2 className="text-balance text-center text-[1.7rem] font-bold leading-tight text-white">
          {mevcut.baslik}
        </h2>

        <p className="mt-4 max-w-[34ch] text-pretty text-center text-[14px] leading-relaxed text-white/55">
          {mevcut.metin}
        </p>
      </div>

      <div className="px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mb-5 flex items-center justify-center gap-2">
          {ADIMLAR.map((a, i) => (
            <span
              key={a.id}
              className={`h-1.5 rounded-full ${
                i === adim ? `w-5 ${mevcut.buton}` : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBitti}
            className="w-20 py-3.5 text-sm font-medium text-white/40"
          >
            Atla
          </button>
          <button
            onClick={() => (sonMu ? onBitti() : setAdim((n) => n + 1))}
            className={`flex-1 rounded-2xl py-3.5 text-[15px] font-bold text-white ${mevcut.buton}`}
          >
            {sonMu ? "Hadi başla" : "Devam"}
          </button>
        </div>
      </div>
    </div>
  );
}
