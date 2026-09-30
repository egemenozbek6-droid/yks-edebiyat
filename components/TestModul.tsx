"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  Compass,
  Flame,
  RotateCcw,
  Sparkles,
  Target,
  Users,
  X,
  XCircle,
} from "lucide-react";
import {
  anaDonemler,
  anaDonemFiltrele,
  type AnaDonem,
  type LiteratureItem,
  gecerliYazarlar,
} from "@/src/data";
import kadinYazarlarTest from "@/src/data/kadin_yazarlar_test.json";
import eserKahramanData from "@/src/data/eser_kahraman_test.json";
import batiAkimlarData from "@/src/data/bati_akimlar_test.json";
import { osymSeverSorulari, type Soru as OsymSoru } from "@/lib/soru";
import { sfxCorrect, sfxWrong } from "@/lib/sfx";

/** Test-only Leitner — kartlarla paylaşılmaz */
const TEST_LEITNER_KEY = "edebikart_test_leitner_v1";
type TestKutu = 1 | 2 | 3;
type TestHafiza = { kutu: TestKutu; sonTekrar: number; tekrarSayisi: number };

function testLeitnerOku(): Record<string, TestHafiza> {
  if (typeof window === "undefined") return {};
  try {
    const ham = JSON.parse(localStorage.getItem(TEST_LEITNER_KEY) || "{}") as Record<string, TestHafiza>;
    const temiz: Record<string, TestHafiza> = {};
    let kirli = false;
    for (const [id, h] of Object.entries(ham)) {
      if (h && h.kutu === 1) temiz[id] = h;
      else kirli = true;
    }
    if (kirli) {
      try {
        localStorage.setItem(TEST_LEITNER_KEY, JSON.stringify(temiz));
      } catch {
        /* sessiz */
      }
    }
    return temiz;
  } catch {
    return {};
  }
}

function testLeitnerYaz(veriler: Record<string, TestHafiza>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TEST_LEITNER_KEY, JSON.stringify(veriler));
}

function testYanlısKaydet(kartId: string) {
  if (!kartId) return;
  const veriler = testLeitnerOku();
  const mevcut = veriler[kartId];
  veriler[kartId] = {
    kutu: 1,
    sonTekrar: Date.now(),
    tekrarSayisi: (mevcut?.tekrarSayisi ?? 0) + 1,
  };
  testLeitnerYaz(veriler);
}

function testDogruKaydet(kartId: string) {
  if (!kartId) return;
  const veriler = testLeitnerOku();
  if (!veriler[kartId]) return;
  delete veriler[kartId];
  testLeitnerYaz(veriler);
}

function testTekrarIdleri(): string[] {
  return Object.keys(testLeitnerOku());
}

// Harici import tip hatası vermesin diye yerel bileşen olarak tanımlandı
function IlerlemeBari({ simdiki, toplam }: { simdiki: number; toplam: number }) {
  const yuzde = toplam > 0 ? Math.min(100, Math.max(0, (simdiki / toplam) * 100)) : 0;
  return (
    <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden">
      <div
        className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
        style={{ width: `${yuzde}%` }}
      />
    </div>
  );
}

const OSYM_EN_IYI_KEY = "edebikart-osym-eniyi";
const OSYM_SORU_SAYISI = 20;

type Gorunum = "menu" | "donem_secim" | "osym" | "standart";

type StandartSoru = {
  kategoriUst: string;
  rozetMetin?: string;
  vurgu: string;
  metin: string;
  dogru: string;
  secenekler: string[];
  aciklama?: string;
  kartId?: string;
};

type EserKahramanItem = {
  id: string;
  work: string;
  character: string;
  author: string;
  period: string;
  genre: string;
  hint?: string;
};

type BatiAkimItem = {
  id: string;
  name: string;
  century: string;
  slogan: string;
  keyFeatures: string[];
  representatives: string[];
  hint?: string;
};

function karistir<T>(dizi: T[]): T[] {
  const kopya = [...dizi];
  for (let i = kopya.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopya[i], kopya[j]] = [kopya[j], kopya[i]];
  }
  return kopya;
}

function secenekUret(dogru: string, havuz: string[], yedek: string[] = []): string[] {
  const tekil = Array.from(new Set(havuz.filter((x) => x && x !== dogru)));
  let yanlislar = karistir(tekil).slice(0, 3);
  if (yanlislar.length < 3) {
    const ekstra = karistir(
      Array.from(new Set(yedek.filter((x) => x && x !== dogru && !yanlislar.includes(x)))),
    );
    yanlislar = [...yanlislar, ...ekstra].slice(0, 3);
  }
  return karistir([dogru, ...yanlislar]);
}

/** Aynı yazarın diğer eserlerini yanlış şık olarak koyma */
function eserHavuzuBaskaYazarlar(
  dogruEser: string,
  dogruYazar: string,
  havuz: { author: string; work: string }[],
): string[] {
  return Array.from(
    new Set(
      havuz
        .filter(
          (x) =>
            x.work &&
            x.work !== dogruEser &&
            x.author.toLocaleLowerCase("tr") !== dogruYazar.toLocaleLowerCase("tr"),
        )
        .map((x) => x.work),
    ),
  );
}

function yazarHavuzuBaska(
  dogruYazar: string,
  havuz: { author: string }[],
): string[] {
  return Array.from(
    new Set(
      havuz
        .filter(
          (x) =>
            x.author &&
            x.author.toLocaleLowerCase("tr") !== dogruYazar.toLocaleLowerCase("tr"),
        )
        .map((x) => x.author),
    ),
  );
}

const RECENT_KEY = "edebikart-test-recent-v1";
const RECENT_LIMIT = 40;

function recentOku(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as string[];
  } catch {
    return [];
  }
}

function recentYaz(yeniAnahtarlar: string[]) {
  if (typeof window === "undefined") return;
  const onceki = recentOku();
  const birlesik = [...yeniAnahtarlar, ...onceki.filter((k) => !yeniAnahtarlar.includes(k))];
  localStorage.setItem(RECENT_KEY, JSON.stringify(birlesik.slice(0, RECENT_LIMIT)));
}

function recentFiltrele<T>(havuz: T[], anahtar: (x: T) => string): T[] {
  const recent = new Set(recentOku());
  const taze = havuz.filter((x) => !recent.has(anahtar(x)));
  return taze.length >= 8 ? taze : havuz;
}

type BitisMod = "donem" | "kadin" | "kahraman" | "akim" | "osym" | "tekrar";

const BITIS_MESAJLARI: Record<BitisMod, { super: string[]; iyi: string[]; orta: string[]; dusuk: string[] }> = {
  donem: {
    super: [
      "Bu dönemi ezberlemişsin, ÖSYM’nin eli ayağı titrer.",
      "Kartlar işe yaramış, bu skor rastgele değil.",
      "Banko net. Bu dönem senden soru kaçmaz.",
    ],
    iyi: [
      "İyi tur, bir iki açık kalsa da form yerinde.",
      "Devam et, full’e çok kaldı.",
      "Sağlam. Bir tur daha bas, kilitlenir.",
    ],
    orta: [
      "Orta karar, kartlara bir daha bakıp gel.",
      "Biraz dağınık, ama toparlanır.",
      "Eh, idare eder. Tekrar çöz, oturur.",
    ],
    dusuk: [
      "Bu dönem henüz oturmamış, kartlara dön.",
      "Isınma turu say, moral bozma.",
      "Şimdi kaçtı, kartla bakıp bir daha gel.",
    ],
  },
  kadin: {
    super: [
      "Kadın yazarlar seçkisi senden soru kaçırmadı.",
      "Bu isimler artık aklında, net oradan gelir.",
      "Seçkiyi bitirmişsin, tebrikler.",
    ],
    iyi: [
      "İyi iş, bir iki isim daha pekişsin yeter.",
      "Form yerinde, tekrar çözünce fullersin.",
      "Neredeyse perfect, ufak açıklar var.",
    ],
    orta: [
      "Orta. Seçkiye bir daha bak, oturur.",
      "İdare eder, bir tur daha bas.",
      "Biraz karışmış, kartlarla toparla.",
    ],
    dusuk: [
      "Bu seçki henüz oturmamış, sakince tekrar.",
      "Isınma, moral bozma.",
      "Kaçtı; bir daha çöz, yerleşir.",
    ],
  },
  kahraman: {
    super: [
      "Karakter–eser eşlemesi oturmuş, bravo.",
      "Kahramanlar senden kaçamaz.",
      "Bu tur temiz, banko soru tipi bu.",
    ],
    iyi: [
      "İyi tur, bir iki karakter daha pekişsin.",
      "Form yerinde, tekrar çöz fullersin.",
      "Neredeyse kilit, ufak açıklar var.",
    ],
    orta: [
      "Orta. Hint’leri oku, bir daha gel.",
      "Karışmış biraz, tekrar dene.",
      "İdare eder; eser–kahraman biraz daha iş ister.",
    ],
    dusuk: [
      "Karakterler henüz oturmamış, bilgi notuna bak.",
      "Isınma turu, moral bozma.",
      "Kaçtı; aynı testi bir daha çöz.",
    ],
  },
  akim: {
    super: [
      "Akımları ezberlemişsin, Breton bile alkışlar.",
      "Klasisizmden sürrealizme kadar hakimsin.",
      "Bu skorla Batı akımları sorusu seni korkutmaz.",
    ],
    iyi: [
      "İyi tur, bir iki akım daha pekişsin yeter.",
      "Form yerinde, tekrar çözünce fullersin.",
      "Neredeyse perfect, ufak açıklar var.",
    ],
    orta: [
      "Orta karar, slogan ve temsilcilere bir daha bak.",
      "Bilgi notları işine yarar, tekrar dene.",
      "Eh, idare eder; bir tur daha bas.",
    ],
    dusuk: [
      "Akımlar seni yormuş, hint'leri oku tekrar gel.",
      "Isınma turu, moral bozma.",
      "Kart değil bu ama bilgi notu her şeyi anlatıyor.",
    ],
  },
  osym: {
    super: [
      "ÖSYM Sever’de bu skor ciddi iş.",
      "Banko sorular senden kaçmadı.",
      "Prova temiz, sınavda da böyle git.",
    ],
    iyi: [
      "İyi prova, birkaç banko daha pekişsin.",
      "Form yerinde, bir 20’lik daha bas.",
      "Neredeyse full, ufak açıklar kapanır.",
    ],
    orta: [
      "Orta prova, kartlara dönüp bir daha gel.",
      "İdare eder; bankoları bir tur daha çöz.",
      "Eh. Yanlışlar Kaçırdıkların’a düştü.",
    ],
    dusuk: [
      "Prova ısınma say, kartlarla toparla.",
      "Moral bozma, banko bu yüzden tekrar edilir.",
      "Kaçtı; aynı 20’liği bir daha çöz.",
    ],
  },
  tekrar: {
    super: [
      "Kaçırdıklarını kapattın, net oradan gelir.",
      "Zayıf halkalar çelik oldu, böyle devam.",
      "Bu tur eksiğini bitirdin.",
    ],
    iyi: [
      "İyi tur, bir daha basarsan liste temizlenir.",
      "Çoğunu toparladın, kalanları da halledersin.",
      "Açıkların azalıyor, böyle git.",
    ],
    orta: [
      "Bir kısmı oturdu, kalan yanlışlar hâlâ listede.",
      "İdare eder; aynı soruları bir daha çöz.",
      "Orta karar — doğru bildiklerin listeden çıktı.",
    ],
    dusuk: [
      "Bu sorular seni hâlâ zorluyor, bir tur daha.",
      "Moral bozma; kaçırdığın soru burada durur.",
      "Isınma turu — aynı listeyi tekrar çöz.",
    ],
  },
};

function bitisMesaji(mod: BitisMod, oran: number): string {
  const havuz = BITIS_MESAJLARI[mod];
  const liste =
    oran >= 75 ? havuz.super : oran >= 50 ? havuz.iyi : oran >= 25 ? havuz.orta : havuz.dusuk;
  return liste[Math.floor(Math.random() * liste.length)];
}

export default function TestModul() {
  const [gorunum, setGorunum] = useState<Gorunum>("menu");

  const [osymSorular, setOsymSorular] = useState<OsymSoru[]>([]);
  const [osymAktif, setOsymAktif] = useState(0);
  const [osymSecim, setOsymSecim] = useState<string | null>(null);
  const [osymDogruSayi, setOsymDogruSayi] = useState(0);
  const [osymBitti, setOsymBitti] = useState(false);
  const [osymEnIyiSkor, setOsymEnIyiSkor] = useState(0);
  const [tekrarSayisi, setTekrarSayisi] = useState(0);
  const [sonTest, setSonTest] = useState<{
    tur: "donem" | "kadin" | "kahraman" | "akim" | "tekrar";
    param?: string;
  } | null>(null);

  const [standartSorular, setStandartSorular] = useState<StandartSoru[]>([]);
  const [standartIndex, setStandartIndex] = useState(0);
  const [standartSecim, setStandartSecim] = useState<string | null>(null);
  const [standartDogru, setStandartDogru] = useState(0);
  const [standartYanlis, setStandartYanlis] = useState(0);
  const [standartBitti, setStandartBitti] = useState(false);
  const [seciliBaslik, setSeciliBaslik] = useState("");
  const [aksan, setAksan] = useState<"primary" | "osym" | "pink" | "amber" | "sky" | "rose">("primary");

  useEffect(() => {
    const kayitli = localStorage.getItem(OSYM_EN_IYI_KEY);
    setOsymEnIyiSkor(kayitli ? parseInt(kayitli, 10) : 0);
  }, []);

  useEffect(() => {
    if (gorunum !== "menu") return;
    setTekrarSayisi(testTekrarIdleri().length);
  }, [gorunum]);

  const osymBaslat = useCallback(() => {
    const ham = osymSeverSorulari(OSYM_SORU_SAYISI * 2);
    const filt = recentFiltrele(ham, (q) => `${q.vurgu}::${q.dogru}`);
    const sec = (filt.length >= OSYM_SORU_SAYISI ? filt : ham).slice(0, OSYM_SORU_SAYISI);
    recentYaz(sec.map((q) => `${q.vurgu}::${q.dogru}`));
    setOsymSorular(sec);
    setOsymAktif(0);
    setOsymSecim(null);
    setOsymDogruSayi(0);
    setOsymBitti(false);
    setSonTest(null);
    setGorunum("osym");
  }, []);

  const osymCevapla = (secenek: string) => {
    if (osymSecim) return;
    const soru = osymSorular[osymAktif];
    const havuz = [
      ...gecerliYazarlar(),
      ...(kadinYazarlarTest as unknown as LiteratureItem[]),
    ];
    const eslesen = havuz.find(
      (y) =>
        y.work.toLocaleLowerCase("tr") === soru.vurgu.toLocaleLowerCase("tr") ||
        y.author.toLocaleLowerCase("tr") === soru.vurgu.toLocaleLowerCase("tr"),
    );
    if (secenek === soru.dogru) {
      sfxCorrect();
      setOsymDogruSayi((s) => s + 1);
      if (eslesen) testDogruKaydet(String(eslesen.id));
    } else {
      sfxWrong();
      if (eslesen) testYanlısKaydet(String(eslesen.id));
    }
    setOsymSecim(secenek);
  };

  const osymSonraki = () => {
    if (osymAktif + 1 >= osymSorular.length) {
      setOsymDogruSayi((final) => {
        if (final > osymEnIyiSkor) {
          localStorage.setItem(OSYM_EN_IYI_KEY, String(final));
          setOsymEnIyiSkor(final);
        }
        return final;
      });
      setOsymBitti(true);
      return;
    }
    setOsymAktif((a) => a + 1);
    setOsymSecim(null);
  };

  const standartBaslat = (
    tur: "donem" | "kadin" | "kahraman" | "akim" | "tekrar",
    param?: AnaDonem | string,
  ) => {
    let hazir: StandartSoru[] = [];
    let baslik = "Test";
    let renk: "primary" | "osym" | "pink" | "amber" | "sky" | "rose" = "primary";

    if (tur === "tekrar") {
      const tekrarIdleri = testTekrarIdleri();
      const lit = [
        ...gecerliYazarlar(),
        ...anaDonemFiltrele("Tüm Dönemler"),
      ];
      const kadinHavuz = kadinYazarlarTest as unknown as LiteratureItem[];
      const ek = eserKahramanData as EserKahramanItem[];
      const ak = batiAkimlarData as BatiAkimItem[];
      const pool: StandartSoru[] = [];

      for (const id of tekrarIdleri) {
        const litItem =
          lit.find((x) => String(x.id) === id) ||
          kadinHavuz.find((x) => String(x.id) === id);
        if (litItem) {
          const secenekKaynak =
            kadinHavuz.some((x) => String(x.id) === id) ? kadinHavuz : lit;
          const tumY = Array.from(new Set(secenekKaynak.map((x) => x.author)));
          const tumE = Array.from(new Set(secenekKaynak.map((x) => x.work)));
          if (Math.random() < 0.5) {
            const yazarHavuz = yazarHavuzuBaska(litItem.author, secenekKaynak);
            pool.push({
              kategoriUst: "KAÇIRDIĞIN",
              vurgu: litItem.work,
              metin: "Aşağıdaki yazarlardan hangisi bu eserin yazarıdır?",
              dogru: litItem.author,
              secenekler: secenekUret(litItem.author, yazarHavuz, tumY),
              kartId: id,
            });
          } else {
            const eserHavuz = eserHavuzuBaskaYazarlar(
              litItem.work,
              litItem.author,
              secenekKaynak,
            );
            pool.push({
              kategoriUst: "KAÇIRDIĞIN",
              vurgu: litItem.author,
              metin: "Aşağıdaki eserlerden hangisi bu yazara aittir?",
              dogru: litItem.work,
              secenekler: secenekUret(litItem.work, eserHavuz, tumE),
              kartId: id,
            });
          }
          continue;
        }
        const ekItem = ek.find((x) => x.id === id);
        if (ekItem) {
          const tumK = Array.from(new Set(ek.map((x) => x.character)));
          const tumE = Array.from(new Set(ek.map((x) => x.work)));
          pool.push({
            kategoriUst: "KAÇIRDIĞIN · KARAKTER",
            rozetMetin: undefined,
            vurgu: ekItem.character,
            metin: "Bu karakter aşağıdaki eserlerin hangisinde yer alır?",
            dogru: ekItem.work,
            secenekler: secenekUret(ekItem.work, tumE, tumE),
            aciklama: ekItem.hint,
            kartId: id,
          });
          continue;
        }
        const akItem = ak.find((x) => x.id === id);
        if (akItem) {
          const tumI = ak.map((x) => x.name);
          const temsilci =
            akItem.representatives[Math.floor(Math.random() * akItem.representatives.length)];
          pool.push({
            kategoriUst: "KAÇIRDIĞIN · AKIM",
            rozetMetin: undefined,
            vurgu: temsilci,
            metin: "Bu sanatçı aşağıdaki akımlardan hangisinin temsilcisidir?",
            dogru: akItem.name,
            secenekler: secenekUret(akItem.name, tumI, tumI),
            aciklama: akItem.hint || akItem.century,
            kartId: id,
          });
        }
      }

      if (pool.length === 0) {
        setTekrarSayisi(0);
        return;
      }

      hazir = karistir(pool);
      baslik = "Kaçırdıkların";
      renk = "rose";
      setSonTest({ tur: "tekrar" });
      recentYaz(hazir.map((q) => q.kartId || q.vurgu));
      setStandartSorular(hazir);
      setStandartIndex(0);
      setStandartSecim(null);
      setStandartDogru(0);
      setStandartYanlis(0);
      setStandartBitti(false);
      setSeciliBaslik(baslik);
      setAksan(renk);
      setGorunum("standart");
      return;
    }

    if (tur === "kahraman") {
      const havuz = eserKahramanData as EserKahramanItem[];
      if (!havuz.length) return;
      const secilenler = karistir(recentFiltrele(havuz, (x) => x.id)).slice(0, Math.min(10, havuz.length));
      const tumKarakterler = Array.from(new Set(havuz.map((x) => x.character)));
      const tumEserler = Array.from(new Set(havuz.map((x) => x.work)));
      hazir = secilenler.map((item) => {
        const ayniEser = new Set(havuz.filter((x) => x.work === item.work).map((x) => x.character));
        if (Math.random() < 0.5) {
          const diger = tumKarakterler.filter((k) => k !== item.character && !ayniEser.has(k));
          return {
            kategoriUst: "ESER – KAHRAMAN",
            vurgu: item.work,
            metin: "Bu eserin kahramanı / önemli karakteri hangisidir?",
            dogru: item.character,
            secenekler: secenekUret(item.character, diger, tumKarakterler),
            aciklama: item.hint,
            kartId: item.id,
          };
        }
        const digerE = tumEserler.filter((e) => e !== item.work);
        return {
          kategoriUst: "KAHRAMAN – ESER",
          vurgu: item.character,
          metin: "Bu karakter aşağıdaki eserlerin hangisinde yer alır?",
          dogru: item.work,
          secenekler: secenekUret(item.work, digerE, tumEserler),
          aciklama: item.hint,
          kartId: item.id,
        };
      });
      baslik = "Eser – Kahraman";
      renk = "amber";
    } else if (tur === "akim") {
      const havuz = batiAkimlarData as BatiAkimItem[];
      if (!havuz.length) return;
      const secilenler = karistir(recentFiltrele(havuz, (x) => x.id)).slice(0, Math.min(10, havuz.length));
      const tumIsimler = havuz.map((x) => x.name);
      const tumTemsil = Array.from(new Set(havuz.flatMap((x) => x.representatives)));
      const tumSlogan = havuz.map((x) => x.slogan);
      const tumOzellik = havuz.flatMap((x) => x.keyFeatures);
      hazir = secilenler.map((akim) => {
        const tip = Math.floor(Math.random() * 4);
        if (tip === 0) {
          const t = akim.representatives[Math.floor(Math.random() * akim.representatives.length)];
          return {
            kategoriUst: "TEMSİLCİ → AKIM",
            vurgu: t,
            metin: "Bu sanatçı aşağıdaki akımlardan hangisinin temsilcisidir?",
            dogru: akim.name,
            secenekler: secenekUret(akim.name, tumIsimler, tumIsimler),
            aciklama: akim.hint || akim.century,
            kartId: akim.id,
          };
        }
        if (tip === 1) {
          const t = akim.representatives[Math.floor(Math.random() * akim.representatives.length)];
          const yabanci = tumTemsil.filter((x) => !akim.representatives.includes(x));
          return {
            kategoriUst: "AKIM → TEMSİLCİ",
            vurgu: akim.name,
            metin: "Bu akımın temsilcisi hangisidir?",
            dogru: t,
            secenekler: secenekUret(t, yabanci, tumTemsil),
            aciklama: akim.hint || akim.century,
            kartId: akim.id,
          };
        }
        if (tip === 2) {
          return {
            kategoriUst: "SLOGAN → AKIM",
            vurgu: akim.slogan,
            metin: "Bu söz hangi akımı özetler?",
            dogru: akim.name,
            secenekler: secenekUret(akim.name, tumIsimler, tumIsimler),
            aciklama: akim.hint || akim.century,
            kartId: akim.id,
          };
        }
        const oz = akim.keyFeatures[Math.floor(Math.random() * akim.keyFeatures.length)];
        const yabanciOz = tumOzellik.filter((x) => !akim.keyFeatures.includes(x));
        return {
          kategoriUst: "ÖZELLİK → AKIM",
          vurgu: oz,
          metin: "Bu özellik hangi akıma aittir?",
          dogru: akim.name,
          secenekler: secenekUret(akim.name, tumIsimler, tumIsimler),
          aciklama: akim.hint || oz,
          kartId: akim.id,
        };
      });
      baslik = "Batı Edebi Akımlar";
      renk = "sky";
    } else {
      let havuz: LiteratureItem[] =
        tur === "kadin"
          ? (kadinYazarlarTest as unknown as LiteratureItem[])
          : anaDonemFiltrele((param as AnaDonem) || "Tüm Dönemler");

      if (!havuz.length) havuz = anaDonemFiltrele("Tüm Dönemler");

      baslik =
        tur === "kadin"
          ? "Kadın Yazarlar"
          : param && param !== "Tüm Dönemler"
            ? String(param)
            : "Tüm Dönemler";
      renk = tur === "kadin" ? "pink" : "primary";

      const soruAdedi = 10;
      const secilenler = karistir(recentFiltrele(havuz, (x) => String(x.id))).slice(0, Math.min(soruAdedi, havuz.length));
      const tumYazarlarList = Array.from(new Set(havuz.map((x) => x.author)));
      const tumEserler = Array.from(new Set(havuz.map((x) => x.work)));

      hazir = secilenler.map((item) => {
        if (Math.random() < 0.5) {
          const yazarHavuz = yazarHavuzuBaska(item.author, havuz);
          return {
            kategoriUst: "ESERİN YAZARI",
            vurgu: item.work,
            metin: "Aşağıdaki yazarlardan hangisi bu eserin yazarıdır?",
            dogru: item.author,
            secenekler: secenekUret(item.author, yazarHavuz, tumYazarlarList),
            kartId: String(item.id),
          };
        }
        const eserHavuz = eserHavuzuBaskaYazarlar(item.work, item.author, havuz);
        return {
          kategoriUst: "YAZARIN ESERİ",
          vurgu: item.author,
          metin: "Aşağıdaki eserlerden hangisi bu yazara aittir?",
          dogru: item.work,
          secenekler: secenekUret(item.work, eserHavuz, tumEserler),
          kartId: String(item.id),
        };
      });
    }

    setSonTest({ tur, param: param ? String(param) : undefined });
    recentYaz(hazir.map((q) => q.kartId || `${q.vurgu}::${q.dogru}`));
    setStandartSorular(hazir);
    setStandartIndex(0);
    setStandartSecim(null);
    setStandartDogru(0);
    setStandartYanlis(0);
    setStandartBitti(false);
    setSeciliBaslik(baslik);
    setAksan(renk);
    setGorunum("standart");
  };

  const tekrarCoz = () => {
    if (gorunum === "osym" || (sonTest === null && osymBitti)) {
      osymBaslat();
      return;
    }
    if (sonTest) {
      if (sonTest.tur === "tekrar") standartBaslat("tekrar");
      else if (sonTest.tur === "donem") standartBaslat("donem", sonTest.param);
      else standartBaslat(sonTest.tur);
    }
  };

  const standartCevapla = (secenek: string) => {
    if (standartSecim !== null) return;
    setStandartSecim(secenek);
    const soru = standartSorular[standartIndex];
    if (secenek === soru.dogru) {
      sfxCorrect();
      setStandartDogru((p) => p + 1);
      if (soru.kartId) testDogruKaydet(soru.kartId);
    } else {
      sfxWrong();
      setStandartYanlis((p) => p + 1);
      if (soru.kartId) testYanlısKaydet(soru.kartId);
    }
  };

  const standartSonraki = () => {
    if (standartIndex + 1 < standartSorular.length) {
      setStandartIndex((p) => p + 1);
      setStandartSecim(null);
    } else {
      setStandartBitti(true);
    }
  };

  const aksanSinif = {
    primary: {
      badge: "bg-primary/15 text-primary ring-primary/30",
      btn: "bg-primary text-primary-foreground",
    },
    osym: {
      badge: "bg-osym/15 text-osym ring-osym/30",
      btn: "bg-osym text-osym-foreground",
    },
    pink: {
      badge: "bg-pink-500/15 text-pink-400 ring-pink-500/30",
      btn: "bg-pink-600 text-white",
    },
    amber: {
      badge: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
      btn: "bg-amber-600 text-white",
    },
    sky: {
      badge: "bg-sky-500/15 text-sky-400 ring-sky-500/30",
      btn: "bg-sky-600 text-white",
    },
    rose: {
      badge: "bg-rose-500/15 text-rose-400 ring-rose-500/30",
      btn: "bg-rose-600 text-white",
    },
  }[aksan];

  if (gorunum === "osym") {
    if (osymBitti) {
      const oran = Math.round((osymDogruSayi / Math.max(1, osymSorular.length)) * 100);
      return (
        <div className="flex-1 flex items-center justify-center p-4 animate-rise">
          <div className="rounded-2xl bg-card p-6 text-center shadow-xl max-w-sm w-full border border-border">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-osym/15 text-osym ring-1 ring-osym/30">
              <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="font-serif text-xl font-bold text-card-foreground">
              {bitisMesaji("osym", oran)}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {osymDogruSayi}/{osymSorular.length} doğru
              {osymEnIyiSkor > 0 ? ` · En iyi ${osymEnIyiSkor}/20` : ""}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={osymBaslat}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-osym py-3 text-sm font-bold text-osym-foreground"
              >
                <RotateCcw className="h-4 w-4" /> Tekrar Çöz
              </button>
              <button
                onClick={() => setGorunum("menu")}
                className="rounded-xl bg-muted/60 py-3 text-sm font-semibold text-foreground"
              >
                Menüye Dön
              </button>
            </div>
          </div>
        </div>
      );
    }

    const soru = osymSorular[osymAktif];
    if (!soru) return null;
    return (
      <div className="flex flex-1 min-h-0 flex-col">
        <div className="mb-3 flex items-center justify-between shrink-0">
          <button
            onClick={() => setGorunum("menu")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Menü
          </button>
          <span className="text-[11px] font-bold text-osym">
            {osymAktif + 1} / {osymSorular.length}
          </span>
        </div>
        <IlerlemeBari simdiki={osymAktif} toplam={osymSorular.length} />
        <div className="mt-3 rounded-2xl bg-card p-4 border border-border">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-osym">
            {soru.tip === "eser" ? "Yazarın eseri" : "Eserin yazarı"}
          </p>
          <h2 className="mt-1.5 font-serif text-xl font-bold leading-snug text-card-foreground">
            {soru.vurgu}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{soru.metin}</p>
          <div className="mt-3 space-y-2">
            {soru.secenekler.map((secenek, i) => {
              const secildi = osymSecim === secenek;
              const dogru = secenek === soru.dogru;
              let stil = "bg-background border border-border text-card-foreground";
              if (osymSecim) {
                if (dogru) stil = "bg-emerald-500/10 border-emerald-500/50 text-emerald-500";
                else if (secildi) stil = "bg-destructive/10 border-destructive/50 text-destructive";
                else stil = "bg-background border-border text-muted-foreground opacity-50";
              }
              return (
                <button
                  key={secenek}
                  onClick={() => osymCevapla(secenek)}
                  disabled={osymSecim !== null}
                  className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-left text-sm font-medium ${stil}`}
                >
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                      osymSecim && dogru
                        ? "bg-emerald-500 text-white"
                        : osymSecim && secildi
                          ? "bg-destructive text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {osymSecim && dogru ? (
                      <Check className="h-4 w-4" strokeWidth={3} />
                    ) : osymSecim && secildi ? (
                      <X className="h-4 w-4" strokeWidth={3} />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </span>
                  {secenek}
                </button>
              );
            })}
          </div>
          {osymSecim && (
            <button
              onClick={osymSonraki}
              className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl bg-osym py-3 text-sm font-bold text-osym-foreground"
            >
              {osymAktif + 1 >= osymSorular.length ? "Sonuç" : "Sonraki"}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (gorunum === "standart") {
    if (standartBitti) {
      const toplam = Math.max(1, standartSorular.length);
      const basariOrani = Math.round((standartDogru / toplam) * 100);
      const bitisMod: BitisMod =
        aksan === "rose"
          ? "tekrar"
          : aksan === "pink"
            ? "kadin"
            : aksan === "amber"
              ? "kahraman"
              : aksan === "sky"
                ? "akim"
                : "donem";
      const basariBaslik = bitisMesaji(bitisMod, basariOrani);
      return (
        <div className="flex-1 flex items-center justify-center p-4 animate-rise">
          <div className="rounded-2xl bg-card p-6 text-center shadow-xl max-w-sm w-full border border-border">
            <div className={`mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl ring-1 ${aksanSinif.badge}`}>
              <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="font-serif text-xl font-bold text-card-foreground text-balance px-1">
              {basariBaslik}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {seciliBaslik} tamamlandı.
              {aksan === "rose"
                ? " Doğru bildiklerin listeden düşer; yanlışlar kalır."
                : standartSorular[0]?.kartId
                  ? " Yanlışlar Kaçırdıkların’a eklendi."
                  : ""}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-3 ring-1 ring-emerald-500/20">
                <span className="text-[10px] font-bold uppercase text-emerald-500">Doğru</span>
                <p className="mt-0.5 text-2xl font-black text-emerald-500">{standartDogru}</p>
              </div>
              <div className="rounded-xl bg-destructive/10 p-3 ring-1 ring-destructive/20">
                <span className="text-[10px] font-bold uppercase text-destructive">Yanlış</span>
                <p className="mt-0.5 text-2xl font-black text-destructive">{standartYanlis}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={tekrarCoz}
                className={`inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold ${aksanSinif.btn}`}
              >
                <RotateCcw className="h-4 w-4" /> Tekrar Çöz
              </button>
              <button
                onClick={() => setGorunum("menu")}
                className="rounded-xl bg-muted/60 py-3 text-sm font-semibold text-foreground"
              >
                Menüye Dön
              </button>
            </div>
          </div>
        </div>
      );
    }

    const soru = standartSorular[standartIndex];
    if (!soru) return null;
    return (
      <div className="flex flex-1 min-h-0 flex-col">
        <div className="mb-3 flex items-center justify-between shrink-0">
          <button
            onClick={() => setGorunum("menu")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Menü
          </button>
          <span className="text-[11px] font-bold text-muted-foreground">
            {standartIndex + 1} / {standartSorular.length}
          </span>
        </div>
        <IlerlemeBari simdiki={standartIndex} toplam={standartSorular.length} />
        <div className="mt-3 rounded-2xl bg-card p-4 border border-border">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${aksan === "rose" ? "text-rose-400" : aksan === "pink" ? "text-pink-400" : aksan === "amber" ? "text-amber-400" : aksan === "sky" ? "text-sky-400" : "text-primary"}`}>
            {soru.kategoriUst}
          </p>
          <h2 className="mt-1.5 font-serif text-xl font-bold leading-snug text-card-foreground">
            {soru.vurgu}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{soru.metin}</p>
          <div className="mt-3 space-y-2">
            {soru.secenekler.map((secenek, i) => {
              const secildi = standartSecim === secenek;
              const dogru = secenek === soru.dogru;
              let stil = "bg-background border border-border text-card-foreground";
              if (standartSecim) {
                if (dogru) stil = "bg-emerald-500/10 border-emerald-500/50 text-emerald-500";
                else if (secildi) stil = "bg-destructive/10 border-destructive/50 text-destructive";
                else stil = "bg-background border-border text-muted-foreground opacity-50";
              }
              return (
                <button
                  key={secenek}
                  onClick={() => standartCevapla(secenek)}
                  disabled={standartSecim !== null}
                  className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-left text-sm font-medium ${stil}`}
                >
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                      standartSecim && dogru
                        ? "bg-emerald-500 text-white"
                        : standartSecim && secildi
                          ? "bg-destructive text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {standartSecim && dogru ? (
                      <Check className="h-4 w-4" strokeWidth={3} />
                    ) : standartSecim && secildi ? (
                      <X className="h-4 w-4" strokeWidth={3} />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </span>
                  <span className="flex-1">{secenek}</span>
                </button>
              );
            })}
          </div>
          {standartSecim && soru.aciklama && (
            <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground rounded-xl bg-muted/40 p-3">
              {soru.aciklama}
            </p>
          )}
          {standartSecim && (
            <button
              onClick={standartSonraki}
              className={`mt-4 flex w-full items-center justify-center gap-1 rounded-xl py-3 text-sm font-bold ${aksanSinif.btn}`}
            >
              {standartIndex + 1 >= standartSorular.length ? "Sonuç" : "Sonraki"}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (gorunum === "donem_secim") {
    return (
      <div className="flex flex-1 min-h-0 flex-col">
        <button
          onClick={() => setGorunum("menu")}
          className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground shrink-0"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Menü
        </button>
        <h2 className="font-serif text-lg font-bold text-card-foreground mb-3">Dönem seç</h2>
        <div className="grid gap-2">
          {anaDonemler.map((d) => (
            <button
              key={d}
              onClick={() => standartBaslat("donem", d)}
              className="flex items-center justify-between rounded-xl bg-card border border-border p-3.5 text-left"
            >
              <span className="text-sm font-semibold text-card-foreground">{d}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-2.5 pb-4">
      <button
        onClick={() => setGorunum("donem_secim")}
        className="flex items-center justify-between rounded-2xl bg-card border border-border p-3.5 text-left shadow-sm transition hover:bg-muted/40 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="font-serif text-sm font-bold text-card-foreground">Dönem Testi</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Yazar–eser, döneme göre</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
      </button>

      <button
        onClick={osymBaslat}
        className="group flex items-center justify-between rounded-2xl bg-card border border-osym/30 p-3.5 text-left shadow-sm transition hover:bg-osym/5 active:scale-[0.99]"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-osym text-osym-foreground shadow-[0_0_16px_rgba(249,115,22,0.3)]">
              <Flame className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-serif text-sm font-bold text-card-foreground">ÖSYM Sever</p>
                <span className="rounded-full bg-osym/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-osym">
                  Çıkmış Soru
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Dönem sınırı yok! Banko sorularla gerçek prova 🔥
                {osymEnIyiSkor > 0 ? ` · En iyi: ${osymEnIyiSkor}/20` : ""}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-osym/70 transition-transform group-hover:translate-x-0.5" />
        </div>
      </button>

      <button
        onClick={() => {
          if (tekrarSayisi === 0) return;
          standartBaslat("tekrar");
        }}
        disabled={tekrarSayisi === 0}
        className={`flex items-center justify-between rounded-2xl border p-3.5 text-left shadow-sm transition active:scale-[0.99] ${
          tekrarSayisi === 0
            ? "bg-card/50 border-border/40 opacity-55 cursor-not-allowed"
            : "bg-card border-rose-500/35 hover:bg-rose-500/5 hover:border-rose-500/60"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/25">
            <RotateCcw className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-serif text-sm font-bold text-card-foreground">Kaçırdıkların</p>
              {tekrarSayisi > 0 && (
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[9px] font-extrabold text-rose-400">
                  {tekrarSayisi}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {tekrarSayisi === 0
                ? "Boş — yanlışın buraya düşer, doğru yapınca çıkar"
                : `${tekrarSayisi} açık — buradan kapat`}
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
      </button>

      <button
        onClick={() => standartBaslat("kadin")}
        className="flex items-center justify-between rounded-2xl bg-card border border-border p-3.5 transition hover:bg-muted/40 active:scale-[0.99] text-left shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-pink-500/15 text-pink-500 ring-1 ring-pink-500/25 text-base">
            🌸
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-serif text-sm font-bold text-card-foreground">Kadın Yazarlar</p>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Seçki · yazar–eser</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
      </button>

      <button
        onClick={() => standartBaslat("kahraman")}
        className="flex items-center justify-between rounded-2xl bg-card border border-border p-3.5 transition hover:bg-muted/40 active:scale-[0.99] text-left shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/25">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="font-serif text-sm font-bold text-card-foreground">Eser – Kahraman</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Karakter eşlemesi</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
      </button>

      <button
        onClick={() => standartBaslat("akim")}
        className="flex items-center justify-between rounded-2xl bg-card border border-border p-3.5 transition hover:bg-muted/40 active:scale-[0.99] text-left shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/25">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <p className="font-serif text-sm font-bold text-card-foreground">Batı Edebi Akımlar</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Parnasizm, sembolizm…</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
      </button>
    </div>
  );
}
