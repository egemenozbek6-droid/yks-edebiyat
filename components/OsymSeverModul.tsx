"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Check, Sparkles, RotateCcw, X } from "lucide-react";
import IlerlemeBari from "@/components/IlerlemeBari";
import { osymSeverSorulari, type Soru } from "@/lib/soru";
import { sfxCorrect, sfxWrong } from "@/lib/sfx";

const OSYM_EN_IYI_KEY = "edebikart-osym-eniyi";
const OSYM_SORU_SAYISI = 20;

export default function OsymSeverModul() {
  const [basladi, setBasladi] = useState(false);
  const [sorular, setSorular] = useState<Soru[]>([]);
  const [aktif, setAktif] = useState(0);
  const [secim, setSecim] = useState<string | null>(null);
  const [dogruSayi, setDogruSayi] = useState(0);
  const [bitti, setBitti] = useState(false);
  const [enIyiSkor, setEnIyiSkor] = useState(0);

  useEffect(() => {
    const kayitli = localStorage.getItem(OSYM_EN_IYI_KEY);
    setEnIyiSkor(kayitli ? parseInt(kayitli, 10) : 0);
  }, []);

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
    if (secenek === soru.dogru) { sfxCorrect(); setDogruSayi((s) => s + 1); } else sfxWrong();
    setSecim(secenek);
  };

  const sonraki = () => {
    if (aktif + 1 >= sorular.length) {
      // En iyi skoru kaydet
      if (dogruSayi > enIyiSkor) {
        localStorage.setItem(OSYM_EN_IYI_KEY, String(dogruSayi));
        setEnIyiSkor(dogruSayi);
      }
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
        <div className="relative mb-6 overflow-hidden rounded-3xl border border-sky-400/25 bg-[linear-gradient(135deg,_#172033,_#0f172a)] p-8 text-center shadow-[0_16px_40px_rgba(217,119,6,0.08)]">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-orange-600 text-white shadow-[0_4px_0_#9a3412] ring-1 ring-red-300/20 animate-pop">
            <Sparkles className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-2xl font-bold text-balance text-card-foreground">ÖSYM Sever</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-pretty text-muted-foreground">
            YKS'de fark yaratan banko sorular burada. Dönem sınırlarını kaldır, ÖSYM'nin en çok sevdiği yazar ve eserlerle kendini tam sınav ayarında test et.
          </p>
        </div>

        <button
          onClick={basla}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-orange-700 bg-orange-600 py-4 text-sm font-black tracking-wide text-white transition hover:brightness-110 active:translate-y-[5px] active:border-b-0"
        >
          <Sparkles className="h-4 w-4" /> Denemeyi Başlat
        </button>

        {/* Mikro rozetler */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-osym ring-1 ring-osym/20" style={{ background: "rgba(234, 88, 12, 0.15)" }}>
            🎯 100+ Banko Eser
          </span>
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-osym ring-1 ring-osym/20" style={{ background: "rgba(234, 88, 12, 0.15)" }}>
            ⚡ {OSYM_SORU_SAYISI} Soru Karma
          </span>
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-osym ring-1 ring-osym/20" style={{ background: "rgba(234, 88, 12, 0.15)" }}>
            🏆 En İyi: {enIyiSkor}/{OSYM_SORU_SAYISI}
          </span>
        </div>
      </div>
    );
  }

  // Sonuç ekranı
  if (bitti) {
    const oran = Math.round((dogruSayi / sorular.length) * 100);
    const basari = oran >= 80 ? "Süpersin!" : oran >= 60 ? "İyi gidiyorsun" : oran >= 40 ? "Gelişebilir" : "Tekrar çalış";
    const yeniRekor = dogruSayi >= enIyiSkor;
    return (
      <div className="animate-rise rounded-[1.75rem] bg-card p-9 text-center shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)]">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-osym/15 text-osym ring-1 ring-osym/30 animate-pop">
          <Sparkles className="h-9 w-9" strokeWidth={1.5} />
        </div>
        <h2 className="font-serif text-2xl font-bold text-card-foreground">{basari}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {sorular.length} soruda <span className="font-bold text-osym">{dogruSayi}</span> doğru — %{oran}
        </p>
        {yeniRekor && (
          <p className="mt-2 text-xs font-bold text-amber-500">Yeni Rekor!</p>
        )}
        <div className="mt-6">
          <IlerlemeBari mevcut={dogruSayi} toplam={sorular.length} etiket="Doğru cevap" />
        </div>
        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            onClick={basla}
            className="flex items-center justify-center gap-2 rounded-2xl border-b-4 border-orange-700 bg-orange-600 py-3.5 text-sm font-bold text-white transition hover:brightness-110 active:translate-y-1 active:border-b-0"
          >
            <RotateCcw className="h-4 w-4" /> Tekrar Çöz
          </button>
          <button
            onClick={() => setBasladi(false)}
            className="rounded-2xl bg-card py-3.5 text-sm font-semibold text-muted-foreground shadow-sm transition hover:text-foreground hover:ring-osym/40 active:scale-[0.98]"
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
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-osym">
            <Sparkles className="h-3.5 w-3.5" /> Banko soru
          </span>
          <button
            onClick={() => setBasladi(false)}
            className="inline-flex items-center gap-1.5 rounded-xl border-b-4 border-red-900 bg-destructive/10 px-3 py-1 text-[11px] font-semibold text-destructive ring-1 ring-destructive/20 transition hover:bg-destructive/15 hover:ring-destructive/30 active:scale-95"
          >
            <X className="h-3 w-3" /> Çıkış
          </button>
        </div>
      </div>

      <div className="rounded-[1.75rem] bg-card p-7 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)]">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {soru.tip === "eser" ? "Yazarın eseri" : "Eserin yazarı"}
          </p>
          {soru.osymFreq && (
            <span className="inline-flex items-center gap-1 rounded-full bg-osym/15 px-2.5 py-1 text-[10px] font-bold text-osym ring-1 ring-osym/30">
              <Sparkles className="h-3 w-3" strokeWidth={2} />
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
              "bg-card ring-border text-card-foreground hover:ring-osym/40 hover:bg-muted/60";
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
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border-b-4 border-orange-700 bg-orange-600 py-3.5 text-sm font-bold text-white transition hover:brightness-110 active:translate-y-1 active:border-b-0 animate-rise"
          >
            {aktif + 1 >= sorular.length ? "Sonucu Gör" : "Sonraki Soru"}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
