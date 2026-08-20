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
  LogOut,
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
  istatistikYaz,
  kazanilanPuan,
  soruPuani,
  kullaniciKaydet,
  kullaniciAdiKontrol,
} from "@/lib/user";
import { rankBul, sonrakiRank } from "@/lib/types";
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
  type OnlineMac,
} from "@/lib/matchmaking";
import type { Unsubscribe } from "firebase/firestore";
import type { Istatistik, Kullanici, MacSonucu, Rakip } from "@/lib/types";
import { Pencil, Target, ChevronDown } from "lucide-react";
import { sfxCorrect, sfxWrong, sfxTick, sfxVictory, sfxDefeat } from "@/lib/sfx";
import {
  gunlukGorevleriGetir,
  gorevOdulAl,
  macOlayiKaydet,
  type GunlukGorevState,
} from "@/lib/gunlukGorevler";

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
  const [cooldownAktif, setCooldownAktif] = useState(false);
  const cooldownTimer = useRef<number | null>(null);

  // Tur sonu puan animasyonu
  const [turPuani, setTurPuani] = useState<number | null>(null);
  const turPuaniTimer = useRef<number | null>(null);
  // Ertelenmiş skor (her iki taraf cevaplayana kadar beklet)
  const ertelenmisSkor = useRef<number>(0);

  // Günlük görev takibi (maç içi)
  const dogruSeriRef = useRef(0);
  const toplamDogruRef = useRef(0);
  const toplamMatchScoreRef = useRef(0);
  const [gorevler, setGorevler] = useState<GunlukGorevState | null>(null);
  const [gorevAcik, setGorevAcik] = useState(false);

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

  // --- Başlangıçta kullanıcı yükle + profileUpdated listener ---
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

  // --- Günlük görevleri yükle ---
  useEffect(() => {
    if (adim === "lobi" && !gorevler) {
      setGorevler(gunlukGorevleriGetir());
    }
  }, [adim, gorevler]);

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
        // Online: rakibe hükmen galibiyet ver (hem ranked hem friendly)
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
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
      if (turPuaniTimer.current) clearTimeout(turPuaniTimer.current);
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
    if (cooldownTimer.current) { clearTimeout(cooldownTimer.current); cooldownTimer.current = null; }
    if (turPuaniTimer.current) { clearTimeout(turPuaniTimer.current); turPuaniTimer.current = null; }
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

      // SFX
      if (kazandi || hukmen) sfxVictory();
      else if (!berabere) sfxDefeat();

      // Günlük görevleri güncelle
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
      setForfeitModal(false);
      setForfeitConfirm(false);
      setMatchId(mId);
      matchIdRef.current = mId;
      setOyuncuNum(num);
      oyuncuNumRef.current = num;
      setAdim("duelo");
      adimRef.current = "duelo";
      // Günlük görev takibini sıfırla
      dogruSeriRef.current = 0;
      toplamDogruRef.current = 0;
      toplamMatchScoreRef.current = 0;
    },
    [],
  );

  // --- Anti-spam cooldown (2 saniye) ---
  const cooldownBaslat = useCallback(() => {
    setCooldownAktif(true);
    if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    cooldownTimer.current = window.setTimeout(() => setCooldownAktif(false), 2000);
  }, []);

  // --- Rastgele rakip bul (ranked) — Firebase matchmaking + 5s bot fallback ---
  const rastgeleRakip = useCallback(() => {
    if (cooldownAktif) return;
    cooldownBaslat();
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
        const { sorulariUret } = require("@/lib/soru") as typeof import("@/lib/soru");
        const { gecerliYazarlar } = require("@/src/data") as typeof import("@/src/data");
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
    if (k) rankedKuyruktanCik(k.kullaniciAdi).catch(() => {});
    setAdim("lobi");
    adimRef.current = "lobi";
  }, []);

  // --- Özel oda kur — Gerçek online, bot yok ---
  const odaKur = useCallback(() => {
    if (cooldownAktif) return;
    cooldownBaslat();
    // Tüm duel state'ini sıfırla ki önceki maçtan kalma veri kalmasın
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
      { id: k.kullaniciAdi, ad: k.kullaniciAdi, avatar: k.avatar },
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

  // --- Odaya katıl — Gerçek online, bot yok ---
  const odayaKatil = useCallback(async () => {
    const trimmedInput = odaInput.trim();
    if (trimmedInput.length !== 4) return;
    const k = kullaniciRef.current;
    if (!k) return;

    if (!firebaseAktif) {
      setOdaHata("Çevrimiçi mod kapalı. Firebase anahtarları gerekli.");
      return;
    }

    // Tüm duel state'ini sıfırla
    dueloSifirla();

    const sonuc = await odayaKatilOnline(trimmedInput, {
      id: k.kullaniciAdi,
      ad: k.kullaniciAdi,
      avatar: k.avatar,
    });

    if (!sonuc.tamam) {
      setOdaHata(sonuc.hata ?? "Geçersiz oda kodu!");
      return;
    }

    // Oda bulundu — kurucu match oluşturacak, biz onu dinleriz
    setOlusturulanKod(trimmedInput);
    olusturulanKodRef.current = trimmedInput;
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
  }, [odaInput, dueloBaslat, dueloSifirla]);

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
        const rp = soruPuani(sure, SURE);
        ertelenmisSkor.current = rp;
        sfxCorrect();
        dogruSeriRef.current += 1;
        toplamDogruRef.current += 1;
      } else {
        ertelenmisSkor.current = 0;
        sfxWrong();
        dogruSeriRef.current = 0;
      }
      // Online: cevabı Firestore'a gönder
      const secenekIndex = soru.secenekler.indexOf(secenek);
      const mId = matchIdRef.current;
      const num = oyuncuNumRef.current;
      if (mId && !mId.startsWith("bot_")) {
        cevapGonder(mId, num, secenekIndex, dogruMu, dogruMu ? ertelenmisSkor.current : 0).catch(() => {});
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
    if (sure <= 3 && sure > 0) sfxTick();
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

      // Maç bittiyse veya rakip terk ettiyse
      if (mac.durum === "bitti" || mac.durum === "terk") {
        const oS = oyuncuNumRef.current === 1 ? mac.oyuncu1.skor : mac.oyuncu2?.skor ?? 0;
        const rS = rakipNum === 1 ? mac.oyuncu1.skor : mac.oyuncu2?.skor ?? 0;
        const hukmen = mac.durum === "terk";
        const kazandi = hukmen
          ? mac.kazananId === kullaniciRef.current?.kullaniciAdi
          : oS > rS;
        const berabere = !hukmen && oS === rS;
        // Eğer rakip terk ettiyse ve biz kazandıysak popup göster
        if (hukmen && kazandi && mac.forfeitedBy && mac.forfeitedBy !== kullaniciRef.current?.kullaniciAdi) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adim]);

  // --- Senkron geçiş: her iki taraf da cevapladıysa (bot veya online) ---
  const herIkiTarafHazir = secim !== null && rakipCevapladi;

  useEffect(() => {
    if (!herIkiTarafHazir || adim !== "duelo") return;
    const mId = matchIdRef.current;
    const isBot = mId.startsWith("bot_");

    // Tur sonu puan animasyonu — ertelenmiş skoru uygula ve animasyonu göster
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

  // --- Forfeit (oyundan çekil) — hem ranked hem friendly ---
  const forfeitYap = useCallback(() => {
    setForfeitConfirm(true);
  }, []);

  const forfeitOnayla = useCallback(() => {
    setForfeitConfirm(false);
    // Her iki modda da terk kayıp sayılır
    maciBitir(false, false, false, oyuncuSkorRef.current, rakipSkorRef.current);
    // Online: rakibe hükmen galibiyet ver (ranked + friendly)
    const mId = matchIdRef.current;
    if (mId && !mId.startsWith("bot_") && kullaniciRef.current) {
      const digerId = oyuncuNumRef.current === 1
        ? rakipRef.current?.ad ?? ""
        : kullaniciRef.current.kullaniciAdi;
      matchTerk(mId, kullaniciRef.current.kullaniciAdi, digerId).catch(() => {});
    }
    dueloSifirla();
    onCikis();
  }, [onCikis, dueloSifirla, maciBitir]);

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
        <div className="animate-rise glass-card rounded-[1.75rem] p-7 shadow-[0_12px_40px_-12px_rgba(14,116,144,0.12)] max-w-sm w-full">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-teal/15 text-teal animate-pop ring-1 ring-teal/30">
            <Swords className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-xl font-bold tracking-tight text-center text-card-foreground">
            Düello Modu
          </h2>
          <p className="mt-2 text-sm text-center text-pretty text-muted-foreground">
            İsminiz ne olsun?{" "}
            <span className="font-semibold text-duello">(Bu isim sabittir ve daha sonra değiştirilemez)</span>
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
            className="mt-5 w-full rounded-2xl bg-muted/60 px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-teal/40 transition ring-1 ring-border"
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
            className="mt-4 w-full rounded-2xl bg-duello py-3.5 text-sm font-bold text-duello-foreground shadow-md transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
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
    const simdikiRank = rankBul(rp);
    const hedefRank = sonrakiRank(rp);
    const rankProgress = hedefRank
      ? Math.min(100, Math.round(((rp - simdikiRank.min) / (simdikiRank.max - simdikiRank.min)) * 100))
      : 100;
    const hedefeKalan = hedefRank ? hedefRank.min - rp : 0;

    // Günlük görevler
    const gorevState = gorevler ?? gunlukGorevleriGetir();
    const gorevOduluAl = (tur: string) => {
      const { odul } = gorevOdulAl(tur as any);
      if (odul > 0) {
        // EP'yi profile ekle
        const guncelIstatistik = mevcutIstatistik();
        const yeniIstatistik = { ...guncelIstatistik, puan: guncelIstatistik.puan + odul };
        istatistikYaz(yeniIstatistik);
        setIstatistik(yeniIstatistik);
      }
      setGorevler(gunlukGorevleriGetir());
    };

    return (
      <div className="flex-1 flex flex-col justify-center py-2">
        <div className="animate-rise w-full max-w-3xl mx-auto grid gap-4 md:grid-cols-2">

          {/* SOL TARAF — Profil & Rank Kartı */}
          <div className="glass-card rounded-[1.75rem] p-5 ring-1 ring-border flex flex-col">
            {/* Avatar + İsim + Profil butonu */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-teal/15 text-2xl ring-1 ring-teal/30">
                    {avatarEmoji(kullanici.avatar)}
                  </div>
                  {istatistik && istatistik.seri >= 2 && (
                    <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-md">
                      <Flame className="h-2.5 w-2.5" /> {istatistik.seri}
                    </div>
                  )}
                </div>
                <div>
                  <p className="truncate font-serif text-base font-bold text-card-foreground">
                    {kullanici.kullaniciAdi}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{istatistik?.macSayisi ?? 0} maç oynandı</p>
                </div>
              </div>
              <button
                onClick={onProfilAc}
                className="grid h-9 w-9 place-items-center rounded-xl bg-muted/60 text-muted-foreground ring-1 ring-border transition hover:text-teal hover:ring-teal/30 active:scale-95"
                aria-label="Profili düzenle"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>

            {/* Rank + Progress Bar */}
            <div className="mb-3 rounded-2xl bg-muted/40 p-4 ring-1 ring-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{simdikiRank.ikon}</span>
                  <span className="font-serif text-sm font-bold text-card-foreground">{simdikiRank.ad}</span>
                </div>
                <span className="text-sm font-bold text-muted-foreground">
                  {rp} / {hedefRank ? hedefRank.min : rp} EP
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal/60 to-teal transition-[width] duration-500 ease-out"
                  style={{ width: `${rankProgress}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>%{rankProgress} tamamlandı</span>
                {hedefRank && (
                  <span>{hedefRank.ad}'a {hedefeKalan} EP</span>
                )}
              </div>
            </div>

            {/* Günlük Görevler — kompakt akordiyon */}
            {(() => {
              const tamamlanan = gorevState.gorevler.filter((g) => gorevState.durumlar[g.tur]?.tamamlandi).length;
              return (
                <div className="mb-3 rounded-2xl bg-amber-500/5 ring-1 ring-amber-500/15 overflow-hidden">
                  <button
                    onClick={() => setGorevAcik(!gorevAcik)}
                    className="flex w-full items-center justify-between px-3 py-2.5 transition hover:bg-amber-500/10"
                  >
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-card-foreground">
                      <span className="text-base">🎯</span>
                      Günlük Görevler
                      <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-500">
                        {tamamlanan}/{gorevState.gorevler.length}
                      </span>
                    </span>
                    <ChevronDown className={`h-4 w-4 text-amber-500 transition-transform duration-300 ${gorevAcik ? "rotate-180" : ""}`} />
                  </button>
                  {gorevAcik && (
                    <div className="space-y-2 px-3 pb-3 animate-rise">
                      {gorevState.gorevler.map((g) => {
                        const durum = gorevState.durumlar[g.tur];
                        if (!durum) return null;
                        const yuzde = Math.min(100, Math.round((durum.ilerleme / g.hedef) * 100));
                        return (
                          <div key={g.tur} className="rounded-xl bg-muted/40 p-2.5 ring-1 ring-border">
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

            {/* Minimalist istatistik şeridi */}
            <div className="mt-auto grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Galibiyet</p>
                <p className="mt-0.5 text-lg font-bold text-emerald-500">{istatistik?.galibiyet ?? 0}</p>
              </div>
              <div className="text-center border-x border-border">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mağlubiyet</p>
                <p className="mt-0.5 text-lg font-bold text-destructive">{istatistik?.maglubiyet ?? 0}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Toplam EP</p>
                <p className="mt-0.5 text-lg font-bold text-teal">{rp}</p>
              </div>
            </div>
          </div>

          {/* SAĞ TARAF — Oyun Modları */}
          <div className="flex flex-col gap-3">
            {/* Dereceli Maç */}
            <button
              onClick={rastgeleRakip}
              disabled={cooldownAktif}
              className="group relative overflow-hidden rounded-[1.5rem] glass-card p-5 text-left ring-1 ring-duello/20 transition hover:ring-duello/40 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-duello/15 blur-3xl transition group-hover:bg-duello/25" />
              <div className="relative">
                <div className="mb-3 flex items-center justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-duello/15 text-duello transition group-hover:scale-110 ring-1 ring-duello/20">
                    <Swords className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <span className="rounded-full bg-duello/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-duello">
                    Ranked
                  </span>
                </div>
                <p className="font-serif text-base font-bold text-card-foreground">Dereceli Maç</p>
                <p className="mt-1 text-xs text-muted-foreground">EP kazan ve lig atla!</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-duello">
                  Hemen Rakip Bul <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            </button>

            {/* Özel Oda — iki alt buton */}
            <div className="glass-card rounded-[1.5rem] p-5 ring-1 ring-border">
              <div className="mb-3 flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/20 text-secondary-foreground ring-1 ring-secondary/30">
                  <KeyRound className="h-4 w-4" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-serif text-sm font-bold text-card-foreground">Özel Oda</p>
                  <p className="text-[11px] text-muted-foreground">Arkadaşınla dostluk maçı</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setAdim("oda_kur")}
                  disabled={cooldownAktif}
                  className="rounded-xl bg-teal/15 py-2.5 text-sm font-semibold text-teal ring-1 ring-teal/20 transition hover:bg-teal/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                >
                  Oda Kur
                </button>
                <button
                  onClick={() => setAdim("oda_katil")}
                  className="rounded-xl glass-card py-2.5 text-sm font-semibold text-foreground ring-1 ring-border transition hover:ring-teal/30 active:scale-[0.98]"
                >
                  Odaya Katıl
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // --- ARAMA ---
  if (adim === "aratma") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-rise text-center">
          <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-duello/15 text-duello ring-1 ring-duello/30">
            <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-duello/20 border-t-duello" />
          </div>
          <h2 className="font-serif text-lg font-bold text-card-foreground">Rakip aranıyor...</h2>
          <button
            onClick={aramaIptal}
            className="mt-6 rounded-2xl glass-card px-6 py-3 text-sm font-semibold text-muted-foreground ring-1 ring-border transition hover:text-teal active:scale-[0.98]"
          >
            İptal Et
          </button>
        </div>
      </div>
    );
  }

  // --- ODA KUR (sadece soru sayısı seçimi → oda kodu oluştur) ---
  if (adim === "oda_kur") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-rise glass-card rounded-[1.75rem] p-7 shadow-[0_12px_40px_-12px_rgba(14,116,144,0.12)] max-w-sm w-full ring-1 ring-border">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-teal/10 text-teal ring-1 ring-teal/20">
            <KeyRound className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-lg font-bold text-center text-card-foreground">Oda Kur</h2>
          <p className="mt-2 text-sm text-center text-pretty text-muted-foreground">
            Soru sayısını seç, oda kodun otomatik oluşturulacak.
          </p>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Soru sayısı</p>
            <div className="flex gap-2">
              {[5, 10, 15].map((n) => (
                <button
                  key={n}
                  onClick={() => setFriendlySoruSayisi(n)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                    friendlySoruSayisi === n
                      ? "bg-teal text-teal-foreground shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={odaKur}
            disabled={cooldownAktif}
            className="mt-5 w-full rounded-2xl bg-teal py-3.5 text-sm font-bold text-teal-foreground shadow-md transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Odayı Oluştur
          </button>
          <button
            onClick={() => setAdim("lobi")}
            className="mt-3 w-full text-xs font-semibold text-muted-foreground transition hover:text-teal"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  // --- ODA KATIL (sadece kod girişi) ---
  if (adim === "oda_katil") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-rise glass-card rounded-[1.75rem] p-7 shadow-[0_12px_40px_-12px_rgba(14,116,144,0.12)] max-w-sm w-full ring-1 ring-border">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-teal/10 text-teal ring-1 ring-teal/20">
            <KeyRound className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-lg font-bold text-center text-card-foreground">Odaya Katıl</h2>
          <p className="mt-2 text-sm text-center text-pretty text-muted-foreground">
            Arkadaşının paylaştığı 4 haneli kodu gir.
          </p>

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
            className="mt-5 w-full rounded-2xl bg-muted/60 px-4 py-3.5 text-lg font-bold tracking-widest text-center text-foreground placeholder:text-muted-foreground/60 placeholder:tracking-normal placeholder:font-normal outline-none focus:ring-2 focus:ring-teal/40 transition ring-1 ring-border"
          />
          {odaHata && (
            <p className="mt-2 text-xs font-semibold text-destructive text-center">{odaHata}</p>
          )}
          <button
            onClick={odayaKatil}
            disabled={odaInput.length !== 4}
            className="mt-4 w-full rounded-2xl bg-teal py-3.5 text-sm font-bold text-teal-foreground shadow-md transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Katıl
          </button>
          <button
            onClick={() => setAdim("lobi")}
            className="mt-3 w-full text-xs font-semibold text-muted-foreground transition hover:text-teal"
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
        <div className="animate-rise glass-card rounded-[1.75rem] p-7 shadow-[0_12px_40px_-12px_rgba(14,116,144,0.12)] max-w-sm w-full text-center ring-1 ring-border">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-teal/10 text-teal ring-1 ring-teal/20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal/20 border-t-teal" />
          </div>
          <h2 className="font-serif text-lg font-bold text-card-foreground">Rakip bekleniyor...</h2>
          <p className="mt-2 text-xs text-muted-foreground">Oda kodun</p>
          <div className="mt-2 rounded-2xl bg-muted/60 py-4 text-3xl font-bold tracking-[0.4em] text-teal ring-1 ring-teal/20">
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
            className="mt-5 text-xs font-semibold text-muted-foreground transition hover:text-teal"
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
        <div className="animate-rise glass-card rounded-[1.75rem] p-8 text-center shadow-[0_12px_40px_-12px_rgba(14,116,144,0.12)] max-w-sm w-full ring-1 ring-border">
          <div
            className={`mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl animate-pop ${
              kazandi
                ? "bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30"
                : berabere
                  ? "bg-duello/10 text-duello ring-1 ring-duello/30"
                  : "bg-destructive/15 text-destructive ring-1 ring-destructive/30"
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
            <div className="glass-card rounded-2xl p-4 ring-1 ring-border">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {kullanici?.kullaniciAdi}
              </p>
              <p className="mt-1 text-2xl font-bold text-teal">{sonuc.oyuncuSkor} EP</p>
            </div>
            <div className="glass-card rounded-2xl p-4 ring-1 ring-border">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {sonuc.rakipAdi}
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">{sonuc.rakipSkor} EP</p>
            </div>
          </div>

          {dueloModu === "ranked" && (
            <div className="mt-4 space-y-2">
              <div className={`flex items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-semibold ring-1 ${
                sonuc.puanKazandi > 0
                  ? "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20"
                  : sonuc.puanKazandi < 0
                    ? "bg-destructive/10 text-destructive ring-destructive/20"
                    : "bg-muted/40 text-muted-foreground ring-border"
              }`}>
                <Zap className="h-4 w-4" />
                {sonuc.puanKazandi > 0 ? `+${sonuc.puanKazandi} EP` : sonuc.puanKazandi < 0 ? `${sonuc.puanKazandi} EP` : "0 EP"}
              </div>
              {sonuc.seri >= 2 && (
                <div className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500/10 py-2.5 text-sm font-semibold text-orange-500 ring-1 ring-orange-500/20">
                  <Flame className="h-4 w-4" /> {sonuc.seri} Galibiyet Serisi
                </div>
              )}
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                dueloSifirla();
                rastgeleRakip();
              }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-duello py-3.5 text-sm font-bold text-duello-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
            >
              <Swords className="h-4 w-4" /> Yeni Düello
            </button>
            <button
              onClick={cikisIste}
              className="flex items-center justify-center gap-2 rounded-2xl glass-card py-3.5 text-sm font-semibold text-muted-foreground ring-1 ring-border transition hover:text-teal active:scale-[0.98]"
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
  const sonUcSaniye = sure <= 3 && sure > 0;
  const sureRenk = sure > 5 ? "bg-teal" : sure > 3 ? "bg-amber-500" : "bg-destructive";
  const sureMetinRenk = sure > 5 ? "text-teal" : sure > 3 ? "text-amber-500" : "text-destructive";
  const bekleniyor = secim !== null && !rakipCevapladi;
  const cevapDogru = secim !== null && secim !== ZAMAN_ASIMI && secim === soru.dogru;

  return (
    <div className="flex flex-col flex-1 min-h-0 animate-rise">
      {/* Skor barı */}
      <div className="mb-3 glass-card rounded-2xl p-3 ring-1 ring-border shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 items-center gap-2">
            <span className="text-lg">{avatarEmoji(kullanici.avatar)}</span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {kullanici.kullaniciAdi}
              </p>
              <p className="text-lg font-bold text-duello">{oyuncuSkor}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-muted-foreground">VS</span>
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
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${sureMetinRenk} ${sonUcSaniye ? "animate-urgent-scale" : ""}`}>
            <Clock className="h-3 w-3" />
            {sure}s
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${sureRenk} ${sonUcSaniye ? "animate-pulse-red" : ""}`}
            style={{ width: `${sureYuzde}%` }}
          />
        </div>
      </div>

      {/* Soru kartı */}
      <div className="relative glass-card flex flex-col rounded-[1.75rem] p-5 ring-1 ring-border">
        {/* Terk Et butonu — sağ üst köşe */}
        <button
          onClick={forfeitYap}
          className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/20 active:scale-95 ring-1 ring-destructive/20"
          aria-label="Maçı terk et"
        >
          <LogOut className="h-3.5 w-3.5" /> Terk Et
        </button>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal">
          {soru.tip === "eser" ? "Yazarın eseri" : "Eserin yazarı"}
        </p>
        <h2 className="mt-1.5 font-serif text-xl font-bold leading-snug text-balance text-card-foreground">
          {soru.vurgu}
        </h2>
        <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{soru.metin}</p>

        <div className="mt-3 space-y-2">
          {soru.secenekler.map((secenek, i) => {
            const secildi = secim === secenek;
            const dogruSecenek = secenek === soru.dogru;
            const gosterDogru = secim !== null && rakipCevapladi && dogruSecenek;
            const gosterYanlis = secildi && !dogruSecenek;

            let stil = "glass-card hover:bg-muted/40 text-card-foreground ring-1 ring-border";
            if (gosterDogru) stil = "bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30";
            else if (gosterYanlis) stil = "bg-destructive/15 text-destructive ring-1 ring-destructive/30";
            else if (secim !== null) stil = "bg-card/40 text-muted-foreground opacity-60 ring-1 ring-border";

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
          <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold">
            {bekleniyor ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                Rakip bekleniyor...
              </span>
            ) : secim === ZAMAN_ASIMI ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-destructive/10 px-3 py-1.5 text-destructive ring-1 ring-destructive/20">
                <X className="h-3.5 w-3.5" strokeWidth={2.5} /> Süre doldu!
              </span>
            ) : cevapDogru ? (
              <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-emerald-500 ring-1 ring-emerald-500/20">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                Doğru Cevap!
                {ertelenmisSkor.current > 0 && (
                  <span className="font-bold">+{ertelenmisSkor.current} EP</span>
                )}
                {istatistik?.seri >= 2 && (
                  <span className="inline-flex items-center gap-0.5 text-orange-500">
                    <Flame className="h-3 w-3" /> {istatistik.seri}
                  </span>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-destructive/10 px-3 py-1.5 text-destructive ring-1 ring-destructive/20">
                <X className="h-3.5 w-3.5" strokeWidth={2.5} /> Yanlış cevap.
              </span>
            )}
          </div>
        )}

        {/* Tur sonu puan animasyonu — sleek float-up */}
        {turPuani !== null && (
          <div className="pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2 animate-[floatUp_1s_ease-out_forwards]">
            <span className="text-lg font-bold text-emerald-500 drop-shadow-sm">
              +{turPuani} EP
            </span>
          </div>
        )}
      </div>

      {/* Forfeit onay modalı — oyuncu Terk Et'e bastığında */}
      {forfeitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-md">
          <div className="animate-pop glass-card max-w-sm w-full rounded-[1.75rem] p-7 text-center shadow-2xl ring-1 ring-destructive/20">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-destructive/15 text-destructive animate-pop ring-1 ring-destructive/30">
              <LogOut className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-xl font-bold tracking-tight text-card-foreground">
              Maçı Terk Et
            </h2>
            <p className="mt-2 text-sm text-pretty text-muted-foreground">
              Düellodan ayrılırsanız maçı kaybetmiş sayılacaksınız. Emin misiniz?
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => setForfeitConfirm(false)}
                className="rounded-2xl bg-muted/60 py-3.5 text-sm font-semibold text-foreground transition hover:bg-muted/40 active:scale-[0.98]"
              >
                Vazgeç
              </button>
              <button
                onClick={forfeitOnayla}
                className="rounded-2xl bg-destructive py-3.5 text-sm font-bold text-white shadow-md transition hover:brightness-110 active:scale-[0.98]"
              >
                Terk Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forfeit popup — rakip oyundan çekildi */}
      {forfeitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-md">
          <div className="animate-pop glass-card max-w-sm w-full rounded-[1.75rem] p-8 text-center shadow-2xl ring-1 ring-emerald-500/20">
            <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-emerald-500/15 text-emerald-500 animate-pop ring-1 ring-emerald-500/30">
              <Trophy className="h-9 w-9" strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-2xl font-bold tracking-tight text-card-foreground">
              Rakip Düellodan Çekildi! Hükmen Kazandın! 🎉
            </h2>
            <p className="mt-2 text-sm text-pretty text-muted-foreground">
              Rakibiniz oyundan ayrıldı ve maçı hükmen kazandınız.
            </p>
            <button
              onClick={() => {
                setForfeitModal(false);
                maciBitir(true, false, true, oyuncuSkorRef.current, rakipSkorRef.current);
                dueloSifirla();
                onCikis();
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-duello py-3.5 text-sm font-bold text-duello-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
            >
              <Home className="h-4 w-4" /> Ana Sayfaya Dön
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
