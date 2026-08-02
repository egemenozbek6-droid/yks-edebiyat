"use client";

import { useEffect, useState } from "react";
import { Battery, BatteryLow, BatteryMedium, BatteryWarning, Rocket, X, type LucideIcon } from "lucide-react";

export type RuhHali = {
  id: string;
  emoji: string;
  etiket: string;
  mesaj: string;
};

type Duygu = {
  id: string;
  etiket: string;
  ikon: LucideIcon;
  ikonSinif: string;
  mesajlar: string[];
};

const duyguHavuzu: Duygu[] = [
  {
    id: "harika",
    etiket: "Harika",
    ikon: Rocket,
    ikonSinif: "text-emerald-500",
    mesajlar: [
      "Enerjin harika! Bu modla bugün soru kaçırmazsın, hadi dersin başına!",
      "Harika hissetmen süper! Tam odaklanıp verim alma vakti.",
    ],
  },
  {
    id: "notr",
    etiket: "Nötr",
    ikon: BatteryMedium,
    ikonSinif: "text-sky-500",
    mesajlar: [
      "Sakin bir gün. Ne iyi ne kötü. Rutinini bozma, ufaktan başla gerisi gelir.",
      "Nötr günler istikrar günüdür. Modun geldikçe tempoyu artırırsın.",
    ],
  },
  {
    id: "ehiste",
    etiket: "Eh İşte",
    ikon: Battery,
    ikonSinif: "text-amber-500",
    mesajlar: [
      "Bazen sadece günü kurtarmak gerekir. Kendini çok sıkma, azar azar ilerle.",
      "Arada böyle modlar olur, sorun değil. Ufak bir kahve molası verip tekrar bak istersen.",
    ],
  },
  {
    id: "stresli",
    etiket: "Stresli",
    ikon: BatteryWarning,
    ikonSinif: "text-orange-500",
    mesajlar: [
      "Derin bir nefes al. Sınav maratonunda bu baskı çok normal, sen elinden geleni yapıyorsun.",
      "Kafan dolu ve gergin olabilirsin. Şöyle bir zihnini boşalt, tek bir karta odaklanıp adım adım gidelim.",
    ],
  },
  {
    id: "bitik",
    etiket: "Bitik",
    ikon: BatteryLow,
    ikonSinif: "text-red-500",
    mesajlar: [
      "Pil bitmiş gibi mi? Bugün kendine yüklenme, sadece yapabildiğin kadarını yap.",
      "Bazen dinlenmek de çalışmanın bir parçasıdır. Gerekirse biraz ara ver, dinlen.",
    ],
  },
];

const ANAHTAR = "yks-edebiyat-ruh-hali";

function bugun() {
  return new Date().toISOString().slice(0, 10);
}

function rastgeleMesaj(havuz: string[]): string {
  return havuz[Math.floor(Math.random() * havuz.length)];
}

type Props = {
  onSecim: (ruhHali: RuhHali) => void;
  onKapat: () => void;
};

export default function RuhHaliModal({ onSecim, onKapat }: Props) {
  const [acik, setAcik] = useState(false);
  const [secilen, setSecilen] = useState<RuhHali | null>(null);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(ANAHTAR) !== bugun()) {
        setAcik(true);
      } else {
        onKapat();
      }
    } catch {
      setAcik(true);
    }
  }, []);

  const kaydet = () => {
    try {
      window.localStorage.setItem(ANAHTAR, bugun());
    } catch {
      /* localStorage kullanılamıyorsa sessizce geç */
    }
  };

  const gec = () => {
    kaydet();
    setAcik(false);
    onKapat();
  };

  const sec = (duygu: Duygu) => {
    kaydet();
    const ruhHali: RuhHali = {
      id: duygu.id,
      emoji: "",
      etiket: duygu.etiket,
      mesaj: rastgeleMesaj(duygu.mesajlar),
    };
    setSecilen(ruhHali);
    onSecim(ruhHali);
    window.setTimeout(() => setAcik(false), 2600);
  };

  if (!acik) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/45 p-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Bugün nasıl hissediyorsun?"
    >
      <div className="w-full max-w-md animate-pop rounded-3xl bg-card p-7 ring-1 ring-border shadow-2xl">
        {secilen ? (
          <div className="py-4 text-center">
            {(() => {
              const d = duyguHavuzu.find((x) => x.id === secilen.id);
              if (!d) return null;
              const Ikon = d.ikon;
              return (
                <div className={`mx-auto mb-5 grid h-20 w-20 animate-pop place-items-center rounded-3xl bg-primary/10 ring-1 ring-primary/20 ${d.ikonSinif}`}>
                  <Ikon className="h-9 w-9" strokeWidth={1.5} />
                </div>
              );
            })()}
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
              <h2 className="font-serif text-2xl font-bold leading-tight text-balance text-card-foreground">
                Bugün nasılsın?
              </h2>
              <button
                onClick={gec}
                className="text-muted-foreground transition hover:text-foreground"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-5 gap-2">
              {duyguHavuzu.map((d) => {
                const Ikon = d.ikon;
                return (
                  <button
                    key={d.id}
                    onClick={() => sec(d)}
                    className="flex flex-col items-center gap-1.5 rounded-2xl bg-muted/70 px-1 py-3 ring-1 ring-border transition hover:bg-accent hover:ring-primary/40 active:scale-[0.96]"
                  >
                    <Ikon className={`h-7 w-7 ${d.ikonSinif}`} strokeWidth={1.5} />
                    <span className="text-[10px] font-semibold text-muted-foreground">{d.etiket}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={gec}
              className="mt-5 w-full rounded-xl py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              Şimdi değil, direkt çalışmaya başla
            </button>
          </>
        )}
      </div>
    </div>
  );
}
