"use client";

import { useEffect, useState } from "react";
import { Battery, BatteryLow, BatteryMedium, BatteryWarning, Rocket, Swords, Target, X, type LucideIcon } from "lucide-react";

export type RuhHali = {
  id: string;
  emoji: string;
  etiket: string;
  mesaj: string;
};

type HedefMod = "osym" | "duelo";

type Yonlendirme = {
  mod: HedefMod;
  etiket: string;
  ikon: LucideIcon;
};

type Mesaj = {
  metin: string;
  // Sadece mesaj içinde düello/ÖSYMsever'den bahsedildiğinde doldur.
  // Boş bırakılırsa buton çıkmaz.
  yonlendirme?: Yonlendirme;
};

type Duygu = {
  id: string;
  etiket: string;
  ikon: LucideIcon;
  ikonSinif: string;
  mesajlar: Mesaj[];
};

const DUELLO: Yonlendirme = { mod: "duelo", etiket: "Düelloya Gir", ikon: Swords };
const OSYMSEVER: Yonlendirme = { mod: "osym", etiket: "ÖSYMsever'e Git", ikon: Target };

const duyguHavuzu: Duygu[] = [
  {
    id: "harika",
    etiket: "Harika",
    ikon: Rocket,
    ikonSinif: "text-emerald-500",
    mesajlar: [
      { metin: "Süpermişsin, tamam. Git 30 soru çöz de görelim." },
      { metin: "Enerjin varmış, boşuna anlatma bana. Otur çalış." },
      { metin: "Aferin sana. Şimdi kanıtla, boş konuşma." },
      { metin: "Bu formla bahane üretirsen yazık olur valla." },
      { metin: "İyiymişsin. Telefonla mı geçecek bu iyilik, masada mı?" },
      {
        metin: "Bu formda kart falan az kalır, git düelloda birini ez geç.",
        yonlendirme: DUELLO,
      },
      {
        metin: "Nadir moddasın, ziyan etme. Düelloya gir de rütbe kap.",
        yonlendirme: DUELLO,
      },
    ],
  },
  {
    id: "notr",
    etiket: "Nötr",
    ikon: BatteryMedium,
    ikonSinif: "text-sky-500",
    mesajlar: [
      { metin: "Sıradan bir gündesin. Sıradan insan da soru çözer, hadi." },
      { metin: "Nötr olmak bahane değil. Bir kart aç." },
      { metin: "Bu tam da hiçbir şey yapmama bahanesi, kanma." },
      { metin: "Ne isteklisin ne tembel, o yüzden bahanen de yok." },
      { metin: "İdare eder diyorsun, idare etmek zaten yeter. Kalk." },
      {
        metin: "Ortalamasın, tamam. O zaman ÖSYMsever'den gerçek sorularla bir bak.",
        yonlendirme: OSYMSEVER,
      },
      {
        metin: "Özel bir şey beklemiyorum senden. ÖSYMsever'de birkaç gerçek soru çöz yeter.",
        yonlendirme: OSYMSEVER,
      },
    ],
  },
  {
    id: "ehiste",
    etiket: "Eh İşte",
    ikon: Battery,
    ikonSinif: "text-amber-500",
    mesajlar: [
      { metin: "Eh işte, klasik. Telefonu bari bırak." },
      { metin: "Şevk bekleyerek kaç gün geçti, saydın mı?" },
      { metin: "Mükemmel bahane bulma noktasındasın, bulma." },
      { metin: "Kahve iç, ne yaparsan yap, 20 dakikaya kart aç." },
      { metin: "Kanepeye yapışırsın biliyorum, bugün yapma." },
      {
        metin: "Şevkin yoksa düelloya gir, kaybetme hırsı seni uyandırır.",
        yonlendirme: DUELLO,
      },
      {
        metin: "Yarım gazsan bile düelloda biri seni yenerse enerjin gelir, dene.",
        yonlendirme: DUELLO,
      },
    ],
  },
  {
    id: "stresli",
    etiket: "Stresli",
    ikon: BatteryWarning,
    ikonSinif: "text-orange-500",
    mesajlar: [
      { metin: "Kafan dağınık, tamam. Panikle soru çözülmüyor, sakin." },
      { metin: "Herkes stresli, seni özel yapmıyor bu." },
      { metin: "Mucize beklemiyorum senden, küçük adım yeter." },
      { metin: "Stres yakıyor seni, motive etmiyor. Beş dakika mola." },
      { metin: "Ağlamak yerine tek konuya kilitlen, geç bunu." },
      {
        metin: "Rakip baskısı istemiyorsan ÖSYMsever'den kendi hızında birkaç soru çöz.",
        yonlendirme: OSYMSEVER,
      },
      {
        metin: "Tek ihtiyacın olan şey bir sonraki soru. ÖSYMsever'den gerçek bir tane seç.",
        yonlendirme: OSYMSEVER,
      },
    ],
  },
  {
    id: "bitik",
    etiket: "Bitik",
    ikon: BatteryLow,
    ikonSinif: "text-red-500",
    mesajlar: [
      { metin: "Pilin bitmiş, kahramanlık yok. Küçük bir şey yeter." },
      { metin: "Yatakta telefonla kaybolmak dinlenmek değil." },
      { metin: "Bitkinsin, o zaman 5 soru bile zafer sayılır." },
      { metin: "Dipteyse enerjin, bir bardak su iç, sonra bak." },
      { metin: "Dinlen bugün, ama yarın bahane olmasın bu." },
      {
        metin: "Düello için enerjin yok biliyorum, ÖSYMsever'den 2 dakikalık bir şey dene.",
        yonlendirme: OSYMSEVER,
      },
      {
        metin: "Kanepeye tam yapışmadan ÖSYMsever'den bir soru bak bari.",
        yonlendirme: OSYMSEVER,
      },
    ],
  },
];

const ANAHTAR = "yks-edebiyat-ruh-hali";

function bugun() {
  return new Date().toISOString().slice(0, 10);
}

function rastgeleMesaj(havuz: Mesaj[]): Mesaj {
  return havuz[Math.floor(Math.random() * havuz.length)];
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
    const mesaj = rastgeleMesaj(duygu.mesajlar);
    const ruhHali: RuhHali = {
      id: duygu.id,
      emoji: "",
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
    onModSec(hedefMod);
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

            {secilenYonlendirme && (
              <button
                onClick={() => yonlendir(secilenYonlendirme.mod)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]"
              >
                <secilenYonlendirme.ikon className="h-4 w-4" strokeWidth={2} />
                {secilenYonlendirme.etiket}
              </button>
            )}

            <button
              onClick={gec}
              className="mt-3 w-full rounded-xl py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              Hadi, EdebiKart'a dalalım!
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-serif text-2xl font-bold leading-tight text-balance text-card-foreground">
                Naber, bugün moralin nasıl?
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
              Boşver, direkt başlayayım
            </button>
          </>
        )}
      </div>
    </div>
  );
}
