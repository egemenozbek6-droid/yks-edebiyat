"use client";

import { useState } from "react";
import { Layers, NotebookPen, Swords, ChevronRight } from "lucide-react";

type Adim = {
  id: string;
  ikon: typeof Layers;
  ikonKutu: string;
  ikonRenk: string;
  baslik: string;
  metin: string;
};

const ADIMLAR: Adim[] = [
  {
    id: "kart",
    ikon: Layers,
    ikonKutu: "bg-teal-500/10 border-teal-500/30",
    ikonRenk: "text-teal-400",
    baslik: "Öğren, kutuya at",
    metin:
      "Eser ve yazarları kartlarla ezberle. Bildiğin “Kaptım” ile üst kutuya çıkar, unuttuğun “Tekrar Et” ile başa döner.",
  },
  {
    id: "test",
    ikon: NotebookPen,
    ikonKutu: "bg-violet-500/10 border-violet-500/30",
    ikonRenk: "text-violet-400",
    baslik: "Prova yap, eksiğini gör",
    metin:
      "Dönem testleri, ÖSYM Sever, eser-kahraman ve batı akımları. Yanlışların Tekrar Köşen’de birikir.",
  },
  {
    id: "duelo",
    ikon: Swords,
    ikonKutu: "bg-red-500/10 border-red-500/30",
    ikonRenk: "text-red-400",
    baslik: "Rakiple yarış, EP kazan",
    metin:
      "Canlı düello veya arkadaşınla özel oda. Galibiyetle rütbe ve prestij avatarları açılır.",
  },
];

type Props = {
  onBitti: () => void;
};

export default function OnboardingEkran({ onBitti }: Props) {
  const [adim, setAdim] = useState(0);
  const mevcut = ADIMLAR[adim]!;
  const Ikon = mevcut.ikon;
  const sonMu = adim === ADIMLAR.length - 1;

  const ileri = () => {
    if (sonMu) onBitti();
    else setAdim((a) => a + 1);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col"
      style={{ background: "#0B0F17" }}
      role="dialog"
      aria-modal="true"
      aria-label="EdebiKart tanıtım"
    >
      <div className="flex flex-1 flex-col items-center justify-center px-7 pb-8 pt-16">
        <div
          className={`mb-8 grid h-[4.75rem] w-[4.75rem] place-items-center rounded-2xl border ${mevcut.ikonKutu}`}
        >
          <Ikon className={`h-8 w-8 ${mevcut.ikonRenk}`} strokeWidth={1.6} />
        </div>

        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
          {adim + 1} / {ADIMLAR.length}
        </p>

        <h2 className="text-balance text-center text-[1.65rem] font-bold tracking-tight text-white">
          {mevcut.baslik}
        </h2>
        <p className="mt-3 max-w-sm text-pretty text-center text-sm leading-relaxed text-white/55">
          {mevcut.metin}
        </p>
      </div>

      <div className="px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mb-5 flex items-center justify-center gap-1.5">
          {ADIMLAR.map((a, i) => (
            <span
              key={a.id}
              className={`h-1.5 rounded-full transition-all ${
                i === adim ? "w-6 bg-teal-400" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-[1fr_1.4fr] gap-2.5">
          <button
            onClick={onBitti}
            className="rounded-xl py-3.5 text-sm font-semibold text-white/45 transition hover:text-white/80"
          >
            Atla
          </button>
          <button
            onClick={ileri}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:brightness-110 active:scale-[0.98]"
          >
            {sonMu ? "Başla" : "İleri"}
            {!sonMu && <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
