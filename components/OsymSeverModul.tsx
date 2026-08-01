"use client";

import { useCallback, useState } from "react";
import { ArrowRight, Check, Flame, RotateCcw, X } from "lucide-react";
import IlerlemeBari from "@/components/IlerlemeBari";
import { osymSeverSorulari, type Soru } from "@/lib/soru";

export default function OsymSeverModul() {
  const [basladi, setBasladi] = useState(false);
  const [sorular, setSorular] = useState<Soru[]>([]);
  const [aktif, setAktif] = useState(0);
  const [secim, setSecim] = useState<string | null>(null);
  const [dogruSayi, setDogruSayi] = useState(0);
  const [bitti, setBitti] = useState(false);

  const basla = useCallback(() => {
    setSorular(osymSeverSorulari());
    setAktif(0);
    setSecim(null);
    setDogruSayi(0);
    setBitti(false);
    setBasladi(true);
  }, []);

  const cevapla = (secenek: string) => {
    if (secim) return;
    const soru = sorular[aktif];
    if (secenek === soru.dogru) setDogruSayi((s) => s + 1);
    setSecim(secenek);
  };

  const sonraki = () => {
    if (aktif + 1 >= sorular.length) {
      setBitti(true);
      return;
    }
    setAktif((a) => a + 1);
    setSecim(null);
  };

  // Giriş ekranı
  if (!basladi) {
    return (
      <div className="animate-rise">
        <div className="mb-6 rounded-[1.75rem] bg-card p-8 text-center shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)]">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-orange-500/15 text-orange-500 ring-1 ring-orange-500/30 animate-pop">
            <Flame className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-2xl font-bold text-balance text-card-foreground">ÖSYM Sever</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-pretty text-muted-foreground">
            ÖSYM'nin banko sorduğu yazar ve eserlerden karışık mini deneme. Dönem ayrımı yok — gerçek sınav gibi
            karışık gelir. Sadece "banko" olarak işaretlenmiş eserler kullanılır.
          </p>
        </div>

        <button
          onClick={basla}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-sm font-bold text-white shadow-md transition hover:brightness-110 active:scale-[0.98]"
        >
          <Flame className="h-4 w-4" /> Denemeyi Başlat
        </button>
      </div>
    );
  }

  // Sonuç ekranı
  if (bitti) {
    const oran = Math.round((dogruSayi / sorular.length) * 100);
    const basari = oran >= 80 ? "Süpersin!" : oran >= 60 ? "İyi gidiyorsun" : oran >= 40 ? "Gelişebilir" : "Tekrar çalış";
    return (
      <div className="animate-rise rounded-[1.75rem] bg-card p-9 text-center shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)]">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-orange-500/15 text-orange-500 ring-1 ring-orange-500/30 animate-pop">
          <Flame className="h-9 w-9" strokeWidth={1.5} />
        </div>
        <h2 className="font-serif text-2xl font-bold text-card-foreground">{basari}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {sorular.length} soruda <span className="font-bold text-orange-500">{dogruSayi}</span> doğru — %{oran}
        </p>
        <div className="mt-6">
          <IlerlemeBari mevcut={dogruSayi} toplam={sorular.length} etiket="Doğru cevap" />
        </div>
        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            onClick={basla}
            className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110 active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4" /> Tekrar Çöz
          </button>
          <button
            onClick={() => setBasladi(false)}
            className="rounded-2xl bg-card py-3.5 text-sm font-semibold text-muted-foreground shadow-sm transition hover:text-foreground hover:ring-orange-500/40 active:scale-[0.98]"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  // Soru ekranı
  const soru = sorular[aktif];

  return (
    <div className="animate-rise">
      <div className="mb-6 rounded-3xl bg-card/70 p-4 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] backdrop-blur">
        <IlerlemeBari
          mevcut={aktif + (secim ? 1 : 0)}
          toplam={sorular.length}
          etiket="Soru"
          sagEtiket={`${aktif + 1} / ${sorular.length} · ${dogruSayi} doğru`}
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-orange-500">
            <Flame className="h-3.5 w-3.5" /> Banko soru
          </span>
          <button
            onClick={() => setBasladi(false)}
            className="text-[11px] font-semibold text-muted-foreground transition hover:text-foreground"
          >
            Çıkış
          </button>
        </div>
      </div>

      <div className="rounded-[1.75rem] bg-card p-7 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)]">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {soru.tip === "eser" ? "Yazarın eseri" : "Eserin yazarı"}
          </p>
          {soru.osymFreq && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-[10px] font-bold text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/30">
              <Flame className="h-3 w-3" strokeWidth={2} />
              {soru.osymFreq}
            </span>
          )}
        </div>
        <h2 className="mt-2 font-serif text-2xl font-bold leading-snug text-balance text-card-foreground">
          {soru.vurgu}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{soru.metin}</p>

        <div className="mt-6 space-y-2.5">
          {soru.secenekler.map((secenek, i) => {
            const secildi = secim === secenek;
            const dogruSecenek = secenek === soru.dogru;
            const gosterDogru = secim !== null && dogruSecenek;
            const gosterYanlis = secildi && !dogruSecenek;

            let stil =
              "bg-card ring-border text-card-foreground hover:ring-orange-500/40 hover:bg-muted/60";
            if (gosterDogru) stil = "bg-emerald-500/15 ring-emerald-500/60 text-emerald-700 dark:text-emerald-300";
            else if (gosterYanlis) stil = "bg-destructive/15 ring-destructive/60 text-destructive";
            else if (secim !== null) stil = "bg-card ring-border text-muted-foreground opacity-60";

            return (
              <button
                key={secenek}
                onClick={() => cevapla(secenek)}
                disabled={secim !== null}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-sm font-semibold ring-1 transition-all duration-200 ${stil} ${
                  gosterYanlis ? "animate-shake" : ""
                } ${gosterDogru ? "animate-pop" : ""} ${secim === null ? "active:scale-[0.99]" : ""}`}
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                    gosterDogru
                      ? "bg-emerald-500 text-white"
                      : gosterYanlis
                        ? "bg-destructive text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {gosterDogru ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : gosterYanlis ? (
                    <X className="h-4 w-4" strokeWidth={3} />
                  ) : (
                    String.fromCharCode(65 + i)
                  )}
                </span>
                <span className="text-pretty">{secenek}</span>
              </button>
            );
          })}
        </div>

        {secim !== null && (
          <button
            onClick={sonraki}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110 active:scale-[0.98] animate-rise"
          >
            {aktif + 1 >= sorular.length ? "Sonucu Gör" : "Sonraki Soru"}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
