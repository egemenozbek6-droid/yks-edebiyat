"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronRight,
  Clock,
  Flame,
  Hop as Home,
  KeyRound,
  Lock,
  Search,
  Swords,
  Trophy,
  CircleUser as UserCircle,
  X,
  Zap,
} from "lucide-react";
import { type Soru } from "@/lib/soru";
import {
  mevcutKullanici,
  mevcutIstatistik,
  istatistikGuncelle,
  kazanilanPuan,
  kullaniciKaydet,
  kullaniciAdiKontrol,
} from "@/lib/user";
import { rastgeleBot, botGecikme, botDogruMu, botBonus } from "@/lib/bots";
import { avatarEmoji, rastgeleAvatarId } from "@/lib/avatars";
import { firebaseAktif } from "@/lib/firebase";
import {
  rankedKuyrugaKatil,
  rankedKuyruktanCik,
  odaKurOnline,
  odayaKatilOnline,
  odaSil,
  matchDinle,
  katilanMatchBekle,
  cevapGonder,
  sonrakiSoru,
  matchBitir,
  matchTerk,
  kullaniciAdiKaydetOnline,
  RANKED_BOT_FALLBACK_SURESI,
  type OnlineMac,
} from "@/lib/matchmaking";
import type { Unsubscribe } from "firebase/firestore";
import type { Istatistik, Kullanici, MacSonucu, Rakip } from "@/lib/types";

type Adim = "nick" | "lobi" | "aratma" | "oda" | "oda_bekleme" | "duelo" | "sonuc";
type DueloModu = "ranked" | "friendly";

const SORU_SAYISI = 10;
const SURE = 10;
const ZAMAN_ASIMI = "__zaman_asimi__";
const BEKLEME_SURESI = 1500;

type Props = {
  onCikis: () => void;
  onDueloAktifDegisti: (aktif: boolean) => void;
  onProfilAc: () => void;
  onCikisOnayGerekir: (mesaj: string, onOnayla: () => void) => void;
};

export default function DueloModulu({
  onCikis,
  onDueloAktifDegisti,
  onProfilAc,
  onCikisOnayGerekir,
}: Props) {
  const [adim, setAdim] = useState<Adim>("lobi");
  const [kullanici, setKullanici] = useState<Kullanici | null>(null);
  const [istatistik, setIstatistik] = useState<Istatistik | null>(null);

  const [nickInput, setNickInput] = useState("");
  const [nickHata, setNickHata] = useState("");
  const [nickKontrol, setNickKontrol] = useState<{ musait: boolean; mesaj: string } | null>(null);

  const [odaInput, setOdaInput] = useState("");
  const [olusturulanKod, setOlusturulanKod] = useState("");
  const [odaHata, setOdaHata] = useState("");
  const [friendlySoruSayisi, setFriendlySoruSayisi] = useState(5);

  const [dueloModu, setDueloModu] = useState<DueloModu>("ranked");
  const [rakip, setRakip] = useState<Rakip | null>(null);
  const [matchId, setMatchId] = useState<string>("");
  const [oyuncuNum, setOyuncuNum] = useState<1 | 2>(1);

  const [sorular, setSorular] = useState<Soru[]>([]);
  const [soruIndex, setSoruIndex] = useState(0);
  const [sure, setSure] = useState(SURE);
  const [secim, setSecim] = useState<string | null>(null);
  const [rakipCevapladi, setRakipCevapladi] = useState(false);
  const [oyuncuSkor, setOyuncuSkor] = useState(0);
  const [rakipSkor, setRakipSkor] = useState(0);
  const [aktifSoruSayisi, setAktifSoruSayisi] = useState(SORU_SAYISI);
  const [sonuc, setSonuc] = useState<MacSonucu | null>(null);
  const [hukmenGalibiyet, setHukmenGalibiyet] = useState(false);

  // Refs for reliable reads inside async callbacks
  const oyuncuSkorRef = useRef(0);
  const rakipSkorRef = useRef(0);
  const dueloModuRef = useRef<DueloModu>("ranked");
  const rakipRef = useRef<Rakip | null>(null);
  const aktifSoruSayisiRef = useRef(SORU_SAYISI);
  const soruIndexRef = useRef(0);
  const matchIdRef = useRef("");
  const oyuncuNumRef = useRef<1 | 2>(1);
  const kullaniciRef = useRef<Kullanici | null>(null);
  const secimRef = useRef<string | null>(null);
  const rakipCevapladiRef = useRef(false);
  const adimRef = useRef<Adim>("lobi");
  const olusturulanKodRef = useRef("");

  const aramaTimer = useRef<number | null>(null);
  const rakipTimer = useRef<number | null>(null);
  const gecisTimer = useRef<number | null>(null);
  const sureTimer = useRef<number | null>(null);
  const botCevapZaman = useRef<number>(0);

  // Firebase unsubscribe refs
  const rankedUnsubRef = useRef<Unsubscribe | null>(null);
  const odaUnsubRef = useRef<Unsubscribe | null>(null);
  const matchUnsubRef = useRef<Unsubscribe | null>(null);
  const katilanMatchUnsubRef = useRef<Unsubscribe | null>(null);

  // --- Sync refs ---
  useEffect(() => { oyuncuSkorRef.current = oyuncuSkor; }, [oyuncuSkor]);
  useEffect(() => { rakipSkorRef.current = rakipSkor; }, [rakipSkor]);
  useEffect(() => { dueloModuRef.current = dueloModu; }, [dueloModu]);
  useEffect(() => { rakipRef.current = rakip; }, [rakip]);
  useEffect(() => { aktifSoruSayisiRef.current = aktifSoruSayisi; }, [aktifSoruSayisi]);
  useEffect(() => { soruIndexRef.current = soruIndex; }, [soruIndex]);
  useEffect(() => { matchIdRef.current = matchId; }, [matchId]);
  useEffect(() => { oyuncuNumRef.current = oyuncuNum; }, [oyuncuNum]);
  useEffect(() => { kullaniciRef.current = kullanici; }, [kullanici]);
  useEffect(() => { secimRef.current = secim; }, [secim]);
  useEffect(() => { rakipCevapladiRef.current = rakipCevapladi; }, [rakipCevapladi]);
  useEffect(() => { adimRef.current = adim; }, [adim]);

  // --- Başlangıçta kullanıcı yükle ---
  useEffect(() => {
    const k = mevcutKullanici();
    if (k) {
      setKullanici(k);
      kullaniciRef.current = k;
      setIstatistik(mevcutIstatistik());
      setAdim("lobi");
    } else {
      setAdim("nick");
    }
  }, []);

  // --- Duelo aktiflik durumunu parent'a bildir ---
  useEffect(() => {
    onDueloAktifDegisti(adim === "duelo");
  }, [adim, onDueloAktifDegisti]);

  // --- beforeunload: düello aktifken pencere kapatmayı uyar + terk et ---
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (adimRef.current === "duelo") {
        e.preventDefault();
        e.returnValue = "";
        // Online: rakibe hükmen galibiyet ver
        const mId = matchIdRef.current;
        if (mId && !mId.startsWith("bot_") && kullaniciRef.current) {
          const digerId = oyuncuNumRef.current === 1
            ? rakipRef.current?.ad ?? ""
            : kullaniciRef.current.kullaniciAdi;
          matchTerk(mId, kullaniciRef.current.kullaniciAdi, digerId).catch(() => {});
        }
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // --- Unmount: tüm timer'ları ve aktiflik durumunu temizle ---
  useEffect(() => {
    return () => {
      if (aramaTimer.current) clearTimeout(aramaTimer.current);
      if (rakipTimer.current) clearTimeout(rakipTimer.current);
      if (gecisTimer.current) clearTimeout(gecisTimer.current);
      if (sureTimer.current) clearTimeout(sureTimer.current);
      if (rankedUnsubRef.current) rankedUnsubRef.current();
      if (odaUnsubRef.current) odaUnsubRef.current();
      if (matchUnsubRef.current) matchUnsubRef.current();
      if (katilanMatchUnsubRef.current) katilanMatchUnsubRef.current();
      const k = kullaniciRef.current;
      if (k) rankedKuyruktanCik(k.kullaniciAdi).catch(() => {});
      if (olusturulanKodRef.current) odaSil(olusturulanKodRef.current).catch(() => {});
      onDueloAktifDegisti(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Nick kaydetme ---
  const nickKaydet = useCallback(async () => {
    const kontrol = kullaniciAdiKontrol(nickInput);
    if (!kontrol.musait) {
      setNickHata(kontrol.mesaj);
      return;
    }
    const yeniKullanici: Kullanici = {
      kullaniciAdi: nickInput.trim(),
      avatar: rastgeleAvatarId(),
      olusturmaTarihi: Date.now(),
    };
    if (firebaseAktif) {
      const onlineTamam = await kullaniciAdiKaydetOnline(yeniKullanici.kullaniciAdi, yeniKullanici.kullaniciAdi);
      if (!onlineTamam) {
        setNickHata("Bu kullanıcı adı alınmış");
        return;
      }
    }
    kullaniciKaydet(yeniKullanici);
    setKullanici(yeniKullanici);
    kullaniciRef.current = yeniKullanici;
    setIstatistik(mevcutIstatistik());
    setAdim("lobi");
  }, [nickInput]);

  // --- Nick anlık kontrol ---
  useEffect(() => {
    if (!nickInput.trim()) {
      setNickKontrol(null);
      return;
    }
    const t = setTimeout(() => {
      setNickKontrol(kullaniciAdiKontrol(nickInput));
    }, 300);
    return () => clearTimeout(t);
  }, [nickInput]);

  // --- Tüm duel state'ini sıfırla ---
  const dueloSifirla = useCallback(() => {
    if (aramaTimer.current) { clearTimeout(aramaTimer.current); aramaTimer.current = null; }
    if (rakipTimer.current) { clearTimeout(rakipTimer.current); rakipTimer.current = null; }
    if (gecisTimer.current) { clearTimeout(gecisTimer.current); gecisTimer.current = null; }
    if (sureTimer.current) { clearTimeout(sureTimer.current); sureTimer.current = null; }
    if (rankedUnsubRef.current) { rankedUnsubRef.current(); rankedUnsubRef.current = null; }
    if (odaUnsubRef.current) { odaUnsubRef.current(); odaUnsubRef.current = null; }
    if (matchUnsubRef.current) { matchUnsubRef.current(); matchUnsubRef.current = null; }
    if (katilanMatchUnsubRef.current) { katilanMatchUnsubRef.current(); katilanMatchUnsubRef.current = null; }
    setSorular([]);
    setSoruIndex(0);
    soruIndexRef.current = 0;
    setSure(SURE);
    setSecim(null);
    secimRef.current = null;
    setRakipCevapladi(false);
    rakipCevapladiRef.current = false;
    setOyuncuSkor(0);
    setRakipSkor(0);
    oyuncuSkorRef.current = 0;
    rakipSkorRef.current = 0;
    setRakip(null);
    rakipRef.current = null;
    setSonuc(null);
    setHukmenGalibiyet(false);
    setMatchId("");
    matchIdRef.current = "";
    setOlusturulanKod("");
    olusturulanKodRef.current = "";
    setOdaHata("");
  }, []);

  // --- Maçı bitir ve sonucu işle ---
  const maciBitir = useCallback(
    (kazandi: boolean, berabere: boolean, hukmen: boolean, oS: number, rS: number) => {
      const mod = dueloModuRef.current;
      const rak = rakipRef.current;
      const puanKazandi = kazanilanPuan(oS, rS, hukmen);
      const sonucObj: MacSonucu = {
        kazandi,
        berabere,
        hukmenGalibiyet: hukmen && kazandi,
        oyuncuSkor: oS,
        rakipSkor: rS,
        rakipAdi: rak?.ad ?? "",
        puanKazandi: mod === "ranked" ? (kazandi ? puanKazandi : 0) : 0,
        seri: 0,
        ranked: mod === "ranked",
      };
      const guncel = istatistikGuncelle(sonucObj);
      sonucObj.seri = guncel.seri;
      setIstatistik(guncel);
      setSonuc(sonucObj);
      setHukmenGalibiyet(hukmen && kazandi);
      setAdim("sonuc");
      adimRef.current = "sonuc";
    },
    [],
  );

  // --- Duelo başlat (sorular artık parametre olarak geliyor) ---
  const dueloBaslat = useCallback(
    (mod: DueloModu, rakipBilgi: Rakip, soruSayisi: number, mId: string, num: 1 | 2, soruListesi: Soru[]) => {
      setSorular(soruListesi);
      setSoruIndex(0);
      soruIndexRef.current = 0;
      setSure(SURE);
      setSecim(null);
      secimRef.current = null;
      setRakipCevapladi(false);
      rakipCevapladiRef.current = false;
      setOyuncuSkor(0);
      setRakipSkor(0);
      oyuncuSkorRef.current = 0;
      rakipSkorRef.current = 0;
      setRakip(rakipBilgi);
      rakipRef.current = rakipBilgi;
      setDueloModu(mod);
      dueloModuRef.current = mod;
      setAktifSoruSayisi(soruSayisi);
      aktifSoruSayisiRef.current = soruSayisi;
      setSonuc(null);
      setHukmenGalibiyet(false);
      setMatchId(mId);
      matchIdRef.current = mId;
      setOyuncuNum(num);
      oyuncuNumRef.current = num;
      setAdim("duelo");
      adimRef.current = "duelo";
    },
    [],
  );

  // --- Rastgele rakip bul (ranked) — Firebase matchmaking + 5s bot fallback ---
  const rastgeleRakip = useCallback(() => {
    setDueloModu("ranked");
    dueloModuRef.current = "ranked";
    setAdim("aratma");
    adimRef.current = "aratma";

    const k = kullaniciRef.current;
    if (!k) return;

    if (firebaseAktif) {
      const unsub = rankedKuyrugaKatil(
        { id: k.kullaniciAdi, ad: k.kullaniciAdi, avatar: k.avatar },
        (durum) => {
          if (durum.durum === "eslesti") {
            dueloBaslat("ranked", durum.rakip, SORU_SAYISI, durum.matchId, 2, durum.sorular);
          } else if (durum.durum === "iptal") {
            setAdim("lobi");
            adimRef.current = "lobi";
          }
        },
      );
      rankedUnsubRef.current = unsub;
    } else {
      // Fallback (no Firebase): bot ile eşle
      const gecikme = 3000 + Math.random() * 2000;
      aramaTimer.current = window.setTimeout(() => {
        const bot = rastgeleBot();
        // Bot fallback'te sorular yerel üretilir
        const { sorulariUret } = require("@/lib/soru") as typeof import("@/lib/soru");
        const { gecerliYazarlar } = require("@/src/data") as typeof import("@/src/data");
        const havuz = gecerliYazarlar();
        const s = sorulariUret(havuz).slice(0, SORU_SAYISI);
        dueloBaslat("ranked", bot, SORU_SAYISI, "bot_" + Date.now(), 1, s);
      }, gecikme);
    }
  }, [dueloBaslat]);

  const aramaIptal = useCallback(() => {
    if (aramaTimer.current) { clearTimeout(aramaTimer.current); aramaTimer.current = null; }
    if (rankedUnsubRef.current) { rankedUnsubRef.current(); rankedUnsubRef.current = null; }
    const k = kullaniciRef.current;
    if (k) rankedKuyruktanCik(k.kullaniciAdi).catch(() => {});
    setAdim("lobi");
    adimRef.current = "lobi";
  }, []);

  // --- Özel oda kur — Gerçek online, bot yok ---
  const odaKur = useCallback(() => {
    const kod = Math.floor(1000 + Math.random() * 9000).toString();
    setOlusturulanKod(kod);
    olusturulanKodRef.current = kod;
    setAdim("oda_bekleme");
    adimRef.current = "oda_bekleme";

    const k = kullaniciRef.current;
    if (!k) return;

    if (!firebaseAktif) {
      setOdaHata("Çevrimiçi mod kapalı. Firebase anahtarları gerekli.");
      setAdim("oda");
      adimRef.current = "oda";
      return;
    }

    const unsub = odaKurOnline(
      kod,
      { id: k.kullaniciAdi, ad: k.kullaniciAdi, avatar: k.avatar },
      friendlySoruSayisi,
      (rakipBilgi, mId, soruListesi) => {
        dueloBaslat("friendly", rakipBilgi, friendlySoruSayisi, mId, 1, soruListesi);
      },
    );
    odaUnsubRef.current = unsub;
  }, [dueloBaslat, friendlySoruSayisi]);

  const odaBeklemeIptal = useCallback(() => {
    if (odaUnsubRef.current) { odaUnsubRef.current(); odaUnsubRef.current = null; }
    if (katilanMatchUnsubRef.current) { katilanMatchUnsubRef.current(); katilanMatchUnsubRef.current = null; }
    if (olusturulanKodRef.current) odaSil(olusturulanKodRef.current).catch(() => {});
    setOlusturulanKod("");
    olusturulanKodRef.current = "";
    setAdim("oda");
    adimRef.current = "oda";
  }, []);

  // --- Odaya katıl — Gerçek online, bot yok ---
  const odayaKatil = useCallback(async () => {
    if (odaInput.trim().length !== 4) return;
    const k = kullaniciRef.current;
    if (!k) return;

    if (!firebaseAktif) {
      setOdaHata("Çevrimiçi mod kapalı. Firebase anahtarları gerekli.");
      return;
    }

    const sonuc = await odayaKatilOnline(odaInput.trim(), {
      id: k.kullaniciAdi,
      ad: k.kullaniciAdi,
      avatar: k.avatar,
    });

    if (!sonuc.tamam) {
      setOdaHata(sonuc.hata ?? "Geçersiz oda kodu!");
      return;
    }

    // Oda bulundu — kurucu match oluşturacak, biz onu dinleriz
    setOlusturulanKod(odaInput.trim());
    olusturulanKodRef.current = odaInput.trim();
    setAdim("oda_bekleme");
    adimRef.current = "oda_bekleme";

    // Match belgesini dinle (oyuncu2.id = bizim id)
    const unsub = katilanMatchBekle(k.kullaniciAdi, (mId, mac) => {
      // Kurucu oluşturdu — maça başla (oyuncu2 olarak)
      dueloBaslat(
        "friendly",
        { ad: mac.oyuncu1.ad, avatar: mac.oyuncu1.avatar, bot: false },
        mac.soruSayisi,
        mId,
        2,
        mac.sorular ?? [],
      );
      if (katilanMatchUnsubRef.current) { katilanMatchUnsubRef.current(); katilanMatchUnsubRef.current = null; }
    });
    katilanMatchUnsubRef.current = unsub;
  }, [odaInput, dueloBaslat]);

  // --- Cevapla (oyuncu) ---
  const cevapla = useCallback(
    (secenek: string) => {
      if (secimRef.current !== null) return;
      const soru = sorular[soruIndexRef.current];
      if (!soru) return;
      setSecim(secenek);
      secimRef.current = secenek;
      const dogruMu = secenek === soru.dogru;
      if (dogruMu) {
        const bonus = Math.round((sure / SURE) * 50);
        const yeniSkor = oyuncuSkorRef.current + 100 + bonus;
        oyuncuSkorRef.current = yeniSkor;
        setOyuncuSkor(yeniSkor);
      }
      // Online: cevabı Firestore'a gönder
      const secenekIndex = soru.secenekler.indexOf(secenek);
      const mId = matchIdRef.current;
      const num = oyuncuNumRef.current;
      if (mId && !mId.startsWith("bot_")) {
        cevapGonder(mId, num, secenekIndex, dogruMu, Math.round((sure / SURE) * 50)).catch(() => {});
      }
    },
    [sorular, sure],
  );

  // --- Süre sayacı ---
  useEffect(() => {
    if (adim !== "duelo" || secim !== null) return;
    if (sure <= 0) {
      setSecim(ZAMAN_ASIMI);
      secimRef.current = ZAMAN_ASIMI;
      // Online: süre dolduğunda boş cevap gönder (skor değişmez)
      const mId = matchIdRef.current;
      const num = oyuncuNumRef.current;
      if (mId && !mId.startsWith("bot_")) {
        cevapGonder(mId, num, -1, false, 0).catch(() => {});
      }
      return;
    }
    sureTimer.current = window.setTimeout(() => setSure((s) => s - 1), 1000);
    return () => {
      if (sureTimer.current) clearTimeout(sureTimer.current);
    };
  }, [sure, secim, adim]);

  // --- Bot cevap simülasyonu (sadece bot fallback modunda) ---
  useEffect(() => {
    if (adim !== "duelo" || rakipCevapladi) return;
    const mId = matchIdRef.current;
    if (!mId.startsWith("bot_")) return;

    const gecikme = botGecikme();
    botCevapZaman.current = gecikme / 1000;
    rakipTimer.current = window.setTimeout(() => {
      setRakipCevapladi(true);
      rakipCevapladiRef.current = true;
      if (botDogruMu(0.7)) {
        const kalanSure = Math.max(0, SURE - botCevapZaman.current);
        const bonus = Math.round((kalanSure / SURE) * 50) + botBonus();
        const yeniSkor = rakipSkorRef.current + 100 + bonus;
        rakipSkorRef.current = yeniSkor;
        setRakipSkor(yeniSkor);
      }
    }, gecikme);
    return () => {
      if (rakipTimer.current) clearTimeout(rakipTimer.current);
    };
  }, [soruIndex, adim, rakipCevapladi]);

  // --- Online match dinleyici (gerçek online maç) ---
  useEffect(() => {
    if (adim !== "duelo") return;
    const mId = matchIdRef.current;
    if (mId.startsWith("bot_")) return;

    const unsub = matchDinle(mId, (mac) => {
      if (!mac) return;
      const rakipNum = oyuncuNumRef.current === 1 ? 2 : 1;
      const rakip = rakipNum === 1 ? mac.oyuncu1 : mac.oyuncu2;

      // Rakip cevapladıysa
      if (rakip && rakip.cevap !== null) {
        rakipCevapladiRef.current = true;
        setRakipCevapladi(true);
        rakipSkorRef.current = rakip.skor;
        setRakipSkor(rakip.skor);
      }

      // Soru ilerlediyse — senkron geçiş
      if (mac.soruIndex > soruIndexRef.current) {
        setSoruIndex(mac.soruIndex);
        soruIndexRef.current = mac.soruIndex;
        setSecim(null);
        secimRef.current = null;
        setRakipCevapladi(false);
        rakipCevapladiRef.current = false;
        setSure(SURE);
      }

      // Maç bittiyse
      if (mac.durum === "bitti" || mac.durum === "terk") {
        const oS = oyuncuNumRef.current === 1 ? mac.oyuncu1.skor : mac.oyuncu2?.skor ?? 0;
        const rS = rakipNum === 1 ? mac.oyuncu1.skor : mac.oyuncu2?.skor ?? 0;
        const hukmen = mac.durum === "terk";
        const kazandi = hukmen
          ? mac.kazananId === kullaniciRef.current?.kullaniciAdi
          : oS > rS;
        const berabere = !hukmen && oS === rS;
        maciBitir(kazandi, berabere, hukmen, oS, rS);
      }
    });
    matchUnsubRef.current = unsub;
    return () => {
      if (unsub) unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adim]);

  // --- Senkron geçiş: her iki taraf da cevapladıysa (bot veya online) ---
  const herIkiTarafHazir = secim !== null && rakipCevapladi;

  useEffect(() => {
    if (!herIkiTarafHazir || adim !== "duelo") return;
    const mId = matchIdRef.current;
    const isBot = mId.startsWith("bot_");

    gecisTimer.current = window.setTimeout(() => {
      const sIdx = soruIndexRef.current;
      const toplam = aktifSoruSayisiRef.current;
      const oS = oyuncuSkorRef.current;
      const rS = rakipSkorRef.current;

      if (sIdx + 1 >= toplam) {
        // Maç bitti
        const kazandi = oS > rS;
        const berabere = oS === rS;
        if (!isBot) {
          matchBitir(mId, kazandi ? kullaniciRef.current?.kullaniciAdi ?? null : null).catch(() => {});
        }
        maciBitir(kazandi, berabere, false, oS, rS);
      } else {
        // Sonraki soru
        if (!isBot) {
          sonrakiSoru(mId).catch(() => {});
        }
        setSoruIndex((i) => i + 1);
        soruIndexRef.current = sIdx + 1;
        setSecim(null);
        secimRef.current = null;
        setRakipCevapladi(false);
        rakipCevapladiRef.current = false;
        setSure(SURE);
      }
    }, BEKLEME_SURESI);
    return () => {
      if (gecisTimer.current) clearTimeout(gecisTimer.current);
    };
  }, [herIkiTarafHazir, adim, maciBitir]);

  // --- Forfeit (oyundan çekil) ---
  const forfeitYap = useCallback(() => {
    onCikisOnayGerekir(
      "Düellodan ayrılırsanız maçı kaybetmiş sayılacaksınız!",
      () => {
        // FORFEIT: ranked maçtan ayrılırsa kayıp yaz
        if (dueloModuRef.current === "ranked") {
          maciBitir(false, false, false, oyuncuSkorRef.current, rakipSkorRef.current);
        }
        // Online: rakibe hükmen galibiyet ver
        const mId = matchIdRef.current;
        if (mId && !mId.startsWith("bot_") && kullaniciRef.current) {
          const digerId = oyuncuNumRef.current === 1
            ? rakipRef.current?.ad ?? ""
            : kullaniciRef.current.kullaniciAdi;
          matchTerk(mId, kullaniciRef.current.kullaniciAdi, digerId).catch(() => {});
        }
        dueloSifirla();
        onCikis();
      },
    );
  }, [onCikis, onCikisOnayGerekir, dueloSifirla, maciBitir]);

  // --- Çıkış (lobi/sonuç ekranlarından) ---
  const cikisIste = useCallback(() => {
    if (adim === "duelo") {
      forfeitYap();
    } else {
      dueloSifirla();
      onCikis();
    }
  }, [adim, onCikis, forfeitYap, dueloSifirla]);

  // ============================================================
  // EKRANLAR
  // ============================================================

  // --- NICK ---
  if (adim === "nick") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-rise rounded-[1.75rem] bg-card p-7 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] max-w-sm w-full">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-rose-500/15 text-rose-500 animate-pop">
            <Swords className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-xl font-bold tracking-tight text-center text-card-foreground">
            Düello Modu
          </h2>
          <p className="mt-2 text-sm text-center text-pretty text-muted-foreground">
            Rakibinle yarışmak için benzersiz bir takma ad seç. Bu ad tüm EdebiKart'ta sadece sana ait olacak.
          </p>
          <input
            type="text"
            value={nickInput}
            onChange={(e) => {
              setNickInput(e.target.value);
              setNickHata("");
            }}
            onKeyDown={(e) => e.key === "Enter" && nickKaydet()}
            placeholder="Takma adın..."
            maxLength={20}
            className="mt-5 w-full rounded-2xl bg-muted px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
          {nickHata && (
            <p className="mt-2 text-xs font-semibold text-destructive">{nickHata}</p>
          )}
          {nickKontrol && !nickHata && (
            <p
              className={`mt-2 text-xs font-semibold ${nickKontrol.musait ? "text-emerald-500" : "text-destructive"}`}
            >
              {nickKontrol.musait ? "✓ Bu ad uygun" : nickKontrol.mesaj}
            </p>
          )}
          <button
            onClick={nickKaydet}
            disabled={!nickInput.trim()}
            className="mt-4 w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Devam Et
          </button>
        </div>
      </div>
    );
  }

  // --- LOBİ ---
  if (adim === "lobi" && kullanici) {
    const galibiyetOrani =
      istatistik && istatistik.macSayisi > 0
        ? Math.round((istatistik.galibiyet / istatistik.macSayisi) * 100)
        : 0;

    return (
      <div className="flex-1 flex flex-col justify-center py-2">
        <div className="animate-rise w-full max-w-2xl mx-auto">
          <button
            onClick={onProfilAc}
            className="group relative mb-4 w-full overflow-hidden rounded-[1.5rem] p-[1.5px] text-left transition active:scale-[0.99]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-primary/10 to-rose-500/30 opacity-70 transition group-hover:opacity-100" />
            <div className="relative flex items-center gap-4 rounded-[1.4rem] bg-card p-4">
              <div className="relative shrink-0">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-3xl">
                  {avatarEmoji(kullanici.avatar)}
                </div>
                {istatistik && istatistik.seri >= 2 && (
                  <div className="absolute -bottom-1.5 -right-1.5 flex items-center gap-0.5 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-md">
                    <Flame className="h-2.5 w-2.5" /> {istatistik.seri}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-lg font-bold text-card-foreground">
                  {kullanici.kullaniciAdi}
                </p>
                {istatistik && (
                  <p className="text-xs text-muted-foreground">
                    {istatistik.macSayisi} maç · %{galibiyetOrani} kazanma
                  </p>
                )}
              </div>
              <UserCircle className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:text-primary" />
            </div>
          </button>

          {istatistik && (
            <div className="mb-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-card p-3 text-center shadow-sm">
                <div className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Zap className="h-3 w-3" /> Puan
                </div>
                <p className="mt-0.5 text-xl font-bold text-primary">{istatistik.puan}</p>
              </div>
              <div className="rounded-2xl bg-card p-3 text-center shadow-sm">
                <div className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Trophy className="h-3 w-3" /> Galibiyet
                </div>
                <p className="mt-0.5 text-xl font-bold text-emerald-500">{istatistik.galibiyet}</p>
              </div>
              <div className="rounded-2xl bg-card p-3 text-center shadow-sm">
                <div className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <X className="h-3 w-3" /> Mağlubiyet
                </div>
                <p className="mt-0.5 text-xl font-bold text-destructive">{istatistik.maglubiyet}</p>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={rastgeleRakip}
              className="group relative overflow-hidden rounded-[1.5rem] bg-card p-5 text-left shadow-sm transition hover:shadow-xl active:scale-[0.98]"
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-rose-500/10 blur-2xl transition group-hover:bg-rose-500/20" />
              <div className="relative">
                <div className="mb-3 flex items-center justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/15 text-rose-500 transition group-hover:scale-110">
                    <Search className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-500">
                    Ranked
                  </span>
                </div>
                <p className="font-serif text-base font-bold text-card-foreground">Normal Rakip Bul</p>
                <p className="mt-1 text-xs text-muted-foreground">10 soru · Derece puanı kazan</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-rose-500 opacity-0 transition group-hover:opacity-100">
                  Eşleşmeye başla <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            </button>

            <button
              onClick={() => setAdim("oda")}
              className="group relative overflow-hidden rounded-[1.5rem] bg-card p-5 text-left shadow-sm transition hover:shadow-xl active:scale-[0.98]"
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/20" />
              <div className="relative">
                <div className="mb-3 flex items-center justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary transition group-hover:scale-110">
                    <KeyRound className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                    Dostluk
                  </span>
                </div>
                <p className="font-serif text-base font-bold text-card-foreground">Özel Oda Kur / Katıl</p>
                <p className="mt-1 text-xs text-muted-foreground">Arkadaşınla dostluk maçı</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition group-hover:opacity-100">
                  Oda aç <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            </button>
          </div>

          <button
            onClick={cikisIste}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-card py-3 text-sm font-semibold text-muted-foreground shadow-sm transition hover:text-foreground active:scale-[0.98]"
          >
            <Home className="h-4 w-4" /> Ana Sayfa
          </button>
        </div>
      </div>
    );
  }

  // --- ARAMA ---
  if (adim === "aratma") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-rise text-center">
          <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-rose-500/15 text-rose-500">
            <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-rose-500/20 border-t-rose-500" />
          </div>
          <h2 className="font-serif text-lg font-bold text-card-foreground">Rakip aranıyor...</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {firebaseAktif ? `${RANKED_BOT_FALLBACK_SURESI / 1000} sn içinde bulunmazsa bot rakip` : "Bot rakip hazırlanıyor..."}
          </p>
          <button
            onClick={aramaIptal}
            className="mt-6 rounded-2xl bg-card px-6 py-3 text-sm font-semibold text-muted-foreground shadow-sm transition hover:text-foreground active:scale-[0.98]"
          >
            İptal Et
          </button>
        </div>
      </div>
    );
  }

  // --- ODA (kurma / katılma ekranı) ---
  if (adim === "oda") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-rise rounded-[1.75rem] bg-card p-7 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] max-w-sm w-full">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <KeyRound className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-lg font-bold text-center text-card-foreground">Özel Oda</h2>

          <p className="mt-2 text-sm text-center text-pretty text-muted-foreground">
            Bir oda kur ve 4 haneli kodunu arkadaşınla paylaş, ya da elindeki koda katıl.
          </p>

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Soru sayısı</p>
            <div className="flex gap-2">
              {[5, 10, 15].map((n) => (
                <button
                  key={n}
                  onClick={() => setFriendlySoruSayisi(n)}
                  className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                    friendlySoruSayisi === n
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            value={odaInput}
            onChange={(e) => {
              setOdaInput(e.target.value.replace(/\D/g, "").slice(0, 4));
              setOdaHata("");
            }}
            onKeyDown={(e) => e.key === "Enter" && odayaKatil()}
            placeholder="4 haneli kod..."
            maxLength={4}
            className="mt-4 w-full rounded-2xl bg-muted px-4 py-3 text-sm font-bold tracking-widest text-center text-foreground placeholder:text-muted-foreground/60 placeholder:tracking-normal placeholder:font-normal outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
          {odaHata && (
            <p className="mt-2 text-xs font-semibold text-destructive text-center">{odaHata}</p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={odayaKatil}
              disabled={odaInput.length !== 4}
              className="rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Koda Katıl
            </button>
            <button
              onClick={odaKur}
              className="rounded-2xl bg-card py-3 text-sm font-semibold text-foreground shadow-sm transition hover:shadow-md active:scale-[0.98]"
            >
              Oda Kur
            </button>
          </div>
          <button
            onClick={() => setAdim("lobi")}
            className="mt-4 w-full text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  // --- ODA BEKLEME ---
  if (adim === "oda_bekleme") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-rise rounded-[1.75rem] bg-card p-7 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] max-w-sm w-full text-center">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          </div>
          <h2 className="font-serif text-lg font-bold text-card-foreground">Rakip bekleniyor...</h2>
          <p className="mt-2 text-xs text-muted-foreground">Oda kodun</p>
          <div className="mt-2 rounded-2xl bg-muted py-4 text-3xl font-bold tracking-[0.4em] text-foreground">
            {olusturulanKod}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Bu kodu arkadaşınla paylaş. Rakip katılınca maç otomatik başlar.
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Soru sayısı: {friendlySoruSayisi}</span>
          </div>
          <button
            onClick={odaBeklemeIptal}
            className="mt-5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  // --- SONUÇ ---
  if (adim === "sonuc" && sonuc) {
    const kazandi = sonuc.kazandi || sonuc.hukmenGalibiyet;
    const berabere = sonuc.berabere;
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-rise rounded-[1.75rem] bg-card p-8 text-center shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] max-w-sm w-full">
          <div
            className={`mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl animate-pop ${
              kazandi
                ? "bg-emerald-500/15 text-emerald-500"
                : berabere
                  ? "bg-primary/10 text-primary"
                  : "bg-destructive/15 text-destructive"
            }`}
          >
            {kazandi ? (
              <Trophy className="h-9 w-9" strokeWidth={1.5} />
            ) : berabere ? (
              <Swords className="h-9 w-9" strokeWidth={1.5} />
            ) : (
              <X className="h-9 w-9" strokeWidth={1.5} />
            )}
          </div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-card-foreground">
            {hukmenGalibiyet
              ? "Hükmen Galibiyet!"
              : kazandi
                ? "Kazandın!"
                : berabere
                  ? "Berabere!"
                  : "Kaybettin!"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {hukmenGalibiyet
              ? "Rakip oyundan ayrıldı. Maç hükmen galibiyetinle sonuçlandı."
              : kazandi
                ? "Tebrikler, rakibini alt ettin!"
                : berabere
                  ? "İki taraf da eşit skorla bitirdi."
                  : "Bu sefer rakibin daha hızlıydı. Tekrar dene!"}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-primary/10 p-4">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {kullanici?.kullaniciAdi}
              </p>
              <p className="mt-1 text-2xl font-bold text-primary">{sonuc.oyuncuSkor}</p>
            </div>
            <div className="rounded-2xl bg-muted p-4">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {sonuc.rakipAdi}
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">{sonuc.rakipSkor}</p>
            </div>
          </div>

          {dueloModu === "ranked" && (
            <div className="mt-4 space-y-2">
              {sonuc.puanKazandi > 0 && (
                <div className="flex items-center justify-center gap-2 rounded-2xl bg-primary/10 py-2.5 text-sm font-semibold text-primary">
                  <Zap className="h-4 w-4" /> +{sonuc.puanKazandi} puan
                </div>
              )}
              {sonuc.seri >= 2 && (
                <div className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500/10 py-2.5 text-sm font-semibold text-orange-500">
                  <Flame className="h-4 w-4" /> {sonuc.seri} Galibiyet Serisi
                </div>
              )}
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => rastgeleRakip()}
              className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
            >
              <Swords className="h-4 w-4" /> Yeni Düello
            </button>
            <button
              onClick={cikisIste}
              className="flex items-center justify-center gap-2 rounded-2xl bg-card py-3.5 text-sm font-semibold text-muted-foreground shadow-sm transition hover:text-foreground active:scale-[0.98]"
            >
              <Home className="h-4 w-4" /> Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- DUELO (aktif maç) ---
  const soru = sorular[soruIndex];
  if (!soru || !kullanici || !rakip) return null;

  const sureYuzde = (sure / SURE) * 100;
  const sureRenk = sure > 5 ? "bg-primary" : sure > 3 ? "bg-amber-500" : "bg-destructive";
  const sureMetinRenk = sure > 5 ? "text-primary" : sure > 3 ? "text-amber-500" : "text-destructive";
  const bekleniyor = secim !== null && !rakipCevapladi;

  return (
    <div className="flex flex-col flex-1 min-h-0 animate-rise">
      {/* Skor barı + forfeit butonu */}
      <div className="mb-3 rounded-2xl bg-card/70 p-3 shadow-sm backdrop-blur shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 items-center gap-2">
            <span className="text-lg">{avatarEmoji(kullanici.avatar)}</span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {kullanici.kullaniciAdi}
              </p>
              <p className="text-lg font-bold text-primary">{oyuncuSkor}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">VS</span>
            {/* Forfeit (×) butonu — sadece aktif maçta */}
            <button
              onClick={forfeitYap}
              className="grid h-7 w-7 place-items-center rounded-full bg-destructive/10 text-destructive transition hover:bg-destructive/20 active:scale-95"
              aria-label="Oyundan çekil"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2">
            <div className="min-w-0 text-right">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {rakip.ad}
              </p>
              <p className="text-lg font-bold text-foreground">{rakipSkor}</p>
            </div>
            <span className="text-lg">{avatarEmoji(rakip.avatar)}</span>
          </div>
        </div>
      </div>

      {/* Süre + soru sayacı */}
      <div className="mb-3 shrink-0">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <Lock className="h-3 w-3" /> Soru {soruIndex + 1} / {aktifSoruSayisi}
          </span>
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${sureMetinRenk}`}>
            <Clock className="h-3 w-3" />
            {sure}s
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${sureRenk}`}
            style={{ width: `${sureYuzde}%` }}
          />
        </div>
      </div>

      {/* Soru kartı */}
      <div className="flex min-h-0 flex-1 flex-col rounded-[1.75rem] bg-card p-5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {soru.tip === "eser" ? "Yazarın eseri" : "Eserin yazarı"}
        </p>
        <h2 className="mt-1.5 font-serif text-xl font-bold leading-snug text-balance text-card-foreground">
          {soru.vurgu}
        </h2>
        <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{soru.metin}</p>

        <div className="mt-4 min-h-0 flex-1 space-y-2">
          {soru.secenekler.map((secenek, i) => {
            const secildi = secim === secenek;
            const dogruSecenek = secenek === soru.dogru;
            const gosterDogru = secim !== null && rakipCevapladi && dogruSecenek;
            const gosterYanlis = secildi && !dogruSecenek;

            let stil = "bg-card hover:bg-muted/60 text-card-foreground";
            if (gosterDogru) stil = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
            else if (gosterYanlis) stil = "bg-destructive/15 text-destructive";
            else if (secim !== null) stil = "bg-card text-muted-foreground opacity-60";

            return (
              <button
                key={secenek}
                onClick={() => cevapla(secenek)}
                disabled={secim !== null}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-semibold transition-all duration-200 ${stil} ${
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

        {/* Bekleme / sonuç göstergesi */}
        {secim !== null && (
          <div className="mt-3 flex shrink-0 items-center justify-center gap-2 text-xs font-semibold">
            {bekleniyor ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                Rakip bekleniyor...
              </span>
            ) : secim === ZAMAN_ASIMI ? (
              <span className="text-destructive">Süre doldu!</span>
            ) : secim === soru.dogru ? (
              <>
                <Zap className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Doğru! Hız bonusu eklendi.</span>
              </>
            ) : (
              <span className="text-destructive">Yanlış cevap.</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
