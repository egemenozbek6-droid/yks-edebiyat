"use client";

import { useEffect, useState } from "react";
import { Swords, Layers, NotebookPen, X, type LucideIcon } from "lucide-react";

export type RuhHali = {
  id: string;
  emoji: string;
  etiket: string;
  mesaj: string;
};

type HedefMod = "kart" | "test" | "duelo";

type Yonlendirme = {
  mod: HedefMod;
  etiket: string;
  ikon: LucideIcon;
  sinif: string;
};

type Mesaj = {
  metin: string;
  yonlendirme?: Yonlendirme;
};

type Duygu = {
  id: string;
  etiket: string;
  emoji: string;
  kartSinif: string;
  mesajlar: Mesaj[];
};

const KART: Yonlendirme = {
  mod: "kart",
  etiket: "Kartlara Git",
  ikon: Layers,
  sinif: "bg-teal-600 shadow-teal-600/25 hover:brightness-110",
};
const TEST: Yonlendirme = {
  mod: "test",
  etiket: "Teste Git",
  ikon: NotebookPen,
  sinif: "bg-violet-600 shadow-violet-600/25 hover:brightness-110",
};
const DUELLO: Yonlendirme = {
  mod: "duelo",
  etiket: "Düelloya Gir",
  ikon: Swords,
  sinif: "bg-red-600 shadow-red-600/25 hover:brightness-110",
};

const duyguHavuzu: Duygu[] = [
  {
    id: "formdayim",
    etiket: "Formdayım",
    emoji: "🔥",
    kartSinif: "hover:ring-emerald-500/40 hover:bg-emerald-500/10",
    mesajlar: [
      {
        metin: "Formun yerinde. Bu enerjiyi düelloda boşa harcama — bir maç aç.",
        yonlendirme: DUELLO,
      },
      {
        metin: "Güçlü gün. ÖSYM Sever veya dönem testiyle netlerini ölç.",
        yonlendirme: TEST,
      },
      { metin: "Hazırsın. Kısa bir kart turu + bir test, bugünü kapatır." },
      {
        metin: "Zirve form. Ranked düello seni bekliyor.",
        yonlendirme: DUELLO,
      },
    ],
  },
  {
    id: "odak",
    etiket: "Odaklıyım",
    emoji: "🎯",
    kartSinif: "hover:ring-sky-500/40 hover:bg-sky-500/10",
    mesajlar: [
      {
        metin: "Odak varken kartlar altın değerinde. Kutu 1’den ilerle.",
        yonlendirme: KART,
      },
      {
        metin: "Sessiz ve net. 10–15 kart; bildiklerini üst kutuya at.",
        yonlendirme: KART,
      },
      {
        metin: "Bu tempo test için ideal. Tek bir dönem seç, bitir.",
        yonlendirme: TEST,
      },
      { metin: "Dağılma. Bir deste seç, yarım saat sadece ona bak." },
    ],
  },
  {
    id: "daginik",
    etiket: "Dağınık",
    emoji: "🌥",
    kartSinif: "hover:ring-amber-500/40 hover:bg-amber-500/10",
    mesajlar: [
      {
        metin: "Kafa dağınıksa yeni konu açma. Tekrar Köşen veya Kutu 1 yeter.",
        yonlendirme: TEST,
      },
      {
        metin: "Beş kart. Sadece beş. Dağınıklığı küçük bir turla topla.",
        yonlendirme: KART,
      },
      {
        metin: "Uzun test bugün değil. Kısa bir ÖSYM Sever turu dene.",
        yonlendirme: TEST,
      },
      { metin: "Telefonu bir kenara bırak, tek ekran: EdebiKart. 10 dakika." },
    ],
  },
  {
    id: "yorgun",
    etiket: "Yorgunum",
    emoji: "🌙",
    kartSinif: "hover:ring-orange-500/40 hover:bg-orange-500/10",
    mesajlar: [
      {
        metin: "Bugün kahramanlık yok. Üç kart yeter; Kutu 1’den bak.",
        yonlendirme: KART,
      },
      {
        metin: "Yorgunken düello stres yapar. Hafif kart tekrarı daha iyi.",
        yonlendirme: KART,
      },
      { metin: "Pil bitikse 5 dakika, 3 soru. Sonra bırakman da caiz." },
      {
        metin: "Dinlenmek de plan. Ama yatmadan önce tek bir kart aç.",
        yonlendirme: KART,
      },
    ],
  },
  {
    id: "motive",
    etiket: "Motive",
    emoji: "⚡",
    kartSinif: "hover:ring-violet-500/40 hover:bg-violet-500/10",
    mesajlar: [
      {
        metin: "Motivasyon varken bankoları ez. ÖSYM Sever’e gir.",
        yonlendirme: TEST,
      },
      {
        metin: "İstek gelmişken dönem testiyle eksiğini görünür kıl.",
        yonlendirme: TEST,
      },
      {
        metin: "Bu ateşle ranked’e girmek de caiz — EP kap.",
        yonlendirme: DUELLO,
      },
      {
        metin: "Motive gün: kart + kısa test kombosu. Erteleme.",
        yonlendirme: KART,
      },
    ],
  },
];

const ANAHTAR = "edebikart-ruh-hali";

function bugun() {
  return new Date().toISOString().slice(0, 10);
}

function rastgeleMesaj(havuz: Mesaj[]): Mesaj {
  return havuz[Math.floor(Math.random() * havuz.length)]!;
}

type Props = {
  onSecim: (ruhHali: RuhHali) => void;
  onKapat: () => void;
  onModSec: (mod: HedefMod) => void;
};

export default function RuhHaliModal({ onSecim, onKapat, onModSec }: Props) {
  const [acik, setAcik] = useState(false);
  const [secilen, setSecilen] = useState<RuhHali | null>(null);
  const [secilenYonlendirme, setSecilenYonlendirme] = useState<Yonlendirme | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kaydet = () => {
    try {
      window.localStorage.setItem(ANAHTAR, bugun());
    } catch {
      /* sessiz */
    }
  };

  const kapat = () => {
    kaydet();
    setAcik(false);
    onKapat();
  };

  const sec = (duygu: Duygu) => {
    kaydet();
    const mesaj = rastgeleMesaj(duygu.mesajlar);
    const ruhHali: RuhHali = {
      id: duygu.id,
      emoji: duygu.emoji,
      etiket: duygu.etiket,
      mesaj: mesaj.metin,
    };
    setSecilenYonlendirme(mesaj.yonlendirme ?? null);
    setSecilen(ruhHali);
    onSecim(ruhHali);
  };

  const yonlendir = (hedefMod: HedefMod) => {
    kaydet();
    setAcik(false);
    onKapat();
    onModSec(hedefMod);
  };

  if (!acik) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Bugün çalışma halin nasıl?"
    >
      <div className="w-full max-w-md animate-pop rounded-3xl border border-border bg-card p-6 shadow-2xl ring-1 ring-white/5">
        {secilen ? (
          <div className="py-2 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-muted/80 ring-1 ring-border">
              <span className="text-3xl leading-none" aria-hidden>
                {secilen.emoji}
              </span>
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {secilen.etiket}
            </p>
            <p className="mt-3 text-balance font-serif text-lg font-bold leading-snug text-card-foreground">
              {secilen.mesaj}
            </p>

            {secilenYonlendirme && (
              <button
                onClick={() => yonlendir(secilenYonlendirme.mod)}
                className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition active:scale-[0.98] ${secilenYonlendirme.sinif}`}
              >
                <secilenYonlendirme.ikon className="h-4 w-4" strokeWidth={2} />
                {secilenYonlendirme.etiket}
              </button>
            )}

            <button
              onClick={kapat}
              className="mt-3 w-full rounded-xl py-2.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              Ana ekrana geç
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl font-bold leading-tight text-card-foreground">
                  Bugün nasılsın?
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Haline göre kısa bir rota önereceğiz.
                </p>
              </div>
              <button
                onClick={kapat}
                className="rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-5 gap-2">
              {duyguHavuzu.map((d) => (
                <button
                  key={d.id}
                  onClick={() => sec(d)}
                  className={`flex flex-col items-center gap-2 rounded-2xl border border-border/80 bg-muted/40 px-1 py-3.5 ring-1 ring-transparent transition active:scale-[0.96] ${d.kartSinif}`}
                >
                  <span className="text-[1.65rem] leading-none" aria-hidden>
                    {d.emoji}
                  </span>
                  <span className="text-center text-[10px] font-semibold leading-tight text-muted-foreground">
                    {d.etiket}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={kapat}
              className="mt-5 w-full rounded-xl py-2.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              Atla, direkt başla
            </button>
          </>
        )}
      </div>
    </div>
  );
}
