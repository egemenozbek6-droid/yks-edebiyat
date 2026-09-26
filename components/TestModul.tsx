"use client";

import { useState, useCallback, useEffect } from "react";
import {
  BookOpen,
  ChevronRight,
  Brain,
  Flame,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Users,
  X,
  Target,
} from "lucide-react";
import { anaDonemler, anaDonemFiltrele, type AnaDonem, type LiteratureItem } from "@/src/data";
import kadinYazarlarTest from "@/src/data/kadin_yazarlar_test.json";
import eserKahramanData from "@/src/data/eser_kahraman_test.json";
import batiAkimlarData from "@/src/data/bati_akimlar_test.json";
import { osymSeverSorulari } from "@/lib/soru";
import { sfxCorrect, sfxWrong } from "@/lib/sfx";
import { kartTekrarKaydet } from "@/lib/leitner";

const OSYM_EN_IYI_KEY = "edebikart-osym-eniyi";

type Gorunum = "ana_menu" | "donem_secim" | "test_ekrani";

type SoruYapisi = {
  kategoriUst: string;
  rozetMetin: string;
  vurgu: string;
  metin: string;
  dogru: string;
  secenekler: string[];
  kartId?: string;
};

type EserKahramanItem = {
  id: string;
  work: string;
  character: string;
  author: string;
  period: string;
  genre: string;
  difficulty?: string;
  isSideCharacter?: boolean;
  hint?: string;
  tags?: string[];
};

type BatiAkimItem = {
  id: string;
  name: string;
  century: string;
  difficulty?: string;
  slogan: string;
  keyFeatures: string[];
  representatives: string[];
  hint?: string;
  tags?: string[];
};

const MOTIVASYONLAR = [
  "Bu formla bahane üretirsen yazık olur valla.",
  "Her yanlış, gerçek sınavda bir doğru demek!",
  "Odaklan, AYT Edebiyat senin sahan.",
  "Ezber değil mantık, sen bu işi çözdün.",
];

function karistir<T>(dizi: T[]): T[] {
  const kopya = [...dizi];
  for (let i = kopya.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopya[i], kopya[j]] = [kopya[j], kopya[i]];
  }
  return kopya;
}

/** 3 yanlış şık üret; havuz yetersizse yedekten tamamla */
function secenekUret(dogru: string, havuz: string[], yedekHavuz: string[] = []): string[] {
  const tekil = Array.from(new Set(havuz.filter((x) => x && x !== dogru)));
  let yanlislar = karistir(tekil).slice(0, 3);
  if (yanlislar.length < 3) {
    const yedek = karistir(
      Array.from(new Set(yedekHavuz.filter((x) => x && x !== dogru && !yanlislar.includes(x)))),
    );
    yanlislar = [...yanlislar, ...yedek].slice(0, 3);
  }
  return karistir([dogru, ...yanlislar]);
}

export default function TestModul() {
  const [gorunum, setGorunum] = useState<Gorunum>("ana_menu");
  const [testAdi, setTestAdi] = useState("");
  const [sorular, setSorular] = useState<SoruYapisi[]>([]);
  const [aktifSoruIndex, setAktifSoruIndex] = useState(0);
  const [secim, setSecim] = useState<string | null>(null);
  const [dogruSayisi, setDogruSayisi] = useState(0);
  const [yanlisSayisi, setYanlisSayisi] = useState(0);
  const [bitti, setBitti] = useState(false);
  const [motivasyonGoster, setMotivasyonGoster] = useState(true);
  const [motivasyonMetni, setMotivasyonMetni] = useState(MOTIVASYONLAR[0]);

  const [osymEnIyiSkor, setOsymEnIyiSkor] = useState(0);
  useEffect(() => {
    const kayitli = localStorage.getItem(OSYM_EN_IYI_KEY);
    setOsymEnIyiSkor(kayitli ? parseInt(kayitli, 10) : 0);
  }, []);

  useEffect(() => {
    setMotivasyonMetni(MOTIVASYONLAR[Math.floor(Math.random() * MOTIVASYONLAR.length)]);
  }, [gorunum]);

  const testBaslat = useCallback((hazir: SoruYapisi[], baslik: string) => {
    setSorular(hazir);
    setTestAdi(baslik);
    setAktifSoruIndex(0);
    setSecim(null);
    setDogruSayisi(0);
    setYanlisSayisi(0);
    setBitti(false);
    setMotivasyonGoster(true);
    setGorunum("test_ekrani");
  }, []);

  // 1. ÖSYM SEVER (20 Soru)
  const osymBaslat = useCallback(() => {
    const raw = osymSeverSorulari();
    const hazir: SoruYapisi[] = raw.map((s) => ({
      kategoriUst: s.tip === "eser" ? "YAZARIN ESERİ" : "ESERİN YAZARI",
      rozetMetin: s.osymFreq || "Özel Seçki",
      vurgu: s.vurgu,
      metin: s.metin,
      dogru: s.dogru,
      secenekler: s.secenekler,
    }));
    testBaslat(hazir, "ÖSYM Sever Banko 20");
  }, [testBaslat]);

  // 2. STANDART TESTLER
  const standartBaslat = (tur: "donem" | "kadin" | "kahraman" | "akim", param?: string) => {
    // ---------- ESER – KAHRAMAN ----------
    if (tur === "kahraman") {
      const havuz = eserKahramanData as EserKahramanItem[];
      if (havuz.length === 0) return;

      const secilenler = karistir(havuz).slice(0, Math.min(10, havuz.length));
      const tumKarakterler = Array.from(new Set(havuz.map((x) => x.character)));
      const tumEserler = Array.from(new Set(havuz.map((x) => x.work)));

      const hazir: SoruYapisi[] = secilenler.map((item) => {
        const karakterSoruluyor = Math.random() < 0.5;

        if (karakterSoruluyor) {
          return {
            kategoriUst: "ESER – KARAKTER EŞLEŞTİRME",
            rozetMetin: "Karakter",
            vurgu: item.character,
            metin: "Bu karakter aşağıdaki eserlerin hangisinde yer alır?",
            dogru: item.work,
            secenekler: secenekUret(item.work, tumEserler.filter((w) => w !== item.work), tumEserler),
            kartId: item.id,
          };
        }

        return {
          kategoriUst: "ESER – KARAKTER EŞLEŞTİRME",
          rozetMetin: "Karakter",
          vurgu: item.work,
          metin: "Aşağıdaki karakterlerden hangisi bu eserde yer alır?",
          dogru: item.character,
          secenekler: secenekUret(
            item.character,
            tumKarakterler.filter((c) => c !== item.character),
            tumKarakterler,
          ),
          kartId: item.id,
        };
      });

      testBaslat(hazir, "Eser – Kahraman Testi");
      return;
    }

    // ---------- BATI EDEBİ AKIMLARI ----------
    if (tur === "akim") {
      const akimlar = batiAkimlarData as BatiAkimItem[];
      if (akimlar.length === 0) return;

      const tumIsimler = akimlar.map((a) => a.name);
      const tumTemsilciler = Array.from(new Set(akimlar.flatMap((a) => a.representatives)));

      const soruHavuzu: SoruYapisi[] = [];

      for (const akim of akimlar) {
        const temsilci = akim.representatives[Math.floor(Math.random() * akim.representatives.length)];

        // 1) Temsilci → Akım
        soruHavuzu.push({
          kategoriUst: "BATI EDEBİ AKIMLARI",
          rozetMetin: "Akım",
          vurgu: temsilci,
          metin: "Bu sanatçı aşağıdaki akımlardan hangisinin temsilcisidir?",
          dogru: akim.name,
          secenekler: secenekUret(akim.name, tumIsimler.filter((n) => n !== akim.name), tumIsimler),
          kartId: akim.id,
        });

        // 2) Slogan → Akım
        soruHavuzu.push({
          kategoriUst: "BATI EDEBİ AKIMLARI",
          rozetMetin: "Akım",
          vurgu: `“${akim.slogan}”`,
          metin: "Bu slogan / ilke hangi edebiyat akımına aittir?",
          dogru: akim.name,
          secenekler: secenekUret(akim.name, tumIsimler.filter((n) => n !== akim.name), tumIsimler),
          kartId: akim.id,
        });

        // 3) Özellik → Akım
        const ozellik = akim.keyFeatures[Math.floor(Math.random() * akim.keyFeatures.length)];
        soruHavuzu.push({
          kategoriUst: "BATI EDEBİ AKIMLARI",
          rozetMetin: "Akım",
          vurgu: ozellik,
          metin: "Bu özellik aşağıdaki akımlardan hangisine aittir?",
          dogru: akim.name,
          secenekler: secenekUret(akim.name, tumIsimler.filter((n) => n !== akim.name), tumIsimler),
          kartId: akim.id,
        });

        // 4) Akım → Temsilci
        const yanlisTemsilciler = tumTemsilciler.filter((t) => !akim.representatives.includes(t));
        soruHavuzu.push({
          kategoriUst: "BATI EDEBİ AKIMLARI",
          rozetMetin: "Akım",
          vurgu: akim.name,
          metin: "Aşağıdakilerden hangisi bu akımın temsilcilerinden biridir?",
          dogru: temsilci,
          secenekler: secenekUret(temsilci, yanlisTemsilciler, tumTemsilciler),
          kartId: akim.id,
        });
      }

      const hazir = karistir(soruHavuzu).slice(0, 10);
      testBaslat(hazir, "Batı Edebi Akımları Testi");
      return;
    }

    // ---------- DÖNEM / KADIN YAZARLAR ----------
    let havuz: LiteratureItem[] = anaDonemFiltrele("Tüm Dönemler");
    let baslik = "Test";
    let rozet = "Özel Seçki";

    if (tur === "donem") {
      baslik = param ? `${param} Testi` : "Dönem Testi";
      rozet = param || "Dönem";
      if (param && param !== "Tüm Dönemler") {
        havuz = anaDonemFiltrele(param as AnaDonem);
      }
    } else if (tur === "kadin") {
      baslik = "Kadın Yazarlar Özel Testi";
      rozet = "Özel Seçki";
      havuz = kadinYazarlarTest as unknown as LiteratureItem[];
    }

    if (havuz.length === 0) {
      havuz = anaDonemFiltrele("Tüm Dönemler");
    }

    const secilenler = karistir(havuz).slice(0, Math.min(10, havuz.length));
    const tumYazarlar = Array.from(new Set(havuz.map((x) => x.author)));
    const tumEserler = Array.from(new Set(havuz.map((x) => x.work)));

    const hazir: SoruYapisi[] = secilenler.map((item) => {
      const eserSoruluyor = Math.random() < 0.5;

      if (eserSoruluyor) {
        return {
          kategoriUst: "ESERİN YAZARI",
          rozetMetin: rozet,
          vurgu: item.work,
          metin: "Aşağıdaki yazarlardan hangisi bu eserin yazarıdır?",
          dogru: item.author,
          secenekler: secenekUret(
            item.author,
            tumYazarlar.filter((a) => a !== item.author),
            tumYazarlar,
          ),
          kartId: String(item.id),
        };
      }

      return {
        kategoriUst: "YAZARIN ESERİ",
        rozetMetin: rozet,
        vurgu: item.author,
        metin: "Aşağıdaki eserlerden hangisi bu yazara aittir?",
        dogru: item.work,
        secenekler: secenekUret(
          item.work,
          tumEserler.filter((w) => w !== item.work),
          tumEserler,
        ),
        kartId: String(item.id),
      };
    });

    testBaslat(hazir, baslik);
  };

  const cevapVer = (cevap: string) => {
    if (secim !== null) return;
    setSecim(cevap);

    const soru = sorular[aktifSoruIndex];
    if (cevap === soru.dogru) {
      sfxCorrect();
      setDogruSayisi((s) => s + 1);
    } else {
      sfxWrong();
      setYanlisSayisi((s) => s + 1);
      if (soru.kartId) {
        if (/^\d+$/.test(soru.kartId)) {
          kartTekrarKaydet(soru.kartId);
        }
      } else {
        const v = soru.vurgu.toLocaleLowerCase("tr").trim();
        const tumu = anaDonemFiltrele("Tüm Dönemler");
        const eslesen = tumu.find(
          (y) =>
            y.work.toLocaleLowerCase("tr").trim() === v ||
            y.author.toLocaleLowerCase("tr").trim() === v,
        );
        if (eslesen) kartTekrarKaydet(String(eslesen.id));
      }
    }
  };

  const sonrakiSoru = () => {
    if (aktifSoruIndex + 1 < sorular.length) {
      setAktifSoruIndex((prev) => prev + 1);
      setSecim(null);
    } else {
      setDogruSayisi((finalDogru) => {
        if (testAdi.includes("ÖSYM") && finalDogru > osymEnIyiSkor) {
          localStorage.setItem(OSYM_EN_IYI_KEY, String(finalDogru));
          setOsymEnIyiSkor(finalDogru);
        }
        return finalDogru;
      });
      setBitti(true);
    }
  };

  // ============================================================
  // EKRAN 1: TEST / SORU
  // ============================================================
  if (gorunum === "test_ekrani") {
    if (bitti) {
      const basariOrani = sorular.length
        ? Math.round((dogruSayisi / sorular.length) * 100)
        : 0;
      return (
        <div className="flex-1 flex items-center justify-center p-4 animate-rise max-w-sm mx-auto w-full">
          <div className="rounded-3xl bg-[#0c121e] border border-border/60 p-6 text-center shadow-2xl w-full">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30">
              <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-white">Test Bitti!</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {testAdi} tamamlandı.
              {testAdi.includes("ÖSYM") || testAdi.includes("Dönem") || testAdi.includes("Kadın")
                ? " Yanlışların Leitner Kutu 1'e eklendi."
                : ""}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-emerald-500/10 p-3 ring-1 ring-emerald-500/20">
                <span className="text-[10px] font-bold uppercase text-emerald-400">Doğru</span>
                <p className="mt-0.5 text-2xl font-black text-emerald-400">{dogruSayisi}</p>
              </div>
              <div className="rounded-2xl bg-destructive/10 p-3 ring-1 ring-destructive/20">
                <span className="text-[10px] font-bold uppercase text-destructive">Yanlış</span>
                <p className="mt-0.5 text-2xl font-black text-destructive">{yanlisSayisi}</p>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-muted/20 p-2.5 text-xs font-semibold text-muted-foreground">
              Başarı Oranı: <span className="text-white font-bold">%{basariOrani}</span>
            </div>

            {testAdi.includes("ÖSYM") && osymEnIyiSkor > 0 && (
              <div className="mt-2 text-[11px] text-osym font-semibold">
                🏆 En iyi skorun: {osymEnIyiSkor} / {sorular.length}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => setGorunum("ana_menu")}
                className="rounded-xl bg-violet-600 py-3.5 text-sm font-bold text-white shadow-md transition hover:brightness-110 active:scale-[0.98]"
              >
                Menüye Dön
              </button>
            </div>
          </div>
        </div>
      );
    }

    const soru = sorular[aktifSoruIndex];
    if (!soru) return null;

    const ilerlemeYuzdesi = ((aktifSoruIndex + (secim ? 1 : 0)) / sorular.length) * 100;

    return (
      <div className="animate-rise max-w-md mx-auto w-full flex-1 flex flex-col justify-start p-2 gap-3">
        {motivasyonGoster && (
          <div className="flex items-center justify-between gap-2.5 rounded-2xl bg-[#0c121e]/90 border border-border/50 px-4 py-3 shadow-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-base shrink-0">💬</span>
              <p className="text-xs text-slate-300 truncate font-medium">{motivasyonMetni}</p>
            </div>
            <button
              onClick={() => setMotivasyonGoster(false)}
              className="text-muted-foreground hover:text-white p-1 shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="rounded-2xl bg-[#0c121e] border border-border/50 p-4 shadow-md">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span className="uppercase tracking-wider text-[11px]">SORU</span>
            <span>
              {aktifSoruIndex + 1}/{sorular.length} · {dogruSayisi} doğru
            </span>
          </div>

          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
            <div
              className="h-full bg-violet-500 transition-all duration-300 rounded-full"
              style={{ width: `${ilerlemeYuzdesi}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium truncate max-w-[200px]">{testAdi}</span>
            <button
              onClick={() => setGorunum("ana_menu")}
              className="flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              <RotateCcw className="h-3 w-3" /> Testten Çık
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-[#0c121e] border border-border/50 p-5 shadow-xl flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                {soru.kategoriUst}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/15 border border-pink-500/30 px-2.5 py-0.5 text-[10px] font-bold text-pink-400">
                <Flame className="h-3 w-3" /> {soru.rozetMetin}
              </span>
            </div>

            <h2 className="mt-3 font-serif text-2xl font-bold text-white tracking-tight leading-snug">
              {soru.vurgu}
            </h2>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">{soru.metin}</p>

            <div className="mt-5 space-y-2.5">
              {soru.secenekler.map((secenek, i) => {
                const secildi = secim === secenek;
                const dogruMu = secenek === soru.dogru;
                const gosterDogru = secim !== null && dogruMu;
                const gosterYanlis = secildi && !dogruMu;

                let kutuStil = "bg-[#111927] border-border/40 text-slate-200 hover:bg-[#162235]";
                let harfStil = "bg-[#1a2436] text-slate-400";

                if (gosterDogru) {
                  kutuStil = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold";
                  harfStil = "bg-emerald-500 text-white";
                } else if (gosterYanlis) {
                  kutuStil = "bg-destructive/20 border-destructive text-destructive font-bold";
                } else if (secim !== null) {
                  kutuStil = "bg-[#111927]/40 border-border/20 text-slate-500 opacity-40";
                }

                return (
                  <button
                    key={`${secenek}-${i}`}
                    onClick={() => cevapVer(secenek)}
                    disabled={secim !== null}
                    className={`flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left text-sm font-medium transition-all ${kutuStil} ${
                      gosterYanlis ? "animate-shake" : ""
                    }`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${harfStil}`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{secenek}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {secim !== null && (
            <button
              onClick={sonrakiSoru}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 active:scale-[0.99] animate-rise shrink-0"
            >
              {aktifSoruIndex + 1 >= sorular.length ? "Testi Bitir" : "Sonraki Soru"}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // EKRAN 2: DÖNEM SEÇİM
  // ============================================================
  if (gorunum === "donem_secim") {
    return (
      <div className="flex-1 flex flex-col gap-3 p-1 animate-rise max-w-md mx-auto w-full">
        <button
          onClick={() => setGorunum("ana_menu")}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition px-1 py-1"
        >
          <ArrowLeft className="h-4 w-4" /> Kategorilere Dön
        </button>

        <div className="rounded-3xl bg-[#0c121e] border border-border/60 p-5 text-center shadow-md">
          <h2 className="font-serif text-lg font-bold text-white">Bir Dönem Seç</h2>
          <p className="mt-0.5 text-xs text-slate-400">Eksiğin olan dönemi belirle ve teste dal!</p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => standartBaslat("donem", "Tüm Dönemler")}
            className="flex items-center gap-3 rounded-2xl bg-violet-600 px-4 py-3.5 text-sm font-bold text-white shadow-md transition hover:brightness-110 active:scale-[0.99]"
          >
            <Target className="h-5 w-5" />
            <span>Tüm Dönemler</span>
          </button>

          {anaDonemler
            .filter((d) => d !== "Tüm Dönemler")
            .map((donem, i) => (
              <button
                key={donem}
                onClick={() => standartBaslat("donem", donem)}
                className="flex items-center gap-3.5 rounded-2xl bg-[#0c121e] border border-border/50 px-4 py-3.5 text-left text-sm font-semibold text-slate-200 shadow-sm transition hover:bg-[#111927] hover:border-border active:scale-[0.99]"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#141d2e] text-xs font-bold text-slate-400">
                  {i + 1}
                </span>
                <span className="flex-1 truncate">{donem}</span>
              </button>
            ))}
        </div>
      </div>
    );
  }

  // ============================================================
  // EKRAN 3: ANA MENÜ
  // ============================================================
  return (
    <div className="flex-1 flex flex-col gap-3 p-1 animate-rise max-w-md mx-auto w-full">
      <div className="rounded-3xl bg-[#0c121e] border border-border/60 p-6 text-center shadow-lg">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30">
          <Brain className="h-6 w-6" strokeWidth={1.8} />
        </div>
        <h2 className="font-serif text-xl font-bold text-white">Test Modu</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Dönemleri tara veya özel seçkilerle bilgilerini pekiştir. Sınav provasına başla.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          onClick={() => setGorunum("donem_secim")}
          className="flex items-center justify-between rounded-2xl bg-[#0c121e] border border-border/60 p-4 transition hover:bg-[#111927] hover:border-border active:scale-[0.99] text-left shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/25">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-sm font-bold text-white">Dönem Testleri</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Eksiklerini bul, teste başla! 🚀</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
        </button>

        <button
          onClick={osymBaslat}
          className="flex items-center justify-between rounded-2xl bg-[#0c121e] border border-osym/40 p-4 transition hover:bg-osym/5 hover:border-osym/70 active:scale-[0.99] text-left shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-osym/15 text-osym ring-1 ring-osym/30">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-serif text-sm font-bold text-white">ÖSYM Sever</p>
                <span className="rounded-full bg-osym/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-osym ring-1 ring-osym/30">
                  Banko 20
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Dönem sınırı yok! Banko sorularla gerçek sınav provası 🔥
                {osymEnIyiSkor > 0 ? ` · En iyi: ${osymEnIyiSkor}/20` : ""}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-osym/70" />
        </button>

        <button
          onClick={() => standartBaslat("kadin")}
          className="flex items-center justify-between rounded-2xl bg-[#0c121e] border border-border/60 p-4 transition hover:bg-[#111927] hover:border-border active:scale-[0.99] text-left shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-pink-500/15 text-pink-400 ring-1 ring-pink-500/25 text-lg">
              🌸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-serif text-sm font-bold text-white">Kadın Yazarlar & Eserleri</p>
                <span className="rounded-full bg-pink-500/15 px-1.5 py-0.5 text-[9px] font-bold text-pink-400">
                  Özel
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Sadece kadın yazar ve eserleri! 🌸</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
        </button>

        <button
          onClick={() => standartBaslat("kahraman")}
          className="flex items-center justify-between rounded-2xl bg-[#0c121e] border border-border/60 p-4 transition hover:bg-[#111927] hover:border-border active:scale-[0.99] text-left shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25">
