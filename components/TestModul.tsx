"use client";

import { useCallback, useState } from "react";
import { 
  ArrowLeft,
  ArrowRight, 
  BookOpen,
  Brain, 
  Check, 
  ChevronRight,
  Flame, 
  Flower,
  HeartHandshake,
  RotateCcw, 
  Target, 
  X 
} from "lucide-react";
import IlerlemeBari from "@/components/IlerlemeBari";
import { anaDonemler, anaDonemFiltrele, type AnaDonem, type LiteratureItem } from "@/src/data";
import { sorulariUret, type Soru } from "@/lib/soru";
import { sfxCorrect, sfxWrong } from "@/lib/sfx";
import kadinYazarlarData from "@/src/data/kadin_yazarlar_test.json";

type Props = {
  onSonuc?: (dogruMu: boolean, donem: string) => void;
};

type SayfaDurumu = "ana_secim" | "donem_secimi" | "test";

export default function TestModul({ onSonuc }: Props) {
  const [durum, setDurum] = useState<SayfaDurumu>("ana_secim");
  const [secilenBaslik, setSecilenBaslik] = useState<string>("");
  const [sorular, setSorular] = useState<Soru[]>([]);
  const [aktif, setAktif] = useState(0);
  const [secim, setSecim] = useState<string | null>(null);
  const [dogruSayi, setDogruSayi] = useState(0);
  const [bitti, setBitti] = useState(false);

  // Havuzdan soru üretip testi başlatan çekirdek fonksiyon
  const testiBaslat = useCallback((havuz: LiteratureItem[], baslik: string) => {
    const uretilenSorular = sorulariUret(havuz);
    setSecilenBaslik(baslik);
    setSorular(uretilenSorular);
    setAktif(0);
    setSecim(null);
    setDogruSayi(0);
    setBitti(false);
    setDurum("test");
  }, []);

  // Dönem bazlı testi başlat
  const donemTestiBaslat = useCallback((donem: AnaDonem) => {
    const havuz = anaDonemFiltrele(donem);
    testiBaslat(havuz, donem);
  }, [testiBaslat]);

  // Kadın yazarlar testini başlat (Rastgele 10 soru)
  const kadinYazarlarTestiBaslat = useCallback(() => {
    const karisikListe = [...kadinYazarlarData]
      .sort(() => 0.5 - Math.random())
      .slice(0, 10) as unknown as LiteratureItem[];
    
    testiBaslat(karisikListe, "Kadın Yazarlar Özel Testi");
  }, [testiBaslat]);

  const basaDon = () => {
    setDurum("ana_secim");
    setSecilenBaslik("");
    setSorular([]);
    setAktif(0);
    setSecim(null);
    setDogruSayi(0);
    setBitti(false);
  };

  const cevapla = (secenek: string) => {
    if (secim) return;
    const soru = sorular[aktif];
    const dogruMu = secenek === soru.dogru;
    if (dogruMu) sfxCorrect(); else sfxWrong();
    setSecim(secenek);
    if (dogruMu) setDogruSayi((s) => s + 1);
    onSonuc?.(dogruMu, soru.donem);
  };

  const sonraki = () => {
    if (aktif + 1 >= sorular.length) {
      setBitti(true);
      return;
    }
    setAktif((a) => a + 1);
    setSecim(null);
  };

  // 1. ANA SEÇİM EKRANI (Dönem Testleri veya Kadın Yazarlar - Dikeyde Orantılı Yerleşim)
  if (durum === "ana_secim") {
    return (
      <div className="my-auto flex flex-col justify-center max-w-xl mx-auto w-full py-8 space-y-3">
        <div className="text-center mb-4">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-xl bg-violet-500/10 text-violet-500">
            <Brain className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-xl font-bold tracking-tight text-card-foreground">Test Modu</h2>
          <p className="text-xs text-muted-foreground mt-1">Çözmek istediğin test kategorisini belirle</p>
        </div>

        {/* Seçenek 1: Dönem Testleri */}
        <button
          onClick={() => setDurum("donem_secimi")}
          className="glass-card p-4 rounded-xl ring-1 ring-border flex items-center justify-between hover:bg-muted/40 transition group text-left shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Dönem Testleri</h3>
              <p className="text-[11px] text-muted-foreground">Geçiş, Divan, Tanzimat, Millî Edebiyat ve Cumhuriyet</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition shrink-0" />
        </button>

        {/* Seçenek 2: Kadın Yazar & Eserler (Pembe / Çiçek Temalı) */}
        <button
          onClick={kadinYazarlarTestiBaslat}
          className="glass-card p-4 rounded-xl ring-1 ring-border flex items-center justify-between hover:bg-muted/40 transition group text-left shadow-sm border-l-2 border-l-pink-500"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
              <Flower className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-foreground">Kadın Yazarlar & Eserleri</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500">
                  Özel
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Sadece kadın yazarlarımız ve eserlerinden oluşan 10 soruluk testler
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition shrink-0" />
        </button>
      </div>
    );
  }

  // 2. DÖNEM SEÇİM ALTI (Dönem Testleri Seçildiğinde)
  if (durum === "donem_secimi") {
    return (
      <div className="animate-rise max-w-xl mx-auto w-full py-2">
        <button
          onClick={() => setDurum("ana_secim")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Kategorilere Dön
        </button>

        <div className="mb-6 rounded-xl bg-card p-5 border border-border text-center">
          <h2 className="font-serif text-xl font-bold tracking-tight text-card-foreground">Bir Dönem Seç</h2>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Eksik hissettiğin edebiyat dönemini seç ve kendini dene.
          </p>
        </div>

        <div className="space-y-2.5">
          {anaDonemler.map((donem, i) => {
            const tumMu = donem === "Tüm Dönemler";
            return (
              <button
                key={donem}
                onClick={() => donemTestiBaslat(donem)}
                className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-left transition active:scale-[0.99] ${
                  tumMu
                    ? "bg-violet-500 text-white shadow-md hover:brightness-110"
                    : "bg-card text-card-foreground shadow-sm hover:shadow-md border border-border"
                }`}
              >
                {tumMu ? (
                  <Target className="h-5 w-5 shrink-0" />
                ) : (
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                    {i}
                  </span>
                )}
                <span className="text-sm font-semibold">{donem}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. SONUÇ EKRANI
  if (bitti) {
    const oran = Math.round((dogruSayi / sorular.length) * 100);
    return (
      <div className="animate-rise rounded-xl bg-card p-6 text-center border border-border max-w-xl mx-auto w-full">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-xl bg-violet-500/10 text-violet-500">
          <Target className="h-9 w-9" strokeWidth={1.5} />
        </div>
        <h2 className="font-serif text-2xl font-bold tracking-tight text-card-foreground">Test Bitti</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {sorular.length} soruda <span className="font-bold text-violet-500">{dogruSayi}</span> doğru — %{oran}
        </p>
        <div className="mt-6">
          <IlerlemeBari mevcut={dogruSayi} toplam={sorular.length} etiket="Doğru cevap" />
        </div>
        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              if (secilenBaslik === "Kadın Yazarlar Özel Testi") kadinYazarlarTestiBaslat();
              else if (secilenBaslik) donemTestiBaslat(secilenBaslik as AnaDonem);
            }}
            className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-110 active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4" /> Tekrar Çöz
          </button>
          <button
            onClick={basaDon}
            className="rounded-lg bg-muted py-3 text-sm font-semibold text-muted-foreground shadow-sm transition hover:text-foreground active:scale-[0.98]"
          >
            Test Menüsüne Dön
          </button>
        </div>
      </div>
    );
  }

  // 4. AKTİF TEST / SORU EKRANI
  const soru = sorular[aktif];

  return (
    <div className="animate-rise max-w-xl mx-auto w-full">
      <div className="mb-4 rounded-xl bg-card border border-border p-3">
        <IlerlemeBari
          mevcut={aktif + (secim ? 1 : 0)}
          toplam={sorular.length}
          etiket="Soru"
          sagEtiket={`${aktif + 1} / ${sorular.length} · ${dogruSayi} doğru`}
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground">{secilenBaslik || soru.donem}</span>
          <button
            onClick={basaDon}
            className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-[11px] font-semibold text-muted-foreground ring-1 ring-border transition hover:text-foreground hover:ring-violet-500/30 active:scale-95"
          >
            <RotateCcw className="h-3 w-3" /> Testten Çık
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-card p-5 border border-border">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {soru.tip === "eser" ? "Yazarın eseri" : "Eserin yazarı"}
          </p>
          {soru.osymFreq && (
            <span className="inline-flex items-center gap-1 rounded-full bg-osym/15 px-2.5 py-1 text-[10px] font-bold text-osym ring-1 ring-osym/30">
              <Flame className="h-3 w-3" strokeWidth={2} />
              {soru.osymFreq}
            </span>
          )}
        </div>
        <h2 className="mt-2 font-serif text-xl font-bold tracking-tight leading-snug text-balance text-card-foreground">
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
              "bg-background border border-border text-card-foreground hover:border-violet-500/50 hover:bg-muted/40";
            if (gosterDogru) stil = "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400";
            else if (gosterYanlis) stil = "bg-destructive/10 border-destructive/50 text-destructive";
            else if (secim !== null) stil = "bg-background border-border text-muted-foreground opacity-50";

            return (
              <button
                key={secenek}
                onClick={() => cevapla(secenek)}
                disabled={secim !== null}
                className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-left text-sm font-medium transition-colors ${stil} ${
                  gosterYanlis ? "animate-shake" : ""
                } ${secim === null ? "active:scale-[0.99]" : ""}`}
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-md text-xs font-bold tabular-nums ${
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
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-110 active:scale-[0.98] animate-rise"
          >
            {aktif + 1 >= sorular.length ? "Sonucu Gör" : "Sonraki Soru"}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
