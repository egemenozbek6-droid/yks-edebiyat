"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

type Adim = {
  id: string;
  no: string;
  renk: string;
  cizgi: string;
  baslik: string;
  madde: string[];
  onizleme: "kart" | "test" | "duelo";
};

const ADIMLAR: Adim[] = [
  {
    id: "kart",
    no: "01",
    renk: "text-teal-400",
    cizgi: "bg-teal-500",
    baslik: "Kartı çevir, sağa sola at",
    madde: [
      "Ön yüzde eser durur. Dokun, arkada yazarı görürsün.",
      "Biliyorsan “Kaptım” — kart bir üst kutuya çıkar.",
      "Takıldıysan “Tekrar Et” — aynı kart başa döner, kaybolmaz.",
    ],
    onizleme: "kart",
  },
  {
    id: "test",
    no: "02",
    renk: "text-violet-400",
    cizgi: "bg-violet-500",
    baslik: "Yanlışın burada durur",
    madde: [
      "Dönem, ÖSYM Sever, eser-kahraman, batı akımları — hepsi Test’te.",
      "Kaçırdığın soru Tekrar Köşen’e düşer. Silinmez.",
      "Oradan tekrar çöz, netin oradan toparlanır.",
    ],
    onizleme: "test",
  },
  {
    id: "duelo",
    no: "03",
    renk: "text-red-400",
    cizgi: "bg-red-500",
    baslik: "Zirveye çıkmak için düello at",
    madde: [
      "Canlı rakip bul veya oda koduyla arkadaşınla gir.",
      "Kazanınca EP gelir, rütbe atarsın. Lig oradan yürür.",
      "Prestij avatar da maçtan açılır — sıralamada yerin belli olur.",
    ],
    onizleme: "duelo",
  },
];

function Onizleme({ tur }: { tur: Adim["onizleme"] }) {
  if (tur === "kart") {
    return (
      <div className="mx-auto w-full max-w-[240px] rounded-2xl border border-white/10 bg-[#121820] p-4">
        <p className="text-center text-[10px] font-medium tracking-wide text-white/35">
          YAZARI GÖRMEK İÇİN DOKUN
        </p>
        <p className="mt-3 text-center text-lg font-bold text-white">Keşfü’z-Zünun</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/10 py-2 text-center text-[11px] font-semibold text-white/50">
            Tekrar Et
          </div>
          <div className="rounded-lg bg-teal-600 py-2 text-center text-[11px] font-semibold text-white">
            Kaptım
          </div>
        </div>
      </div>
    );
  }

  if (tur === "test") {
    return (
      <div className="mx-auto w-full max-w-[240px] space-y-2">
        {[
          { ad: "ÖSYM Sever", rozet: "CANLI", renk: "bg-orange-500/20 text-orange-300" },
          { ad: "Tekrar Köşen", rozet: "yanlışlar", renk: "bg-violet-500/20 text-violet-300" },
          { ad: "Eser – Kahraman", rozet: "", renk: "" },
        ].map((x) => (
          <div
            key={x.ad}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-[#121820] px-3 py-2.5"
          >
            <span className="text-[12px] font-semibold text-white/85">{x.ad}</span>
            {x.rozet ? (
              <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${x.renk}`}>
                {x.rozet}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[240px] rounded-2xl border border-red-500/20 bg-[#121820] p-4">
      <div className="flex items-center justify-between text-[11px] text-white/50">
        <span>SEN</span>
        <span className="font-bold text-white/30">VS</span>
        <span>RAKİP</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-2/3 rounded-full bg-red-500" />
      </div>
      <p className="mt-4 text-center text-[12px] font-medium text-white/70">
        10 soru · süre işler · EP kap
      </p>
    </div>
  );
}

type Props = {
  onBitti: () => void;
};

export default function OnboardingEkran({ onBitti }: Props) {
  const [adim, setAdim] = useState(0);
  const mevcut = ADIMLAR[adim]!;
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
      <div className={`h-1 ${mevcut.cizgi}`} />

      <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-4 pt-8">
        <p className={`text-[12px] font-bold tracking-widest ${mevcut.renk}`}>
          {mevcut.no}
          <span className="ml-2 font-medium text-white/30">/ 03</span>
        </p>

        <h2 className="mt-3 max-w-[18ch] text-[1.7rem] font-bold leading-[1.15] tracking-tight text-white">
          {mevcut.baslik}
        </h2>

        <ul className="mt-5 space-y-2.5">
          {mevcut.madde.map((m) => (
            <li key={m} className="flex gap-2.5 text-[13.5px] leading-snug text-white/65">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${mevcut.cizgi}`} />
              {m}
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <Onizleme tur={mevcut.onizleme} />
        </div>
      </div>

      <div className="px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
        <div className="mb-4 flex gap-1">
          {ADIMLAR.map((a, i) => (
            <span
              key={a.id}
              className={`h-0.5 flex-1 rounded-full ${i <= adim ? mevcut.cizgi : "bg-white/12"}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBitti}
            className="px-2 py-3.5 text-sm font-medium text-white/40"
          >
            Atla
          </button>
          <button
            onClick={ileri}
            className={`flex flex-1 items-center justify-center gap-1 rounded-2xl py-3.5 text-[15px] font-bold text-white ${mevcut.cizgi}`}
          >
            {sonMu ? "Hadi başla" : "Devam"}
            {!sonMu && <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
