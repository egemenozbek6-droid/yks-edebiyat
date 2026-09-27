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
    return JSON.parse(localStorage.getItem(TEST_LEITNER_KEY) || "{}");
  } catch {
    return {};
  }
}

function testLeitnerYaz(veriler: Record<string, TestHafiza>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TEST_LEITNER_KEY, JSON.stringify(veriler));
}

function testYanlısKaydet(kartId: string) {
  const veriler = testLeitnerOku();
  const mevcut = veriler[kartId] ?? { kutu: 1 as TestKutu, sonTekrar: 0, tekrarSayisi: 0 };
  veriler[kartId] = {
    kutu: 1,
    sonTekrar: Date.now(),
    tekrarSayisi: mevcut.tekrarSayisi + 1,
  };
  testLeitnerYaz(veriler);
}

function testDogruKaydet(kartId: string) {
  const veriler = testLeitnerOku();
  const mevcut = veriler[kartId] ?? { kutu: 1 as TestKutu, sonTekrar: 0, tekrarSayisi: 0 };
  veriler[kartId] = {
    kutu: Math.min(3, mevcut.kutu + 1) as TestKutu,
    sonTekrar: Date.now(),
    tekrarSayisi: mevcut.tekrarSayisi + 1,
  };
  testLeitnerYaz(veriler);
}

function testTekrarIdleri(): string[] {
  const veriler = testLeitnerOku();
  // Kutu 1 her zaman; kutu 2/3 için 3/7 gün aralığı
  const ARALIK: Record<TestKutu, number> = {
    1: 0,
    2: 3 * 24 * 60 * 60 * 1000,
    3: 7 * 24 * 60 * 60 * 1000,
  };
  return Object.keys(veriler).filter((id) => {
    const h = veriler[id];
    if (h.kutu === 1) return true;
    return Date.now() - h.sonTekrar >= ARALIK[h.kutu];
  });
}

import IlerlemeBari from "@/components/IlerlemeBari";

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

/** Peş peşe / yakın geçmişte çıkanları geriye at */
function recentFiltrele<T>(liste: T[], anahtarFn: (x: T) => string): T[] {
  const recent = new Set(recentOku());
  const taze = liste.filter((x) => !recent.has(anahtarFn(x)));
  // Tümü recent ise yine listeyi kullan (kilitlenmesin)
  return taze.length >= Math.min(5, liste.length) ? taze : liste;
}


/** Mod + başarı oranına göre samimi bitiş mesajı */
type BitisMod = "osym" | "donem" | "kadin" | "kahraman" | "akim";

const BITIS_MESAJLARI: Record<BitisMod, { super: string[]; iyi: string[]; orta: string[]; dusuk: string[] }> = {
  osym: {
    super: [
      "Banko avcısı kesilmişsin, ÖSYM seninle gurur duyar.",
      "Bu formla sınavda kimse sana yetişemez valla.",
      "20 üzerinden bu skor? Efsane, devam böyle.",
    ],
    iyi: [
      "İyi gidiyorsun, birkaç banko daha ezberle süpersin.",
      "Neredeyse mükemmel, ufak tefek açıklar kapatılır.",
      "Form yerinde, bir tur daha at istersen.",
    ],
    orta: [
      "Orta karar, bankoları biraz daha yokla.",
      "Eh işte… Yanlışlar Kutu 1'e gitti, tekrar çöz.",
      "Potansiyel var, bir tur daha basarsan toparlarsın.",
    ],
    dusuk: [
      "Bu tur ısınma turu sayalım, tekrar dene.",
      "Yanlışlar hazine: hepsi Kutu 1'de seni bekliyor.",
      "Moral bozma, banko listesi seninle henüz tanışmadı.",
    ],
  },
  donem: {
    super: [
      "Bu dönemi ezberlemişsin resmen, aferin.",
      "Dönem hakimiyeti tam, sınavda işine yarar.",
      "Bu skorla o dönemden soru gelirse gülersin.",
    ],
    iyi: [
      "Sağlam bir tur, ufak boşluklar kalmış sadece.",
      "İyi iş çıkardın, bir tur daha pekiştirir.",
      "Neredeyse full, son dokunuşlar kaldı.",
    ],
    orta: [
      "Orta seviye, o döneme biraz daha dal.",
      "Kartlara dön, yanlışlar seni bekliyor.",
      "Eh, idare eder; tekrar çözünce toparlarsın.",
    ],
    dusuk: [
      "Bu dönem seni zorlamış, kartlarla ısın tekrar.",
      "Sakin ol, her yanlış bir sonraki doğru demek.",
      "Baştan bir tur daha, bu sefer daha iyi olur.",
    ],
  },
  kadin: {
    super: [
      "Kadın edebiyatçılarımız senden razı, süpersin.",
      "Bu seçkiyi ezberlemişsin, tebrikler.",
      "Halide'den Adalet'e kadar herkes seninle.",
    ],
    iyi: [
      "Güzel tur, birkaç isim daha pekişsin yeter.",
      "İyi gidiyorsun, bir tur daha bas istersen.",
      "Neredeyse perfect, ufak açıklar var.",
    ],
    orta: [
      "Orta karar, kadın yazar seçkisine bir daha bak.",
      "Yanlışlar Kutu 1'de, oradan toparlarsın.",
      "İdare eder; tekrar çözünce netleşir.",
    ],
    dusuk: [
      "Bu tur ısınma oldu, tekrar dene gönül rahatlığıyla.",
      "Moral bozma, seçki seni bekliyor.",
      "Kartlarla bir tur at, sonra teste dön.",
    ],
  },
  kahraman: {
    super: [
      "Karakter avcısı kesilmişsin, efsane tur.",
      "Eser-kahraman eşlemesi sende parmak ısırtır.",
      "Ali Bey'den Rabia'ya kadar hepsi seninle.",
    ],
    iyi: [
      "İyi eşleştirmeler, birkaç karakter daha pekişsin.",
      "Güzel form, bir tur daha basarsan fullersin.",
      "Neredeyse hepsi tuttu, ufak tefek kaldı.",
    ],
    orta: [
      "Orta seviye, karakter notlarına bir göz at.",
      "Bilgi notları altın değerinde, tekrar çöz.",
      "Eh işte… Bir tur daha iyi gelir.",
    ],
    dusuk: [
      "Karakterler seni şaşırtmış, bilgi notlarını oku.",
      "Isınma turu say, tekrar dene.",
      "Sakin, her yanlış bir sonraki eşleşme demek.",
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
    const eslesen = gecerliYazarlar().find(
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
      const lit = gecerliYazarlar();
      const ek = eserKahramanData as EserKahramanItem[];
      const ak = batiAkimlarData as BatiAkimItem[];
      const pool: StandartSoru[] = [];

      for (const id of tekrarIdleri) {
        const litItem = lit.find((x) => String(x.id) === id);
        if (litItem) {
          const tumY = Array.from(new Set(lit.map((x) => x.author)));
          const tumE = Array.from(new Set(lit.map((x) => x.work)));
          if (Math.random() < 0.5) {
            pool.push({
              kategoriUst: "PEKİŞTİRME",
              rozetMetin: undefined,
              vurgu: litItem.work,
              metin: "Aşağıdaki yazarlardan hangisi bu eserin yazarıdır?",
              dogru: litItem.author,
              secenekler: secenekUret(litItem.author, tumY, tumY),
              kartId: id,
            });
          } else {
            pool.push({
              kategoriUst: "PEKİŞTİRME",
              rozetMetin: undefined,
              vurgu: litItem.author,
              metin: "Aşağıdaki eserlerden hangisi bu yazara aittir?",
              dogru: litItem.work,
              secenekler: secenekUret(litItem.work, tumE, tumE),
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
            kategoriUst: "PEKİŞTİRME · KARAKTER",
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
            kategoriUst: "PEKİŞTİRME · AKIM",
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
        // boşsa menüde kal; UI uyarı menü kartında
        return;
      }

      hazir = karistir(pool).slice(0, Math.min(15, pool.length));
      baslik = "Tekrar Köşen";
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
      renk = "amber";
      baslik = "Eser – Kahraman";

      hazir = secilenler.map((item) => {
        const ipucu = item.hint
          ? item.hint
          : `${item.period} · ${item.author}`;
        if (Math.random() < 0.5) {
          return {
            kategoriUst: "ESER – KARAKTER",
            rozetMetin: "Karakter",
            vurgu: item.character,
            metin: "Bu karakter aşağıdaki eserlerin hangisinde yer alır?",
            dogru: item.work,
            secenekler: secenekUret(item.work, tumEserler, tumEserler),
            aciklama: ipucu,
            kartId: item.id,
          };
        }
        return {
          kategoriUst: "ESER – KARAKTER",
          rozetMetin: "Karakter",
          vurgu: item.work,
          metin: "Aşağıdaki karakterlerden hangisi bu eserde yer alır?",
          dogru: item.character,
          secenekler: secenekUret(item.character, tumKarakterler, tumKarakterler),
          aciklama: ipucu,
          kartId: item.id,
        };
      });
    } else if (tur === "akim") {
      const akimlar = batiAkimlarData as BatiAkimItem[];
      if (!akimlar.length) return;
      const tumIsimler = akimlar.map((a) => a.name);
      const tumTemsilciler = Array.from(new Set(akimlar.flatMap((a) => a.representatives)));
      const pool: StandartSoru[] = [];
      renk = "sky";
      baslik = "Batı Edebi Akımları";

      for (const akim of akimlar) {
        const temsilci =
          akim.representatives[Math.floor(Math.random() * akim.representatives.length)];

        pool.push({
          kategoriUst: "BATI EDEBİ AKIMLARI",
          rozetMetin: "Akım",
          vurgu: temsilci,
          metin: "Bu sanatçı aşağıdaki akımlardan hangisinin temsilcisidir?",
          dogru: akim.name,
          secenekler: secenekUret(akim.name, tumIsimler, tumIsimler),
          aciklama: akim.hint || akim.century,
          kartId: akim.id,
        });

        pool.push({
          kategoriUst: "BATI EDEBİ AKIMLARI",
          rozetMetin: "Akım",
          vurgu: `"${akim.slogan}"`,
          metin: "Bu slogan / ilke hangi edebiyat akımına aittir?",
          dogru: akim.name,
          secenekler: secenekUret(akim.name, tumIsimler, tumIsimler),
          aciklama: akim.hint || akim.century,
          kartId: akim.id,
        });

        const ozellik = akim.keyFeatures[Math.floor(Math.random() * akim.keyFeatures.length)];
        pool.push({
          kategoriUst: "BATI EDEBİ AKIMLARI",
          rozetMetin: "Akım",
          vurgu: ozellik,
          metin: "Bu özellik aşağıdaki akımlardan hangisine aittir?",
          dogru: akim.name,
          secenekler: secenekUret(akim.name, tumIsimler, tumIsimler),
          aciklama: akim.hint || akim.century,
          kartId: akim.id,
        });

        const yanlisTemsilciler = tumTemsilciler.filter((t) => !akim.representatives.includes(t));
        pool.push({
          kategoriUst: "BATI EDEBİ AKIMLARI",
          rozetMetin: "Akım",
          vurgu: akim.name,
          metin: "Aşağıdakilerden hangisi bu akımın temsilcilerinden biridir?",
          dogru: temsilci,
          secenekler: secenekUret(temsilci, yanlisTemsilciler, tumTemsilciler),
          aciklama: akim.hint || akim.century,
          kartId: akim.id,
        });
      }
      hazir = karistir(pool).slice(0, 10);
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

      const secilenler = karistir(recentFiltrele(havuz, (x) => String(x.id))).slice(0, Math.min(15, havuz.length));
      const tumYazarlarList = Array.from(new Set(havuz.map((x) => x.author)));
      const tumEserler = Array.from(new Set(havuz.map((x) => x.work)));

      hazir = secilenler.map((item) => {
        if (Math.random() < 0.5) {
          return {
            kategoriUst: "ESERİN YAZARI",
            vurgu: item.work,
            metin: "Aşağıdaki yazarlardan hangisi bu eserin yazarıdır?",
            dogru: item.author,
            secenekler: secenekUret(item.author, tumYazarlarList, tumYazarlarList),
            kartId: String(item.id),
          };
        }
        return {
          kategoriUst: "YAZARIN ESERİ",
          vurgu: item.author,
          metin: "Aşağıdaki eserlerden hangisi bu yazara aittir?",
          dogru: item.work,
          secenekler: secenekUret(item.work, tumEserler, tumEserler),
          kartId: String(item.id),
        };
      });
    }

    setSonTest({ tur: tur === "tekrar" ? "tekrar" : tur, param: param ? String(param) : undefined });
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
      badge: "bg-pink-500/15 text-pink-500 ring-pink-500/30",
      btn: "bg-pink-500 text-white",
    },
    amber: {
      badge: "bg-amber-500/15 text-amber-500 ring-amber-500/30",
      btn: "bg-amber-500 text-white",
    },
    sky: {
      badge: "bg-sky-500/15 text-sky-500 ring-sky-500/30",
      btn: "bg-sky-500 text-white",
    },
    rose: {
      badge: "bg-rose-500/15 text-rose-400 ring-rose-500/30",
      btn: "bg-rose-500 text-white",
    },
  }[aksan];

  // ÖSYM EKRANI
  if (gorunum === "osym") {
    if (osymBitti) {
      const oran = Math.round((osymDogruSayi / Math.max(osymSorular.length, 1)) * 100);
      const basari = bitisMesaji("osym", oran);
      const yeniRekor = osymDogruSayi >= osymEnIyiSkor && osymDogruSayi > 0;

      return (
        <div className="animate-rise rounded-2xl bg-card p-6 text-center border border-border max-w-sm mx-auto w-full my-auto">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-osym/15 text-osym ring-1 ring-osym/30">
            <Flame className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-xl font-bold text-card-foreground text-balance px-1">{basari}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {osymSorular.length} soruda{" "}
            <span className="font-bold text-osym">{osymDogruSayi}</span> doğru — %{oran}
          </p>
          {yeniRekor && <p className="mt-1.5 text-xs font-bold text-amber-500">🏆 Yeni Rekor!</p>}
          <div className="mt-5">
            <IlerlemeBari mevcut={osymDogruSayi} toplam={osymSorular.length} etiket="Doğru cevap" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2.5">
            <button
              onClick={osymBaslat}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-osym py-3 text-xs font-bold text-osym-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
            >
              <RotateCcw className="h-4 w-4" /> Tekrar Çöz
            </button>
            <button
              onClick={() => setGorunum("menu")}
              className="rounded-xl bg-muted/60 py-3 text-xs font-semibold text-muted-foreground hover:bg-muted active:scale-[0.98]"
            >
              Menüye Dön
            </button>
          </div>
        </div>
      );
    }

    const soru = osymSorular[osymAktif];
    if (!soru) return null;

    return (
      <div className="animate-rise max-w-xl mx-auto w-full flex flex-col flex-1 justify-between p-1">
        <div>
          <div className="mb-4 rounded-2xl bg-card border border-border p-3 shadow-sm">
            <IlerlemeBari
              mevcut={osymAktif + (osymSecim ? 1 : 0)}
              toplam={osymSorular.length}
              etiket="Soru"
              sagEtiket={`${osymAktif + 1} / ${osymSorular.length} · ${osymDogruSayi} doğru`}
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-osym">
                <Flame className="h-3.5 w-3.5" /> Banko ÖSYM Sorusu
              </span>
              <button
                onClick={() => setGorunum("menu")}
                className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-[11px] font-semibold text-destructive ring-1 ring-destructive/20 transition hover:bg-destructive/15 active:scale-95"
              >
                <X className="h-3 w-3" /> Çıkış
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-card p-5 border border-border shadow-lg">
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
            <h2 className="mt-2 font-serif text-2xl font-bold leading-snug text-balance text-card-foreground">
              {soru.vurgu}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{soru.metin}</p>

            <div className="mt-5 space-y-2.5">
              {soru.secenekler.map((secenek, i) => {
                const secildi = osymSecim === secenek;
                const dogruSecenek = secenek === soru.dogru;
                const gosterDogru = osymSecim !== null && dogruSecenek;
                const gosterYanlis = secildi && !dogruSecenek;

                let stil =
                  "bg-background border border-border text-card-foreground hover:border-osym/60 hover:bg-muted/40";
                if (gosterDogru)
                  stil = "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400";
                else if (gosterYanlis) stil = "bg-destructive/10 border-destructive/50 text-destructive";
                else if (osymSecim !== null)
                  stil = "bg-background border-border text-muted-foreground opacity-50";

                return (
                  <button
                    key={secenek}
                    onClick={() => osymCevapla(secenek)}
                    disabled={osymSecim !== null}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition-colors ${stil} ${
                      gosterYanlis ? "animate-shake" : ""
                    } ${osymSecim === null ? "active:scale-[0.99]" : ""}`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold tabular-nums ${
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

            {osymSecim !== null && (
              <button
                onClick={osymSonraki}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-osym py-3.5 text-sm font-bold text-osym-foreground shadow-md transition hover:brightness-110 active:scale-[0.98] animate-rise"
              >
                {osymAktif + 1 >= osymSorular.length ? "Sonucu Gör" : "Sonraki Soru"}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // STANDART TEST EKRANI
  if (gorunum === "standart") {
    if (standartBitti) {
      const basariOrani = Math.round(
        (standartDogru / Math.max(standartSorular.length, 1)) * 100,
      );
      const bitisMod: BitisMod =
        aksan === "pink"
          ? "kadin"
          : aksan === "amber"
            ? "kahraman"
            : aksan === "sky"
              ? "akim"
              : aksan === "rose" || aksan === "osym"
                ? "osym"
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
              {seciliBaslik} testi tamamlandı.
              {/^\d+$/.test(standartSorular[0]?.kartId || "")
                ? " Yanlışlar Tekrar Köşene eklendi."
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
            <div className="mt-3 rounded-xl bg-muted/40 p-2.5 text-xs font-semibold text-muted-foreground">
              Başarı Oranı: <span className="text-foreground font-bold">%{basariOrani}</span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <button
                onClick={tekrarCoz}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold shadow-md transition hover:brightness-110 active:scale-[0.98] ${aksanSinif.btn}`}
              >
                <RotateCcw className="h-4 w-4" /> Tekrar Çöz
              </button>
              <button
                onClick={() => setGorunum("menu")}
                className="rounded-xl bg-muted/60 py-3 text-xs font-semibold text-muted-foreground hover:bg-muted active:scale-[0.98]"
              >
                Menüye Dön
              </button>
            </div>
          </div>
        </div>
      );
    }

    const aktifSoru = standartSorular[standartIndex];
    if (!aktifSoru) return null;

    return (
      <div className="flex-1 flex flex-col justify-between p-1 max-w-xl mx-auto w-full animate-rise">
        <div>
          <div className="mb-4 rounded-2xl bg-card border border-border p-3 shadow-sm">
            <IlerlemeBari
              mevcut={standartIndex + (standartSecim ? 1 : 0)}
              toplam={standartSorular.length}
              etiket="Soru"
              sagEtiket={`${standartIndex + 1} / ${standartSorular.length} · ${standartDogru} doğru`}
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground truncate max-w-[200px]">
                {seciliBaslik}
              </span>
              <button
                onClick={() => setGorunum("menu")}
                className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-[11px] font-semibold text-destructive ring-1 ring-destructive/20 transition hover:bg-destructive/15 active:scale-95"
              >
                <X className="h-3 w-3" /> Çıkış
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-card p-5 border border-border shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {aktifSoru.kategoriUst}
              </p>
              {aktifSoru.rozetMetin && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${aksanSinif.badge}`}>
                  {aksan === "amber" ? "🎭 " : aksan === "sky" ? "🌐 " : aksan === "pink" ? "🌸 " : aksan === "osym" ? "🔥 " : ""}
                  {aktifSoru.rozetMetin}
                </span>
              )}
            </div>

            <h2 className="mt-2 font-serif text-2xl font-bold leading-snug text-balance text-card-foreground">
              {aktifSoru.vurgu}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
              {aktifSoru.metin}
            </p>
            {/* Cevap sonrası Bilgi notu (kahraman / akım hint) */}
            {standartSecim !== null && aktifSoru.aciklama && (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-left animate-rise">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                  Bilgi notu
                </p>
                <p className="mt-1 text-xs leading-relaxed text-card-foreground/90 text-pretty">
                  {aktifSoru.aciklama}
                </p>
              </div>
            )}

            <div className="mt-5 space-y-2.5">
              {aktifSoru.secenekler.map((secenek, i) => {
                const secildi = standartSecim === secenek;
                const dogruMu = secenek === aktifSoru.dogru;
                const gosterDogru = standartSecim !== null && dogruMu;
                const gosterYanlis = secildi && !dogruMu;

                const hoverByMode =
                  aksan === "pink"
                    ? "hover:border-pink-500/50 hover:bg-pink-500/10"
                    : aksan === "amber"
                      ? "hover:border-amber-500/50 hover:bg-amber-500/10"
                      : aksan === "sky"
                        ? "hover:border-sky-500/50 hover:bg-sky-500/10"
                        : aksan === "osym"
                          ? "hover:border-osym/50 hover:bg-osym/10"
                          : aksan === "rose"
                            ? "hover:border-rose-500/50 hover:bg-rose-500/10"
                            : "hover:border-primary/50 hover:bg-primary/10";

                let stil = `bg-background border border-border text-card-foreground ${hoverByMode}`;
                if (gosterDogru)
                  stil =
                    "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 font-semibold";
                else if (gosterYanlis)
                  stil = "bg-destructive/10 border-destructive/50 text-destructive font-semibold";
                else if (standartSecim !== null)
                  stil = "bg-background border-border text-muted-foreground opacity-50";

                return (
                  <button
                    key={`${secenek}-${i}`}
                    onClick={() => standartCevapla(secenek)}
                    disabled={standartSecim !== null}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition-colors ${stil} ${
                      gosterYanlis ? "animate-shake" : ""
                    } ${standartSecim === null ? "active:scale-[0.99]" : ""}`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold tabular-nums ${
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
                    <span className="flex-1 text-pretty">{secenek}</span>
                    {standartSecim !== null && dogruMu && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    )}
                    {standartSecim !== null && secildi && !dogruMu && (
                      <XCircle className="h-5 w-5 text-destructive shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

          </div>

          {standartSecim !== null && (
            <div className="sticky bottom-0 z-10 mt-4 -mx-1 px-1 pb-1 pt-2 bg-gradient-to-t from-background via-background to-transparent">
              <button
                onClick={standartSonraki}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold shadow-lg transition hover:brightness-110 active:scale-[0.98] animate-rise ${aksanSinif.btn}`}
              >
                {standartIndex + 1 >= standartSorular.length ? "Testi Bitir" : "Sonraki Soru"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // DÖNEM SEÇİM
  if (gorunum === "donem_secim") {
    return (
      <div className="flex-1 flex flex-col gap-3 p-1 animate-rise max-w-md mx-auto w-full">
        <button
          onClick={() => setGorunum("menu")}
          className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition px-1 py-1"
        >
          <ArrowLeft className="h-4 w-4" /> Kategorilere Dön
        </button>

        <div className="rounded-2xl bg-card border border-border p-5 text-center shadow-sm">
          <h2 className="font-serif text-lg font-bold text-card-foreground">Bir Dönem Seç</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Eksiğin olan dönemi belirle ve teste dal!
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => standartBaslat("donem", "Tüm Dönemler")}
            className="flex items-center gap-3 rounded-2xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-md transition hover:brightness-110 active:scale-[0.99]"
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
                className="flex items-center gap-3.5 rounded-2xl bg-card border border-border px-4 py-3.5 text-left text-sm font-semibold text-card-foreground shadow-sm transition hover:bg-muted/50 active:scale-[0.99]"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <span className="flex-1 truncate">{donem}</span>
              </button>
            ))}
        </div>
      </div>
    );
  }

  // ANA MENÜ
  return (
    <div className="flex-1 flex flex-col gap-2 p-1 animate-rise max-w-md mx-auto w-full">
      <div className="rounded-2xl bg-card border border-border px-4 py-4 text-center shadow-sm">
        <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
          <Brain className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <h2 className="font-serif text-lg font-bold text-card-foreground">Test Modu</h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Dönem, banko ve özel seçkilerle prova
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {/* 1. Dönem Testleri */}
        <button
          onClick={() => setGorunum("donem_secim")}
          className="flex items-center justify-between rounded-2xl bg-card border border-border p-3.5 transition hover:bg-muted/40 active:scale-[0.99] text-left shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-sm font-bold text-card-foreground">Dönem Testleri</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Eksiklerini dönemi bul, teste başla! 🚀
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
        </button>

        {/* 2. ÖSYM Sever */}
        <button
          onClick={osymBaslat}
          className="group relative overflow-hidden rounded-2xl border border-osym/40 bg-gradient-to-br from-osym/15 via-card to-card p-3.5 text-left shadow-md transition-all hover:border-osym/70 active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-osym text-osym-foreground shadow-[0_0_16px_rgba(249,115,22,0.3)]">
                <Flame className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-serif text-sm font-bold text-card-foreground">ÖSYM Sever</p>
                  <span className="rounded-full bg-osym/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-osym">
                    Canlı
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Sadece çıkmış yazar ve eserler, özel denemelerle kendini sına!🔥
                  {osymEnIyiSkor > 0 ? ` · En iyi: ${osymEnIyiSkor}/20` : ""}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-osym/70 transition-transform group-hover:translate-x-0.5" />
          </div>
        </button>

        {/* 3. Tekrar Köşen */}
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
                <p className="font-serif text-sm font-bold text-card-foreground">Tekrar Köşen</p>
                {tekrarSayisi > 0 && (
                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[9px] font-extrabold text-rose-400">
                    {tekrarSayisi}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {tekrarSayisi === 0
                  ? "Boş/yanlış yaptıkça burada birikir"
                  : "Yapamadığın sorular burada!"}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
        </button>

        {/* 4. Kadın Yazarlar */}
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
                <p className="font-serif text-sm font-bold text-card-foreground">
                  Kadın Yazarlar & Eserleri
                </p>
                <span className="rounded-full bg-pink-500/15 px-1.5 py-0.5 text-[9px] font-bold text-pink-500">
                  Özel
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Sadece kadın yazar ve eserleri! 🌸
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
        </button>

        {/* 5. Eser – Kahraman */}
        <button
          onClick={() => standartBaslat("kahraman")}
          className="flex items-center justify-between rounded-2xl bg-card border border-border p-3.5 transition hover:bg-muted/40 active:scale-[0.99] text-left shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/25">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-serif text-sm font-bold text-card-foreground">Eser – Kahraman</p>
                <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-500">
                  Karakter
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Eser ↔ karakter eşleştir, sınavda kaçrıma! 🎭
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
        </button>

        {/* 6. Batı Edebi Akımları */}
        <button
          onClick={() => standartBaslat("akim")}
          className="flex items-center justify-between rounded-2xl bg-card border border-border p-3.5 transition hover:bg-muted/40 active:scale-[0.99] text-left shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/15 text-sky-500 ring-1 ring-sky-500/25">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-serif text-sm font-bold text-card-foreground">
                  Batı Edebi Akımları
                </p>
                <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[9px] font-bold text-sky-500">
                  Akım
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Akımları, temsilcileri ve özellikleriyle tanı! 🌐
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
        </button>
      </div>
    </div>
  );
}
