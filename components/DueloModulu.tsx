"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  ChevronRight,
  Clock,
  Flame,
  Home,
  KeyRound,
  Lock,
  LogOut,
  Swords,
  Trophy,
  X,
  Zap,
  Pencil,
  ChevronDown,
  ShieldCheck,
  Plus,
  ShieldAlert,
} from "lucide-react";
import { type Soru, sorulariUret } from "@/lib/soru";
import {
  mevcutKullanici,
  mevcutIstatistik,
  istatistikGuncelle,
  istatistikYaz,
  kazanilanPuan,
  soruPuani,
  kullaniciKaydet,
  kullaniciAdiKontrol,
  cihazIdUret,
} from "@/lib/user";
import { rankBul, sonrakiRank, RANK_KADEMELERI } from "@/lib/types";
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
  rovanşTeklifEt,
  rovanşBaslatIfHazir,
  rovanşDinle,
  type OnlineMac,
} from "@/lib/matchmaking";
import type { Unsubscribe } from "firebase/firestore";
import type { Istatistik, Kullanici, MacSonucu, Rakip } from "@/lib/types";
import { sfxCorrect, sfxWrong, sfxTick, sfxVictory, sfxDefeat } from "@/lib/sfx";
import {
  gunlukGorevleriGetir,
  gorevOdulAl,
  macOlayiKaydet,
  type GunlukGorevState,
} from "@/lib/gunlukGorevler";
import { gecerliYazarlar } from "@/src/data";

type Adim = "nick" | "lobi" | "aratma" | "oda_katil" | "oda_kur" | "oda_bekleme" | "duelo" | "sonuc";
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
  const [kodKopyalandi, setKodKopyalandi] = useState(false);
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
  const [forfeitModal, setForfeitModal] = useState(false);
  const [forfeitConfirm, setForfeitConfirm] = useState(false);
  const [rovanşPopup, setRovanşPopup] = useState<{ matchId: string; rakipAd: string } | null>(null);
  const [rovanşBekleniyor, setRovanşBekleniyor] = useState(false);
  const [cooldownAktif, setCooldownAktif] = useState(false);
  const cooldownTimer = useRef<number | null>(null);
  const rovanşUnsubRef = useRef<Unsubscribe | null>(null);
  const sonFriendlyMatchRef = useRef("");
  const rovanşDinlemeyiBaslatRef = useRef<(mId: string) => void>(() => {});

  const [turPuani, setTurPuani] = useState<number | null>(null);
  const turPuaniTimer = useRef<number | null>(null);
  const ertelenmisSkor = useRef<number>(0);

  const dogruSeriRef = useRef(0);
  const [dogruSeri, setDogruSeri] = useState(0);
  const toplamDogruRef = useRef(0);
  const toplamMatchScoreRef = useRef(0);
  const [gorevler, setGorevler] = useState<GunlukGorevState | null>(null);
  const [gorevAcik, setGorevAcik] = useState(false);
  const [kariyerAcik, setKariyerAcik] = useState(false);

  const oyuncuSkorRef = useRef(0);
  const rakipSkorRef = useRef(0);
  const dueloModuRef = useRef<DueloModu>("ranked");
  const rakipRef = useRef<Rakip | null>(null);
  const rakipIdRef = useRef<string>("");
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

  const rankedUnsubRef = useRef<Unsubscribe | null>(null);
  const odaUnsubRef = useRef<Unsubscribe | null>(null);
  const matchUnsubRef = useRef<Unsubscribe | null>(null);
  const katilanMatchUnsubRef = useRef<Unsubscribe | null>(null);

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

  useEffect(() => {
    const kullaniciYukle = () => {
      const k = mevcutKullanici();
      if (k) {
        setKullanici(k);
        kullaniciRef.current = k;
        setIstatistik(mevcutIstatistik());
        setAdim("lobi");
      } else {
        setAdim("nick");
      }
    };
    kullaniciYukle();
    window.addEventListener("profileUpdated", kullaniciYukle);
    return () => window.removeEventListener("profileUpdated", kullaniciYukle);
  }, []);

  useEffect(() => {
    if (adim === "lobi" && !gorevler) {
      setGorevler(gunlukGorevleriGetir());
    }
  }, [adim, gorevler]);

  useEffect(() => {
    onDueloAktifDegisti(adim === "duelo");
  }, [adim, onDueloAktifDegisti]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (adimRef.current === "duelo") {
        e.preventDefault();
        e.returnValue = "";
        const mId = matchIdRef.current;
        if (mId && !mId.startsWith("bot_") && kullaniciRef.current) {
          const benimId = kullaniciRef.current.cihazId || kullaniciRef.current.kullaniciAdi;
          const digerId = rakipIdRef.current || rakipRef.current?.ad || "";
          matchTerk(mId, benimId, digerId).catch(() => {});
        }
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  useEffect(() => {
    return () => {
      if (aramaTimer.current) clearTimeout(aramaTimer.current);
      if (rakipTimer.current) clearTimeout(rakipTimer.current);
      if (gecisTimer.current) clearTimeout(gecisTimer.current);
      if (sureTimer.current) clearTimeout(sureTimer.current);
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
      if (turPuaniTimer.current) clearTimeout(turPuaniTimer.current);
      if (rankedUnsubRef.current) rankedUnsubRef.current();
      if (odaUnsubRef.current) odaUnsubRef.current();
      if (matchUnsubRef.current) matchUnsubRef.current();
      if (katilanMatchUnsubRef.current) katilanMatchUnsubRef.current();
      if (rovanşUnsubRef.current) rovanşUnsubRef.current();
      const k = kullaniciRef.current;
      if (k) rankedKuyruktanCik(k.cihazId || k.kullaniciAdi).catch(() => {});
      if (olusturulanKodRef.current) odaSil(olusturulanKodRef.current).catch(() => {});
      onDueloAktifDegisti(false);
    };
  }, [onDueloAktifDegisti]);

  const nickKaydet = useCallback(async () => {
    const kontrol = kullaniciAdiKontrol(nickInput);
    if (!kontrol.musait) {
      setNickHata(kontrol.mesaj);
      return;
    }
    const yeniKullanici: Kullanici = {
      kullaniciAdi: nickInput.trim(),
      cihazId: cihazIdUret(),
      avatar: rastgeleAvatarId(),
      olusturmaTarihi: Date.now(),
    };
    if (firebaseAktif) {
      await kullaniciAdiKaydetOnline(
        yeniKullanici.kullaniciAdi,
        yeniKullanici.kullaniciAdi,
      ).catch(() => false);
    }
    kullaniciKaydet(yeniKullanici);
    setKullanici(yeniKullanici);
    kullaniciRef.current = yeniKullanici;
    setIstatistik(mevcutIstatistik());
    setAdim("lobi");
  }, [nickInput]);

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

  const dueloSifirla = useCallback(() => {
    if (aramaTimer.current) { clearTimeout(aramaTimer.current); aramaTimer.current = null; }
    if (rakipTimer.current) { clearTimeout(rakipTimer.current); rakipTimer.current = null; }
    if (gecisTimer.current) { clearTimeout(gecisTimer.current); gecisTimer.current = null; }
    if (sureTimer.current) { clearTimeout(sureTimer.current); sureTimer.current = null; }
    if (cooldownTimer.current) { clearTimeout(cooldownTimer.current); cooldownTimer.current = null; }
    if (turPuaniTimer.current) { clearTimeout(turPuaniTimer.current); turPuaniTimer.current = null; }
    if (rankedUnsubRef.current) { rankedUnsubRef.current(); rankedUnsubRef.current = null; }
    if (odaUnsubRef.current) { odaUnsubRef.current(); odaUnsubRef.current = null; }
    if (matchUnsubRef.current) { matchUnsubRef.current(); matchUnsubRef.current = null; }
    if (katilanMatchUnsubRef.current) { katilanMatchUnsubRef.current(); katilanMatchUnsubRef.current = null; }
    if (rovanşUnsubRef.current) { rovanşUnsubRef.current(); rovanşUnsubRef.current = null; }
    setRovanşPopup(null);
    setRovanşBekleniyor(false);
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
    rakipIdRef.current = "";
    setSonuc(null);
    setHukmenGalibiyet(false);
    setForfeitModal(false);
    setForfeitConfirm(false);
    setTurPuani(null);
    ertelenmisSkor.current = 0;
    setMatchId("");
    matchIdRef.current = "";
    setOlusturulanKod("");
    olusturulanKodRef.current = "";
    setOdaHata("");
  }, []);

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

      if (mod === "friendly" && matchIdRef.current && !matchIdRef.current.startsWith("bot_")) {
        const mid = matchIdRef.current;
        window.setTimeout(() => {
          rovanşDinlemeyiBaslatRef.current?.(mid);
        }, 0);
      }

      if (kazandi || hukmen) sfxVictory();
      else if (!berabere) sfxDefeat();

      macOlayiKaydet({
        rankedWin: mod === "ranked" && (kazandi || hukmen),
        streak3: dogruSeriRef.current >= 3,
        duelTamamlandi: true,
        matchScore: oS,
        correctCount: toplamDogruRef.current,
      });
      setGorevler(gunlukGorevleriGetir());
    },
    [],
  );

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
      rakipIdRef.current = rakipBilgi.id || "";
      setDueloModu(mod);
      dueloModuRef.current = mod;
      setAktifSoruSayisi(soruSayisi);
      aktifSoruSayisiRef.current = soruSayisi;
      setSonuc(null);
      setHukmenGalibiyet(false);
      setForfeitModal(false);
      setForfeitConfirm(false);
      setMatchId(mId);
      matchIdRef.current = mId;
      setOyuncuNum(num);
      oyuncuNumRef.current = num;
      setAdim("duelo");
      adimRef.current = "duelo";
      dogruSeriRef.current = 0;
      setDogruSeri(0);
      toplamDogruRef.current = 0;
      toplamMatchScoreRef.current = 0;
    },
    [],
  );

  const rovanşDinlemeyiBaslat = useCallback(
    (mId: string) => {
      if (!mId || mId.startsWith("bot_")) return;
      const kid = kullaniciRef.current?.cihazId || kullaniciRef.current?.kullaniciAdi;
      if (!kid) return;

      if (rovanşUnsubRef.current) {
        rovanşUnsubRef.current();
        rovanşUnsubRef.current = null;
      }

      sonFriendlyMatchRef.current = mId;

      const unsub = rovanşDinle(
        mId,
        kid,
        (rakipAd) => {
          setRovanşPopup({ matchId: mId, rakipAd });
        },
        (sorular, rakipBilgi, num) => {
          setRovanşPopup(null);
          setRovanşBekleniyor(false);
          if (rovanşUnsubRef.current) {
            rovanşUnsubRef.current();
            rovanşUnsubRef.current = null;
          }
          dueloBaslat(
            "friendly",
            rakipBilgi,
            sorular.length || aktifSoruSayisiRef.current || 5,
            mId,
            num,
            sorular,
          );
        },
      );
      rovanşUnsubRef.current = unsub;
    },
    [dueloBaslat],
  );

  rovanşDinlemeyiBaslatRef.current = rovanşDinlemeyiBaslat;

  const cooldownBaslat = useCallback(() => {
    setCooldownAktif(true);
    if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    cooldownTimer.current = window.setTimeout(() => setCooldownAktif(false), 2000);
  }, []);

  const rastgeleRakip = useCallback(() => {
    if (cooldownAktif) {
      setCooldownAktif(false);
    }
    cooldownBaslat();
    setDueloModu("ranked");
    dueloModuRef.current = "ranked";
    setAdim("aratma");
    adimRef.current = "aratma";

    const k = kullaniciRef.current;
    if (!k) return;

    if (firebaseAktif) {
      const unsub = rankedKuyrugaKatil(
        { id: k.cihazId || k.kullaniciAdi, ad: k.kullaniciAdi, avatar: k.avatar },
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
      const gecikme = 3000 + Math.random() * 2000;
      aramaTimer.current = window.setTimeout(() => {
        const bot = rastgeleBot();
        const havuz = gecerliYazarlar();
        const s = sorulariUret(havuz).slice(0, SORU_SAYISI);
        dueloBaslat("ranked", bot, SORU_SAYISI, "bot_" + Date.now(), 1, s);
      }, gecikme);
    }
  }, [dueloBaslat, cooldownAktif, cooldownBaslat]);

  const aramaIptal = useCallback(() => {
    if (aramaTimer.current) { clearTimeout(aramaTimer.current); aramaTimer.current = null; }
    if (rankedUnsubRef.current) { rankedUnsubRef.current(); rankedUnsubRef.current = null; }
    const k = kullaniciRef.current;
    if (k) rankedKuyruktanCik(k.cihazId || k.kullaniciAdi).catch(() => {});
    setAdim("lobi");
    adimRef.current = "lobi";
  }, []);

  const odaKur = useCallback(() => {
    if (cooldownAktif) return;
    cooldownBaslat();
    dueloSifirla();
    const kod = Math.floor(1000 + Math.random() * 9000).toString();
    setOlusturulanKod(kod);
    olusturulanKodRef.current = kod;
    setAdim("oda_bekleme");
    adimRef.current = "oda_bekleme";

    const k = kullaniciRef.current;
    if (!k) return;

    if (!firebaseAktif) {
      setOdaHata("Çevrimiçi mod kapalı. Firebase anahtarları gerekli.");
      setAdim("oda_kur");
      adimRef.current = "oda_kur";
      return;
    }

    const unsub = odaKurOnline(
      kod,
      { id: k.cihazId || k.kullaniciAdi, ad: k.kullaniciAdi, avatar: k.avatar },
      friendlySoruSayisi,
      (rakipBilgi, mId, soruListesi) => {
        dueloBaslat("friendly", rakipBilgi, friendlySoruSayisi, mId, 1, soruListesi);
      },
    );
    odaUnsubRef.current = unsub;
  }, [dueloBaslat, friendlySoruSayisi, dueloSifirla, cooldownAktif, cooldownBaslat]);

  const odaBeklemeIptal = useCallback(() => {
    if (odaUnsubRef.current) { odaUnsubRef.current(); odaUnsubRef.current = null; }
    if (katilanMatchUnsubRef.current) { katilanMatchUnsubRef.current(); katilanMatchUnsubRef.current = null; }
    if (olusturulanKodRef.current) odaSil(olusturulanKodRef.current).catch(() => {});
    setOlusturulanKod("");
    olusturulanKodRef.current = "";
    setAdim("lobi");
    adimRef.current = "lobi";
  }, []);

  const odayaKatil = useCallback(async () => {
    const trimmedInput = odaInput.trim();
    if (trimmedInput.length !== 4) return;
    const k = kullaniciRef.current;
    if (!k) return;

    if (!firebaseAktif) {
      setOdaHata("Çevrimiçi mod kapalı. Firebase anahtarları gerekli.");
      return;
    }

    dueloSifirla();

    const sonuc = await odayaKatilOnline(trimmedInput, {
      id: k.cihazId || k.kullaniciAdi,
      ad: k.kullaniciAdi,
      avatar: k.avatar,
    });

    if (!sonuc.tamam) {
      setOdaHata(sonuc.hata ?? "Geçersiz oda kodu!");
      return;
    }

    setOlusturulanKod(trimmedInput);
    olusturulanKodRef.current = trimmedInput;
    setAdim("oda_bekleme");
    adimRef.current = "oda_bekleme";

    const unsub = katilanMatchBekle(k.cihazId || k.kullaniciAdi, (mId, mac) => {
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
  }, [odaInput, dueloBaslat, dueloSifirla]);

  const cevapla = useCallback(
    (secenek: string) => {
      if (secimRef.current !== null) return;
      const soru = sorular[soruIndexRef.current];
      if (!soru) return;
      setSecim(secenek);
      secimRef.current = secenek;
      const dogruMu = secenek === soru.dogru;
      if (dogruMu) {
        const rp = soruPuani(sure, SURE);
        ertelenmisSkor.current = rp;
        sfxCorrect();
        dogruSeriRef.current += 1;
        setDogruSeri(dogruSeriRef.current);
        toplamDogruRef.current += 1;
      } else {
        ertelenmisSkor.current = 0;
        sfxWrong();
        dogruSeriRef.current = 0;
        setDogruSeri(0);
      }
      const secenekIndex = soru.secenekler.indexOf(secenek);
      const mId = matchIdRef.current;
      const num = oyuncuNumRef.current;
      if (mId && !mId.startsWith("bot_")) {
        cevapGonder(mId, num, secenekIndex, dogruMu, dogruMu ? ertelenmisSkor.current : 0).catch(() => {});
      }
    },
    [sorular, sure],
  );

  useEffect(() => {
    if (adim !== "duelo" || secim !== null) return;
    if (sure <= 0) {
      setSecim(ZAMAN_ASIMI);
      secimRef.current = ZAMAN_ASIMI;
      const mId = matchIdRef.current;
      const num = oyuncuNumRef.current;
      if (mId && !mId.startsWith("bot_")) {
        cevapGonder(mId, num, -1, false, 0).catch(() => {});
      }
      return;
    }
    if (sure <= 3 && sure > 0) sfxTick();
    sureTimer.current = window.setTimeout(() => setSure((s) => s - 1), 1000);
    return () => {
      if (sureTimer.current) clearTimeout(sureTimer.current);
    };
  }, [sure, secim, adim]);

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
        const rp = soruPuani(Math.round(kalanSure), SURE) + botBonus();
        const yeniSkor = rakipSkorRef.current + rp;
        rakipSkorRef.current = yeniSkor;
        setRakipSkor(yeniSkor);
      }
    }, gecikme);
    return () => {
      if (rakipTimer.current) clearTimeout(rakipTimer.current);
    };
  }, [soruIndex, adim, rakipCevapladi]);

  useEffect(() => {
    if (adim !== "duelo") return;
    const mId = matchIdRef.current;
    if (mId.startsWith("bot_")) return;

    const unsub = matchDinle(mId, (mac) => {
      if (!mac) return;
      const rakipNum = oyuncuNumRef.current === 1 ? 2 : 1;
      const rakip = rakipNum === 1 ? mac.oyuncu1 : mac.oyuncu2;

      if (rakip && rakip.cevap !== null) {
        rakipCevapladiRef.current = true;
        setRakipCevapladi(true);
        rakipSkorRef.current = rakip.skor;
        setRakipSkor(rakip.skor);
      }

      if (mac.soruIndex > soruIndexRef.current) {
        setSoruIndex(mac.soruIndex);
        soruIndexRef.current = mac.soruIndex;
        setSecim(null);
        secimRef.current = null;
        setRakipCevapladi(false);
        rakipCevapladiRef.current = false;
        setSure(SURE);
      }

      if (mac.durum === "bitti" || mac.durum === "terk") {
        const benimId = kullaniciRef.current?.cihazId || kullaniciRef.current?.kullaniciAdi || "";
        
        if (mac.durum === "terk" && mac.forfeitedBy === benimId) {
          return;
        }

        const oS = oyuncuNumRef.current === 1 ? mac.oyuncu1.skor : mac.oyuncu2?.skor ?? 0;
        const rS = (oyuncuNumRef.current === 1 ? mac.oyuncu2?.skor : mac.oyuncu1.skor) ?? 0;
        const hukmen = mac.durum === "terk";
        const kazandi = hukmen
          ? mac.kazananId === benimId
          : oS > rS;
        const berabere = !hukmen && oS === rS;

        if (hukmen && kazandi) {
          setForfeitModal(true);
        } else {
          maciBitir(kazandi, berabere, hukmen, oS, rS);
        }
      }
    });
    matchUnsubRef.current = unsub;
    return () => {
      if (unsub) unsub();
    };
  }, [adim, maciBitir]);

  const herIkiTarafHazir = secim !== null && rakipCevapladi;

  useEffect(() => {
    if (!herIkiTarafHazir || adim !== "duelo") return;
    const mId = matchIdRef.current;
    const isBot = mId.startsWith("bot_");

    const ertelenen = ertelenmisSkor.current;
    if (ertelenen > 0) {
      const yeniSkor = oyuncuSkorRef.current + ertelenen;
      oyuncuSkorRef.current = yeniSkor;
      setOyuncuSkor(yeniSkor);
      setTurPuani(ertelenen);
      if (turPuaniTimer.current) clearTimeout(turPuaniTimer.current);
      turPuaniTimer.current = window.setTimeout(() => setTurPuani(null), 1000);
    }
    ertelenmisSkor.current = 0;

    gecisTimer.current = window.setTimeout(() => {
      const sIdx = soruIndexRef.current;
      const toplam = aktifSoruSayisiRef.current;
      const oS = oyuncuSkorRef.current;
      const rS = rakipSkorRef.current;

      if (sIdx + 1 >= toplam) {
        const kazandi = oS > rS;
        const berabere = oS === rS;
        if (!isBot) {
          matchBitir(mId, kazandi ? (kullaniciRef.current?.cihazId || kullaniciRef.current?.kullaniciAdi) ?? null : null).catch(() => {});
        }
        maciBitir(kazandi, berabere, false, oS, rS);
      } else {
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

  const forfeitYap = useCallback(() => {
    setForfeitConfirm(true);
  }, []);

  const forfeitOnayla = useCallback(() => {
    setForfeitConfirm(false);

    const mId = matchIdRef.current;
    const benimId = kullaniciRef.current?.cihazId || kullaniciRef.current?.kullaniciAdi || "";
    const digerId = rakipIdRef.current || rakipRef.current?.ad || "";

    if (matchUnsubRef.current) {
      matchUnsubRef.current();
      matchUnsubRef.current = null;
    }

    if (mId && !mId.startsWith("bot_") && benimId) {
      matchTerk(mId, benimId, digerId).catch(() => {});
    }

    maciBitir(false, false, true, oyuncuSkorRef.current, rakipSkorRef.current);

    window.setTimeout(() => {
      dueloSifirla();
      onCikis();
    }, 1800);
  }, [onCikis, dueloSifirla, maciBitir]);

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
        <div className="animate-rise glass-card rounded-xl p-7 shadow-sm max-w-sm w-full">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-xl bg-duello/15 text-duello animate-pop ring-1 ring-duello/30">
            <Swords className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-xl font-bold tracking-tight text-center text-card-foreground">
            Düello Modu
          </h2>
          <p className="mt-2 text-sm text-center text-pretty text-muted-foreground">
            İsminiz ne olsun?{" "}
            <span className="font-semibold text-duello">(Başlangıçta kilitli — Eser Çırağı olunca 1 kez değiştirebilirsin)</span>
          </p>
          <input
            type="text"
            value={nickInput}
            onChange={(e) => {
              setNickInput(e.target.value);
              setNickHata("");
            }}
            onKeyDown={(e) => e.key === "Enter" && nickKaydet()}
            placeholder="İsminiz..."
            maxLength={20}
            className="mt-5 w-full rounded-lg bg-muted/60 px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-duello/40 transition ring-1 ring-border"
          />
          {nickHata && (
            <p className="mt-2 text-xs font-semibold text-destructive">{nickHata}</p>
          )}
          {nickKontrol && !nickHata && (
            <p
              className={`mt-2 text-xs font-semibold ${nickKontrol.musait ? "text-emerald-500" : "text-destructive"}`}
            >
              {nickKontrol.musait ? "✓ Bu isim uygun" : nickKontrol.mesaj}
            </p>
          )}
          <button
            onClick={nickKaydet}
            disabled={!nickInput.trim()}
            className="mt-4 w-full rounded-lg bg-duello py-3.5 text-sm font-bold text-duello-foreground shadow-md transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Devam Et
          </button>
        </div>
      </div>
    );
  }

  // --- LOBİ ---
  if (adim === "lobi" && kullanici) {
    const rp = istatistik?.puan ?? 0;
    const galibiyet = istatistik?.galibiyet ?? 0;
    const maglubiyet = istatistik?.maglubiyet ?? 0;
    const toplamMac = istatistik?.macSayisi ?? (galibiyet + maglubiyet);
    const winRate = toplamMac > 0 ? Math.round((galibiyet / toplamMac) * 100) : 0;

    const simdikiRank = rankBul(rp);
    const hedefRank = sonrakiRank(rp);
    const rankProgress = hedefRank
      ? Math.min(100, Math.round(((rp - simdikiRank.min) / (simdikiRank.max - simdikiRank.min)) * 100))
      : 100;
    const hedefeKalan = hedefRank ? hedefRank.min - rp : 0;

    const gorevState = gorevler ?? gunlukGorevleriGetir();
    const gorevOduluAl = (tur: string) => {
      const { odul } = gorevOdulAl(tur as any);
      if (odul > 0) {
        const guncelIstatistik = mevcutIstatistik();
        const yeniIstatistik = { ...guncelIstatistik, puan: guncelIstatistik.puan + odul };
        istatistikYaz(yeniIstatistik);
        setIstatistik(yeniIstatistik);
      }
      setGorevler(gunlukGorevleriGetir());
    };

    return (
      <div className="flex-1 flex flex-col justify-center py-1 min-h-0">
        <div className="animate-rise w-full max-w-3xl mx-auto flex flex-col gap-3">
          {/* 1. ÜST BLOK: PROFİL & RANK */}
          <div className="glass-card rounded-2xl p-4 ring-1 ring-border/80 flex flex-col bg-card/60 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50 text-2xl leading-none ring-2 transition-all"
                    style={{
                      borderColor: `${simdikiRank.renk}80`,
                      boxShadow: `0 0 16px ${simdikiRank.renk}25`,
                    }}
                  >
                    {avatarEmoji(kullanici.avatar)}
                  </div>
                  {istatistik && istatistik.seri >= 2 && (
                    <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0.5 text-[9px] font-extrabold text-white shadow-md">
                      <Flame className="h-2.5 w-2.5" /> {istatistik.seri}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-serif text-base font-bold text-card-foreground">
                      {kullanici.kullaniciAdi}
                    </p>
                    <span
                      className="rounded px-1.5 py-0.5 text-[9px] font-bold"
                      style={{ background: `${simdikiRank.renk}20`, color: simdikiRank.renk }}
                    >
                      {simdikiRank.ikon}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {toplamMac} maç tamamlandı
                  </p>
                </div>
              </div>

              <button
                onClick={onProfilAc}
                className="grid h-9 w-9 place-items-center rounded-xl bg-muted/50 text-muted-foreground ring-1 ring-border transition hover:text-duello hover:ring-duello/40 hover:bg-duello/10 active:scale-95"
                aria-label="Profili düzenle"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => setKariyerAcik(true)}
              className="group mb-3 w-full rounded-xl bg-muted/30 p-3 ring-1 ring-border/70 text-left transition hover:ring-duello/40 hover:bg-muted/50 active:scale-[0.99]"
            >
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base shrink-0" style={{ filter: `drop-shadow(0 0 6px ${simdikiRank.renk}40)` }}>
                    {simdikiRank.ikon}
                  </span>
                  <span className="font-serif text-xs font-bold text-card-foreground truncate">
                    {simdikiRank.ad}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold text-muted-foreground">
                    {hedefRank ? `${rp} / ${hedefRank.min} EP` : `${rp} EP`}
                  </span>
                  <span className="inline-flex items-center text-[10px] font-semibold text-duello bg-duello/10 px-1.5 py-0.5 rounded transition group-hover:bg-duello/20">
                    Kariyer <ChevronRight className="h-3 w-3 ml-0.5" />
                  </span>
                </div>
              </div>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{
                    width: hedefRank ? `${rankProgress}%` : "100%",
                    background: hedefRank
                      ? `linear-gradient(to right, ${simdikiRank.renk}80, ${simdikiRank.renk})`
                      : "linear-gradient(to right, #f59e0b, #fbbf24)",
                  }}
                />
              </div>

              <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                {hedefRank ? (
                  <>
                    <span>%{rankProgress} tamamlandı</span>
                    <span>{hedefRank.ad}'a {hedefeKalan} EP</span>
                  </>
                ) : (
                  <span className="w-full text-center font-bold text-amber-500 flex items-center justify-center gap-1">
                    👑 Zirvedesin · Maksimum Rütbe
                  </span>
                )}
              </div>
            </button>

            {(() => {
              const tamamlanan = gorevState.gorevler.filter((g) => gorevState.durumlar[g.tur]?.tamamlandi).length;
              return (
                <div className="mb-3 rounded-xl bg-amber-500/5 ring-1 ring-amber-500/20 overflow-hidden">
                  <button
                    onClick={() => setGorevAcik(!gorevAcik)}
                    className="flex w-full items-center justify-between px-3 py-2 transition hover:bg-amber-500/10"
                  >
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-card-foreground">
                      <span className="text-sm">🎯</span>
                      Günlük Görevler
                      <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-500">
                        {tamamlanan}/{gorevState.gorevler.length}
                      </span>
                    </span>
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-500/90">
                      <span>{gorevAcik ? "Gizle" : "Görevler"}</span>
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${gorevAcik ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {gorevAcik && (
                    <div className="space-y-2 px-3 pb-2.5 animate-rise">
                      {gorevState.gorevler.map((g) => {
                        const durum = gorevState.durumlar[g.tur];
                        if (!durum) return null;
                        const yuzde = Math.min(100, Math.round((durum.ilerleme / g.hedef) * 100));
                        return (
                          <div key={g.tur} className="rounded-lg bg-muted/40 p-2 ring-1 ring-border">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-sm shrink-0">{g.ikon}</span>
                                <div className="min-w-0">
                                  <p className="text-[11px] font-bold text-card-foreground truncate">{g.etiket}</p>
                                  <p className="text-[9px] text-muted-foreground truncate">{g.aciklama}</p>
                                </div>
                              </div>
                              <span className="shrink-0 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-500">
                                +{g.odul} EP
                              </span>
                            </div>
                            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className={`h-full rounded-full transition-[width] duration-500 ${durum.tamamlandi ? "bg-emerald-500" : "bg-amber-500"}`}
                                style={{ width: `${yuzde}%` }}
                              />
                            </div>
                            <div className="mt-1 flex items-center justify-between">
                              <span className="text-[9px] text-muted-foreground">{durum.ilerleme} / {g.hedef}</span>
                              {durum.tamamlandi && !durum.odulAlindi ? (
                                <button
                                  onClick={() => gorevOduluAl(g.tur)}
                                  className="rounded-md bg-emerald-500 px-2.5 py-0.5 text-[9px] font-bold text-white transition hover:brightness-110 active:scale-95"
                                >
                                  Ödülü Al
                                </button>
                              ) : durum.odulAlindi ? (
                                <span className="text-[9px] font-bold text-emerald-500">✓ Alındı</span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center justify-center rounded-xl bg-muted/30 py-2 ring-1 ring-border/60">
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" /> Galibiyet
                </span>
                <p className="mt-0.5 text-base font-extrabold text-emerald-500">{galibiyet}</p>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl bg-muted/30 py-2 ring-1 ring-border/60">
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <X className="h-3 w-3 text-destructive" /> Mağlubiyet
                </span>
                <p className="mt-0.5 text-base font-extrabold text-destructive">{maglubiyet}</p>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl bg-muted/30 py-2 ring-1 ring-border/60">
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Zap className="h-3 w-3 text-amber-500" /> Toplam EP
                </span>
                <p className="mt-0.5 text-base font-extrabold text-duello">{rp}</p>
              </div>
            </div>

            {toplamMac > 0 && (
              <div className="mt-2.5 flex items-center justify-between rounded-lg bg-muted/20 px-3 py-1 text-[10px] text-muted-foreground ring-1 ring-border/40">
                <span>Kazanma Oranı</span>
                <span className="font-bold text-foreground">%{winRate}</span>
              </div>
            )}
          </div>

          {/* 2. ALT BLOK: OYUN MODLARI */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={rastgeleRakip}
              disabled={cooldownAktif}
              className="group relative overflow-hidden rounded-2xl border border-duello/40 bg-gradient-to-br from-duello/20 via-card/90 to-card p-4.5 text-left shadow-lg transition-all hover:border-duello/70 hover:shadow-duello/10 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-duello text-duello-foreground shadow-[0_0_20px_rgba(239,68,68,0.35)] transition-transform group-hover:scale-105">
                    <Swords className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-serif text-base font-extrabold text-card-foreground">Dereceli Maç</p>
                      <span className="rounded-full bg-duello/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-duello">
                        Ranked
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">Canlı rakip bul, EP kazan ve lig atla!</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 rounded-xl bg-duello px-3.5 py-2 text-xs font-bold text-duello-foreground shadow transition group-hover:brightness-110">
                  <span>Oyna</span>
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </button>

            <div className="glass-card rounded-2xl p-4 ring-1 ring-border/80 bg-card/50">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-muted/60 text-duello ring-1 ring-border">
                  <KeyRound className="h-4 w-4" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-serif text-sm font-bold text-card-foreground">Özel Oda</p>
                  <p className="text-[11px] text-muted-foreground">Arkadaşınla birebir dostluk maçı</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAdim("oda_kur")}
                  disabled={cooldownAktif}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-duello/15 py-2.5 text-xs font-bold text-duello ring-1 ring-duello/25 transition hover:bg-duello/25 active:scale-[0.98] disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Oda Kur
                </button>
                <button
                  onClick={() => setAdim("oda_katil")}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-muted/50 py-2.5 text-xs font-bold text-foreground ring-1 ring-border transition hover:bg-muted/80 active:scale-[0.98]"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                  Odaya Katıl
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Kariyer Yolu Modalı */}
        {kariyerAcik && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm"
            onClick={() => setKariyerAcik(false)}
          >
            <div
              className="animate-pop glass-card max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-xl p-6 shadow-2xl ring-1 ring-border no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="font-serif text-lg font-bold text-card-foreground">Kariyer Yolu</h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{rp} EP — {simdikiRank.ad}</p>
                </div>
                <button
                  onClick={() => setKariyerAcik(false)}
                  className="text-muted-foreground transition hover:text-primary shrink-0"
                  aria-label="Kapat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative">
                <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-border" />

                <div className="space-y-3">
                  {RANK_KADEMELERI.map((k, i) => {
                    const acik = rp >= k.min;
                    const simdiki = rp >= k.min && rp <= k.max;
                    const sonraki = i < RANK_KADEMELERI.length - 1 ? RANK_KADEMELERI[i + 1] : null;
                    const kalanEP = sonraki ? sonraki.min - rp : 0;
                    return (
                      <div key={k.ad} className="relative flex items-start gap-3 pl-0">
                        <div
                          className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full text-base transition ${
                            simdiki
                              ? "animate-pulse ring-2"
                              : acik
                                ? ""
                                : "grayscale opacity-40"
                          }`}
                          style={{
                            background: acik ? `${k.renk}20` : "var(--muted)",
                            boxShadow: simdiki ? `0 0 12px ${k.renk}60` : "none",
                            ...(simdiki ? { "--tw-ring-color": k.renk } : {}),
                          } as Record<string, string>}
                        >
                          {acik ? (
                            simdiki ? (
                              <span style={{ filter: `drop-shadow(0 0 4px ${k.renk})` }}>{k.ikon}</span>
                            ) : (
                              <span>{k.ikon}</span>
                            )
                          ) : (
                            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>

                        <div className={`flex-1 pt-1 ${acik ? "" : "opacity-50"}`}>
                          <div className="flex items-center gap-2">
                            {acik && !simdiki && (
                              <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            )}
                            <p
                              className="text-sm font-bold"
                              style={{ color: acik ? k.renk : "var(--muted-foreground)" }}
                            >
                              {k.ad}
                            </p>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {k.min}{k.max < 999999 ? ` – ${k.max}` : "+"} EP
                          </p>
                          {simdiki && sonraki && (
                            <p className="mt-1 text-[10px] font-semibold" style={{ color: k.renk }}>
                              Sonraki Lige {kalanEP} EP Kaldı
                            </p>
                          )}
                          {simdiki && !sonraki && (
                            <p className="mt-1 text-[10px] font-bold text-amber-500">
                              👑 Zirvedesin — Maksimum rütbeye ulaştın!
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- ARATMA ---
  if (adim === "aratma") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-rise text-center">
          <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-xl bg-duello/15 text-duello ring-1 ring-duello/30">
            <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-duello/20 border-t-duello" />
          </div>
          <h2 className="font-serif text-lg font-bold text-card-foreground">Rakip aranıyor...</h2>
          <button
            onClick={aramaIptal}
            className="mt-6 rounded-lg glass-card px-6 py-3 text-sm font-semibold text-muted-foreground ring-1 ring-border transition hover:text-duello active:scale-[0.98]"
          >
            İptal Et
          </button>
        </div>
      </div>
    );
  }

  // --- ODA KUR ---
  if (adim === "oda_kur") {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="animate-rise glass-card relative rounded-2xl p-6 shadow-2xl max-w-sm w-full ring-1 ring-border">
          <button
            onClick={() => setAdim("lobi")}
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-muted/60 text-muted-foreground transition hover:text-foreground active:scale-95"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-duello/10 text-duello ring-1 ring-duello/20">
            <KeyRound className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <h2 className="font-serif text-xl font-bold text-center text-card-foreground">Oda Kur</h2>
          <p className="mt-1 text-xs text-center text-muted-foreground">
            Soru sayısını belirle, kod otomatik oluşturulacak.
          </p>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground">Soru Sayısı</span>
              <span className="font-bold text-duello">{friendlySoruSayisi} Soru</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 15].map((n) => (
                <button
                  key={n}
                  onClick={() => setFriendlySoruSayisi(n)}
                  className={`flex flex-col items-center justify-center rounded-xl py-3 text-sm font-bold transition-all ${
                    friendlySoruSayisi === n
                      ? "bg-duello text-duello-foreground shadow-md scale-102 ring-2 ring-duello/50"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground ring-1 ring-border"
                  }`}
                >
                  <span className="text-base">{n}</span>
                  <span className="text-[9px] font-normal opacity-80">Soru</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={odaKur}
            disabled={cooldownAktif}
            className="mt-6 w-full rounded-xl bg-duello py-3.5 text-sm font-bold text-duello-foreground shadow-md transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Odayı Oluştur
          </button>

          <button
            onClick={() => setAdim("lobi")}
            className="mt-2.5 w-full rounded-xl bg-muted/40 py-2.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
          >
            Vazgeç
          </button>
        </div>
      </div>
    );
  }

  // --- ODA KATIL ---
  if (adim === "oda_katil") {
    const kodDizisi = (odaInput + "    ").slice(0, 4).split("");

    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="animate-rise glass-card relative rounded-2xl p-6 shadow-2xl max-w-sm w-full ring-1 ring-border">
          <button
            onClick={() => setAdim("lobi")}
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-muted/60 text-muted-foreground transition hover:text-foreground active:scale-95"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-duello/10 text-duello ring-1 ring-duello/20">
            <KeyRound className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <h2 className="font-serif text-xl font-bold text-center text-card-foreground">Odaya Katıl</h2>
          <p className="mt-1 text-xs text-center text-muted-foreground">
            Arkadaşından aldığın 4 haneli oda kodunu gir.
          </p>

          <div className="relative mt-6">
            <div className="grid grid-cols-4 gap-2.5">
              {kodDizisi.map((karakter, i) => {
                const dolu = odaInput.length > i;
                const aktif = odaInput.length === i;
                return (
                  <div
                    key={i}
                    className={`grid aspect-square place-items-center rounded-xl text-2xl font-bold transition-all ${
                      aktif
                        ? "bg-duello/10 ring-2 ring-duello text-foreground"
                        : dolu
                          ? "bg-muted/60 text-duello ring-1 ring-duello/40 shadow-sm"
                          : "bg-muted/30 text-muted-foreground/30 ring-1 ring-border"
                    }`}
                  >
                    {dolu ? odaInput[i] : ""}
                  </div>
                );
              })}
            </div>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={odaInput}
              autoFocus
              onChange={(e) => {
                setOdaInput(e.target.value.replace(/\D/g, "").slice(0, 4));
                setOdaHata("");
              }}
              onKeyDown={(e) => e.key === "Enter" && odayaKatil()}
              maxLength={4}
              className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
            />
          </div>

          {odaHata && (
            <p className="mt-3 text-xs font-semibold text-destructive text-center">{odaHata}</p>
          )}

          <button
            onClick={odayaKatil}
            disabled={odaInput.length !== 4}
            className="mt-6 w-full rounded-xl bg-duello py-3.5 text-sm font-bold text-duello-foreground shadow-md transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Odaya Katıl
          </button>

          <button
            onClick={() => setAdim("lobi")}
            className="mt-2.5 w-full rounded-xl bg-muted/40 py-2.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
          >
            Vazgeç
          </button>
        </div>
      </div>
    );
  }

  // --- ODA BEKLEME ---
  if (adim === "oda_bekleme") {
    const koduKopyala = async () => {
      try {
        await navigator.clipboard.writeText(olusturulanKod);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = olusturulanKod;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setKodKopyalandi(true);
      window.setTimeout(() => setKodKopyalandi(false), 2000);
    };

    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="animate-rise glass-card relative rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center ring-1 ring-border">
          <button
            onClick={odaBeklemeIptal}
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-muted/60 text-muted-foreground transition hover:text-foreground active:scale-95"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-duello/10 text-duello ring-1 ring-duello/20">
            <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-duello/20 border-t-duello" />
          </div>

          <h2 className="font-serif text-xl font-bold text-card-foreground">Rakip Bekleniyor...</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Oda kodunu arkadaşınla paylaş, girince maç anında başlar.
          </p>

          <div
            onClick={koduKopyala}
            className="group relative mt-5 flex cursor-pointer items-center justify-between overflow-hidden rounded-2xl bg-muted/40 p-2 pl-6 ring-1 ring-duello/30 transition hover:ring-duello/60 hover:bg-muted/60 active:scale-[0.99]"
          >
            <span className="font-mono text-3xl font-extrabold tracking-[0.3em] text-duello">
              {olusturulanKod}
            </span>
            <div className="flex items-center gap-1.5 rounded-xl bg-card px-3.5 py-3 text-xs font-semibold text-muted-foreground shadow-sm ring-1 ring-border group-hover:text-duello">
              {kodKopyalandi ? (
                <>
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span className="text-[11px] text-emerald-500 font-bold">Kopyalandı</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="text-[11px]">Kopyala</span>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="rounded-full bg-muted/60 px-3 py-1 text-[11px] font-semibold text-muted-foreground ring-1 ring-border">
              {friendlySoruSayisi} Soruluk Dostluk Maçı
            </span>
          </div>

          <button
            onClick={odaBeklemeIptal}
            className="mt-6 w-full rounded-xl bg-muted/50 py-3 text-xs font-semibold text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive active:scale-[0.98]"
          >
            Odayı Kapat ve Çık
          </button>
        </div>
      </div>
    );
  }

  // --- SONUÇ (Gelişmiş Başlıklar, Mesajlar & Simetrik Düzen) ---
  if (adim === "sonuc" && sonuc) {
    const kazandi = sonuc.kazandi || sonuc.hukmenGalibiyet;
    const berabere = sonuc.berabere;
    const maglup = !kazandi && !berabere;

    // Duruma özel dinamik başlık ve motive edici mesajlar
    const baslik = sonuc.hukmenGalibiyet
      ? "Terk Galibiyeti"
      : kazandi
        ? "Ezici Üstünlük"
        : berabere
          ? "Yenişemediniz"
          : "Bu Sefer Olmadı";

    const aciklama = sonuc.hukmenGalibiyet
      ? "Rakip düellodan çekildi, hükmen galibiyet hanene yazıldı!"
      : kazandi
        ? "Kusursuz bir düello çıkardın, rakip çaresiz kaldı!"
        : berabere
          ? "Kıran kırana bir mücadeleydi, iki taraf da pes etmedi."
          : "Rövanşı alıp skoru eşitlemek tamamen senin elinde.";

    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="animate-rise glass-card rounded-2xl p-7 text-center shadow-2xl max-w-sm w-full ring-1 ring-border">
          {/* Sonuç İkonu */}
          <div
            className={`mx-auto mb-4 grid h-18 w-18 place-items-center rounded-2xl animate-pop ${
              sonuc.hukmenGalibiyet
                ? "bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30"
                : kazandi
                  ? "bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                  : berabere
                    ? "bg-duello/10 text-duello ring-1 ring-duello/30"
                    : "bg-destructive/15 text-destructive ring-1 ring-destructive/30"
            }`}
          >
            {sonuc.hukmenGalibiyet ? (
              <ShieldCheck className="h-9 w-9" strokeWidth={1.75} />
            ) : kazandi ? (
              <Trophy className="h-9 w-9" strokeWidth={1.75} />
            ) : berabere ? (
              <Swords className="h-9 w-9" strokeWidth={1.75} />
            ) : (
              <ShieldAlert className="h-9 w-9" strokeWidth={1.75} />
            )}
          </div>

          <h2 className="font-serif text-2xl font-bold tracking-tight text-card-foreground">
            {baslik}
          </h2>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            {aciklama}
          </p>

          {/* Karşılıklı Skor Tablosu */}
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <div className={`rounded-xl p-3 ring-1 transition-all ${
              kazandi ? "bg-emerald-500/10 ring-emerald-500/30" : "bg-muted/40 ring-border"
            }`}>
              <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {kullanici?.kullaniciAdi} (Sen)
              </p>
              <p className={`mt-1 text-2xl font-black ${kazandi ? "text-emerald-500" : "text-duello"}`}>
                {sonuc.oyuncuSkor} EP
              </p>
            </div>

            <div className={`rounded-xl p-3 ring-1 transition-all ${
              maglup ? "bg-emerald-500/10 ring-emerald-500/30" : "bg-muted/40 ring-border"
            }`}>
              <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {sonuc.rakipAdi}
              </p>
              <p className={`mt-1 text-2xl font-black ${maglup ? "text-emerald-500" : "text-foreground"}`}>
                {sonuc.rakipSkor} EP
              </p>
            </div>
          </div>

          {/* Ranked Modunda Kazanılan/Kaybedilen EP */}
          {dueloModu === "ranked" && (
            <div className="mt-3.5 space-y-2">
              <div
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold ring-1 ${
                  sonuc.puanKazandi > 0
                    ? "bg-emerald-500/10 text-emerald-500 ring-emerald-500/25"
                    : sonuc.puanKazandi < 0
                      ? "bg-destructive/10 text-destructive ring-destructive/25"
                      : "bg-muted/40 text-muted-foreground ring-border"
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                {sonuc.puanKazandi > 0
                  ? `+${sonuc.puanKazandi} EP Kazandın`
                  : sonuc.puanKazandi < 0
                    ? `${sonuc.puanKazandi} EP Kaybettin`
                    : "±0 EP (Puan Değişmedi)"}
              </div>

              {sonuc.seri >= 2 && (
                <div className="flex items-center justify-center gap-1.5 rounded-xl bg-orange-500/10 py-2 text-xs font-bold text-orange-500 ring-1 ring-orange-500/25">
                  <Flame className="h-3.5 w-3.5" /> {sonuc.seri} Galibiyet Serisi! 🔥
                </div>
              )}
            </div>
          )}

          {/* Alt Butonlar */}
          <div className="mt-6 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={async () => {
                const mod = dueloModuRef.current;
                const mid = matchIdRef.current || sonFriendlyMatchRef.current;
                const k = kullaniciRef.current;
                const kid = k?.cihazId || k?.kullaniciAdi;

                if (mod === "friendly") {
                  if (!mid || mid.startsWith("bot_") || !kid) {
                    setRovanşBekleniyor(false);
                    alert("Rövanş için maç bilgisi bulunamadı. Lobiye dönüp yeni oda kur.");
                    return;
                  }
                  setRovanşBekleniyor(true);
                  try {
                    rovanşDinlemeyiBaslatRef.current?.(mid);
                    await rovanşTeklifEt(mid, kid);
                    const basladi = await rovanşBaslatIfHazir(mid);
                    if (!basladi) {}
                  } catch (e) {
                    console.error("[rovanş]", e);
                    setRovanşBekleniyor(false);
                    alert("Rövanş teklifi gönderilemedi.");
                  }
                  return;
                }

                setCooldownAktif(false);
                if (cooldownTimer.current) {
                  clearTimeout(cooldownTimer.current);
                  cooldownTimer.current = null;
                }
                setAdim("aratma");
                adimRef.current = "aratma";
                setSonuc(null);
                setRakip(null);
                rakipRef.current = null;
                setSorular([]);
                rastgeleRakip();
              }}
              disabled={rovanşBekleniyor}
              className="flex items-center justify-center gap-2 rounded-xl bg-duello py-3 text-sm font-bold text-duello-foreground shadow-md transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              <Swords className="h-4 w-4" />
              {rovanşBekleniyor ? "Bekleniyor..." : "Rövanş"}
            </button>
            <button
              onClick={cikisIste}
              className="flex items-center justify-center gap-2 rounded-xl bg-muted/60 py-3 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-muted active:scale-[0.98]"
            >
              <Home className="h-4 w-4" /> Çık
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- DUELO (Canlı Maç) ---
  const soru = sorular[soruIndex];
  if (!soru || !kullanici || !rakip) {
    if (adim === "duelo" || adim === "sonuc") {
      return (
        <div className="flex-1 flex items-center justify-center p-5">
          <div className="text-center max-w-sm">
            <p className="text-sm text-muted-foreground mb-4">Maç durumu sıfırlandı.</p>
            <button
              type="button"
              onClick={() => {
                setRovanşBekleniyor(false);
                setAdim("lobi");
                adimRef.current = "lobi";
              }}
              className="rounded-lg bg-duello px-5 py-3 text-sm font-bold text-duello-foreground"
            >
              Lobiye Dön
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  const sureYuzde = (sure / SURE) * 100;
  const sonUcSaniye = sure <= 3 && sure > 0;
  const sureRenk = sure > 5 ? "bg-duello" : sure > 3 ? "bg-amber-500" : "bg-destructive";
  const sureMetinRenk = sure > 5 ? "text-duello" : sure > 3 ? "text-amber-500" : "text-destructive";
  const bekleniyor = secim !== null && !rakipCevapladi;
  const cevapDogru = secim !== null && secim !== ZAMAN_ASIMI && secim === soru.dogru;

  const benOndeyim = oyuncuSkor > rakipSkor;
  const rakipOnde = rakipSkor > oyuncuSkor;

  return (
    <div className="flex flex-col flex-1 min-h-0 animate-rise mx-auto w-full max-w-xl">
      {/* 1. SKOR BARI */}
      <div className="mb-3 glass-card rounded-2xl p-3.5 ring-1 ring-border/80 shrink-0 bg-card/70 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2.5 min-w-0">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted/60 text-xl ring-1 ring-border">
              {avatarEmoji(kullanici.avatar)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {kullanici.kullaniciAdi}
              </p>
              <p className={`text-xl font-black tabular-nums transition-colors ${
                benOndeyim ? "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "text-duello"
              }`}>
                {oyuncuSkor}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-center">
            <span className="rounded-full bg-muted/80 px-2.5 py-1 text-[10px] font-black tracking-widest text-muted-foreground ring-1 ring-border">
              VS
            </span>
          </div>

          <div className="flex flex-1 items-center justify-end gap-2.5 min-w-0 text-right">
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {rakip.ad}
              </p>
              <p className={`text-xl font-black tabular-nums transition-colors ${
                rakipOnde ? "text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" : "text-foreground"
              }`}>
                {rakipSkor}
              </p>
            </div>
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted/60 text-xl ring-1 ring-border">
              {avatarEmoji(rakip.avatar)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. SÜRE VE SORU SAYACI */}
      <div className="mb-3 shrink-0 px-1">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Soru {soruIndex + 1} / {aktifSoruSayisi}
          </span>
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold tabular-nums ${sureMetinRenk} ${sonUcSaniye ? "animate-urgent-scale" : ""}`}>
            <Clock className="h-3.5 w-3.5" />
            {sure}s
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${sureRenk} ${sonUcSaniye ? "animate-pulse-red" : ""}`}
            style={{ width: `${sureYuzde}%` }}
          />
        </div>
      </div>

      {/* 3. SORU KARTI */}
      <div className="relative rounded-2xl border border-border bg-card p-5 shadow-lg flex flex-col">
        <button
          onClick={forfeitYap}
          className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive transition hover:bg-destructive/20 active:scale-95 ring-1 ring-destructive/20"
          aria-label="Maçı terk et"
        >
          <LogOut className="h-3 w-3" /> Terk Et
        </button>

        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-duello">
          {soru.tip === "eser" ? "Yazarın eseri" : "Eserin yazarı"}
        </p>

        <h2 className="mt-1.5 font-serif text-xl font-bold leading-snug tracking-tight text-card-foreground">
          {soru.vurgu}
        </h2>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">{soru.metin}</p>

        {/* Şıklar */}
        <div className="mt-5 space-y-2.5">
          {soru.secenekler.map((secenek, i) => {
            const secildi = secim === secenek;
            const dogruSecenek = secenek === soru.dogru;
            const gosterDogru = secim !== null && rakipCevapladi && dogruSecenek;
            const gosterYanlis = secildi && !dogruSecenek;

            let stil = "bg-background border border-border text-card-foreground hover:bg-muted/40 hover:border-duello/40";
            if (gosterDogru) stil = "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400";
            else if (gosterYanlis) stil = "bg-destructive/10 border-destructive/50 text-destructive";
            else if (secim !== null) stil = "bg-background border-border text-muted-foreground opacity-50";

            return (
              <button
                key={secenek}
                onClick={() => cevapla(secenek)}
                disabled={secim !== null}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left text-sm font-medium transition-all ${stil} ${
                  gosterYanlis ? "animate-shake" : ""
                } ${secim === null ? "active:scale-[0.99]" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold tabular-nums transition-colors ${
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
                </div>

                {secildi && cevapDogru && ertelenmisSkor.current > 0 && (
                  <span className="shrink-0 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-xs font-black text-emerald-400 animate-pop">
                    +{ertelenmisSkor.current} EP
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bildirim Alanı */}
        {secim !== null && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold">
            {bekleniyor ? (
              <span className="inline-flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-1.5 text-muted-foreground ring-1 ring-border">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                Rakip cevaplıyor...
              </span>
            ) : secim === ZAMAN_ASIMI ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-destructive/10 px-3 py-1.5 text-destructive ring-1 ring-destructive/20 font-bold">
                <X className="h-3.5 w-3.5" strokeWidth={2.5} /> Süre doldu!
              </span>
            ) : cevapDogru ? (
              <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-emerald-500 ring-1 ring-emerald-500/20 font-bold">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                Doğru Cevap!
                {dogruSeri >= 2 && (
                  <span className="inline-flex items-center gap-0.5 text-orange-500 ml-1">
                    <Flame className="h-3.5 w-3.5" /> {dogruSeri} Seri
                  </span>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-destructive/10 px-3 py-1.5 text-destructive ring-1 ring-destructive/20 font-bold">
                <X className="h-3.5 w-3.5" strokeWidth={2.5} /> Yanlış cevap.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Rövanş Popup */}
      {rovanşPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm">
          <div className="animate-pop glass-card max-w-sm w-full rounded-2xl p-7 text-center shadow-lg ring-1 ring-duello/20">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-duello/15 text-duello ring-1 ring-duello/30">
              <Swords className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-xl font-bold tracking-tight text-card-foreground">
              Rövanş Teklifi
            </h2>
            <p className="mt-2 text-xs text-pretty text-muted-foreground">
              <span className="font-semibold text-foreground">{rovanşPopup.rakipAd}</span>
              {" "}rövanş teklif etti. Aynı odada tekrar oynamak ister misin?
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setRovanşPopup(null)}
                className="rounded-xl bg-muted/60 py-3 text-xs font-semibold text-foreground transition hover:bg-muted/40 active:scale-[0.98]"
              >
                Reddet
              </button>
              <button
                type="button"
                onClick={async () => {
                  const kid = kullaniciRef.current?.cihazId || kullaniciRef.current?.kullaniciAdi;
                  const mid = rovanşPopup.matchId;
                  if (!kid || !mid) return;
                  setRovanşPopup(null);
                  setRovanşBekleniyor(true);
                  try {
                    await rovanşTeklifEt(mid, kid);
                    await rovanşBaslatIfHazir(mid);
                  } catch {
                    setRovanşBekleniyor(false);
                  }
                }}
                className="rounded-xl bg-duello py-3 text-xs font-bold text-duello-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
              >
                Kabul Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forfeit Onay Modalı */}
      {forfeitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm">
          <div className="animate-pop glass-card max-w-sm w-full rounded-2xl p-7 text-center shadow-2xl ring-1 ring-destructive/20">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-destructive/15 text-destructive animate-pop ring-1 ring-destructive/30">
              <LogOut className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-xl font-bold tracking-tight text-card-foreground">
              Maçtan kaçacak mısın?
            </h2>
            <p className="mt-2 text-xs text-pretty text-muted-foreground">
              Terk edersen maçı kaybedersin, rakibin hükmen galip sayılır. Gerçekten çıkmak istiyor musun?
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setForfeitConfirm(false)}
                className="rounded-xl bg-muted/60 py-3 text-xs font-semibold text-foreground transition hover:bg-muted/40 active:scale-[0.98]"
              >
                Vazgeç
              </button>
              <button
                onClick={forfeitOnayla}
                className="rounded-xl bg-destructive py-3 text-xs font-bold text-white shadow-md transition hover:brightness-110 active:scale-[0.98]"
              >
                Evet, Terk Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forfeit Bildirim Pop-up */}
      {forfeitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm">
          <div className="animate-pop glass-card max-w-sm w-full rounded-2xl p-8 text-center shadow-2xl ring-1 ring-emerald-500/20">
            <div className="mx-auto mb-4 grid h-18 w-18 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-500 animate-pop ring-1 ring-emerald-500/30">
              <Trophy className="h-9 w-9" strokeWidth={1.75} />
            </div>
            <h2 className="font-serif text-2xl font-bold tracking-tight text-card-foreground">
              Rakip Düellodan Kaçtı!
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Rakibiniz oyundan ayrıldı ve maçı hükmen kazandınız.
            </p>
            <button
              onClick={() => {
                setForfeitModal(false);
                maciBitir(true, false, true, oyuncuSkorRef.current, rakipSkorRef.current);
                dueloSifirla();
                onCikis();
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-duello py-3.5 text-sm font-bold text-duello-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
            >
              <Home className="h-4 w-4" /> Ana Sayfaya Dön
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
