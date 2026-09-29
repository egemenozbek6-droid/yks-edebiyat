"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  ChevronDown,
  Clock,
  Flame,
  Hop as Home,
  KeyRound,
  Lock,
  LogOut,
  Pencil,
  Shield,
  Swords,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { sorulariUret, type Soru } from "@/lib/soru";
import { gecerliYazarlar } from "@/src/data";
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
  cevapGonder,
  sonrakiSoru,
  matchBitir,
  matchTerk,
  kullaniciAdiKaydetOnline,
  rovanşTeklifEt,
  rovanşBaslatIfHazir,
  rovanşDinle,
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
  const [katiliyor, setKatiliyor] = useState(false);
  const katilRef = useRef(false);
  const kutuRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  // Tur sonu puan göstergesi (uçan animasyon YOK — "Doğru Cevap" yanında sabit durur)
  const [gosterilenPuan, setGosterilenPuan] = useState<number | null>(null);

  // Ertelenmiş skor (her iki taraf cevaplayana kadar beklet — iç kullanım)
  const ertelenmisSkor = useRef<number>(0);

  // Günlük görev takibi (maç içi)
  const dogruSeriRef = useRef(0);
  // Maç içi "soru bilme streaki" — UI'da gösterilen canlı state.
  // NOT: istatistik.seri ile KARIŞTIRMA — o, maç KAZANMA streakidir ve
  // sadece maç bittiğinde güncellenir. Bu state ise maç içinde soru
  // cevapladıkça anlık güncellenir.
  const [dogruSeri, setDogruSeri] = useState(0);
  const toplamDogruRef = useRef(0);
  const toplamMatchScoreRef = useRef(0);
  const [gorevler, setGorevler] = useState<GunlukGorevState | null>(null);
  const [gorevAcik, setGorevAcik] = useState(false);
  const [kariyerAcik, setKariyerAcik] = useState(false);

  // Refs for reliable reads inside async callbacks
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
          const benimId = kullaniciRef.current.cihazId || kullaniciRef.current.kullaniciAdi;
          const digerId = rakipIdRef.current || rakipRef.current?.ad || "";
          matchTerk(mId, benimId, digerId).catch(() => {});
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
      cihazId: cihazIdUret(),
      avatar: rastgeleAvatarId(),
      olusturmaTarihi: Date.now(),
    };
    if (firebaseAktif) {
      const r = await kullaniciAdiKaydetOnline(
        yeniKullanici.kullaniciAdi,
        yeniKullanici.cihazId ?? yeniKullanici.kullaniciAdi,
      );
      if (r === "alinmis") {
        setNickHata("Bu kullanıcı adı alınmış");
        return;
      }
      // r === "hata": bağlantı sorunu, kullanıcıyı bloklama (konsola loglandı)
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
    setGosterilenPuan(null);
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
        puanKazandi: mod === "ranked" ? puanKazandi : 0,
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

      // Özel oda: rövanş tekliflerini dinle (ref ile — sıra sorunu olmasın)
      if (mod === "friendly" && matchIdRef.current && !matchIdRef.current.startsWith("bot_")) {
        const mid = matchIdRef.current;
        window.setTimeout(() => {
          rovanşDinlemeyiBaslatRef.current?.(mid);
        }, 0);
      }

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
      // Maç başladı: oda kodu artık "bekleyen oda" değil, unmount'ta silinmeye çalışılmasın
      setOlusturulanKod("");
      olusturulanKodRef.current = "";
      setAdim("duelo");
      adimRef.current = "duelo";
      // Günlük görev takibini sıfırla
      dogruSeriRef.current = 0;
      setDogruSeri(0);
      toplamDogruRef.current = 0;
      toplamMatchScoreRef.current = 0;
      setGosterilenPuan(null);
      ertelenmisSkor.current = 0;
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

  // --- Anti-spam cooldown (2 saniye) ---
  const cooldownBaslat = useCallback(() => {
    setCooldownAktif(true);
    if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    cooldownTimer.current = window.setTimeout(() => setCooldownAktif(false), 2000);
  }, []);

  // --- Rastgele rakip bul (ranked) — Firebase matchmaking + bot fallback ---
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
            // Bekleyen taraf oyuncu1, katılan taraf oyuncu2 — matchmaking söylüyor
            dueloBaslat("ranked", durum.rakip, SORU_SAYISI, durum.matchId, durum.oyuncuNum, durum.sorular);
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

  // --- Odaya katıl — Gerçek online, bot yok ---
  const odayaKatil = useCallback(async () => {
    if (katilRef.current) return; // çift tıklama / çift istek koruması
    const trimmedInput = odaInput.trim();
    if (trimmedInput.length !== 4) return;
    const k = kullaniciRef.current;
    if (!k) return;

    if (!firebaseAktif) {
      setOdaHata("Çevrimiçi mod kapalı. Firebase anahtarları gerekli.");
      return;
    }

    katilRef.current = true;
    setKatiliyor(true);
    setOdaHata("");
    try {
      // Tüm duel state'ini sıfırla
      dueloSifirla();

      const sonuc = await odayaKatilOnline(trimmedInput, {
        id: k.cihazId || k.kullaniciAdi,
        ad: k.kullaniciAdi,
        avatar: k.avatar,
      });

      if (!sonuc.tamam || !sonuc.mac || !sonuc.matchId) {
        setOdaHata(sonuc.hata ?? "Geçersiz oda kodu!");
        return;
      }

      // Katıldık: kurucunun maç bilgisiyle doğrudan oyuna gir (oyuncu2 olarak)
      const mac = sonuc.mac;
      setOdaInput("");
      dueloBaslat(
        "friendly",
        { ad: mac.oyuncu1.ad, avatar: mac.oyuncu1.avatar, bot: false, id: mac.oyuncu1.id },
        mac.soruSayisi,
        sonuc.matchId,
        2,
        mac.sorular ?? [],
      );
    } finally {
      katilRef.current = false;
      setKatiliyor(false);
    }
  }, [odaInput, dueloBaslat, dueloSifirla]);

  // --- 4 kutulu oda kodu girişi ---
  const kutuFocus = (i: number) => {
    window.setTimeout(() => kutuRefs.current[Math.max(0, Math.min(3, i))]?.focus(), 0);
  };

  const kutuDegis = (i: number, ham: string) => {
    if (katiliyor) return;
    const d = ham.replace(/\D/g, "").slice(-1);
    if (!d) return;
    const yeniKod = (odaInput.slice(0, i) + d + odaInput.slice(i + 1)).slice(0, 4);
    setOdaInput(yeniKod);
    setOdaHata("");
    kutuFocus(yeniKod.length);
  };

  const kutuTus = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (katiliyor) return;
    if (e.key === "Enter") {
      odayaKatil();
      return;
    }
    if (e.key === "Backspace") {
      e.preventDefault();
      setOdaHata("");
      if (i < odaInput.length) {
        setOdaInput(odaInput.slice(0, i) + odaInput.slice(i + 1));
        kutuFocus(i);
      } else if (odaInput.length > 0) {
        const n = odaInput.length - 1;
        setOdaInput(odaInput.slice(0, n));
        kutuFocus(n);
      }
    } else if (e.key === "ArrowLeft") {
      kutuFocus(i - 1);
    } else if (e.key === "ArrowRight") {
      kutuFocus(i + 1);
    }
  };

  const kutuYapistir = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (katiliyor) return;
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    setOdaInput(p);
    setOdaHata("");
    kutuFocus(p.length);
  };

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
        setGosterilenPuan(rp);
        sfxCorrect();
        dogruSeriRef.current += 1;
        setDogruSeri(dogruSeriRef.current);
        toplamDogruRef.current += 1;
      } else {
        ertelenmisSkor.current = 0;
        setGosterilenPuan(null);
        sfxWrong();
        dogruSeriRef.current = 0;
        setDogruSeri(0);
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
          ? mac.kazananId === (kullaniciRef.current?.cihazId || kullaniciRef.current?.kullaniciAdi)
          : oS > rS;
        const berabere = !hukmen && oS === rS;
        // Eğer rakip terk ettiyse ve biz kazandıysak popup göster
        if (hukmen && kazandi && mac.forfeitedBy && mac.forfeitedBy !== (kullaniciRef.current?.cihazId || kullaniciRef.current?.kullaniciAdi)) {
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

    // Ertelenmiş skoru uygula — uçan animasyon YOK, skor "Doğru Cevap" yanında sabit görünür
    const ertelenen = ertelenmisSkor.current;
    if (ertelenen > 0) {
      const yeniSkor = oyuncuSkorRef.current + ertelenen;
      oyuncuSkorRef.current = yeniSkor;
      setOyuncuSkor(yeniSkor);
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
          matchBitir(mId, kazandi ? (kullaniciRef.current?.cihazId || kullaniciRef.current?.kullaniciAdi) ?? null : null).catch(() => {});
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
        setGosterilenPuan(null);
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
      const benimId = kullaniciRef.current.cihazId || kullaniciRef.current.kullaniciAdi;
      const digerId = rakipIdRef.current || rakipRef.current?.ad || "";
      matchTerk(mId, benimId, digerId).catch(() => {});
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
      <div className="flex-1 flex flex-col justify-center py-1 min-h-0">
        <div className="animate-rise w-full max-w-3xl mx-auto grid gap-3 md:grid-cols-2">

          {/* PROFİL & RANK */}
          <div className="glass-card rounded-xl p-4 ring-1 ring-border flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="relative shrink-0">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-duello/15 text-xl ring-1 ring-duello/30">
                    {avatarEmoji(kullanici.avatar)}
                  </div>
                  {istatistik && istatistik.seri >= 2 && (
                    <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-md">
                      <Flame className="h-2.5 w-2.5" /> {istatistik.seri}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-serif text-sm font-bold text-card-foreground">
                      {kullanici.kullaniciAdi}
                    </p>
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-duello/15 text-[11px] ring-1 ring-duello/20">
                      {simdikiRank.ikon}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {istatistik?.macSayisi ?? 0} maç tamamlandı
                  </p>
                </div>
              </div>
              <button
                onClick={onProfilAc}
                className="grid h-8 w-8 place-items-center rounded-full bg-muted/60 text-muted-foreground ring-1 ring-border transition hover:text-duello hover:ring-duello/30 active:scale-95"
                aria-label="Profili düzenle"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              onClick={() => setKariyerAcik(true)}
              className="mb-2.5 w-full rounded-xl bg-muted/40 p-3 ring-1 ring-border text-left transition hover:ring-duello/30 active:scale-[0.99]"
            >
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="text-base" style={{ filter: `drop-shadow(0 0 6px ${simdikiRank.renk}40)` }}>
                    {simdikiRank.ikon}
                  </span>
                  <span className="truncate font-serif text-xs font-bold text-card-foreground">
                    {simdikiRank.ad}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">{rp} EP</span>
                  <span className="rounded-md bg-duello/15 px-2 py-0.5 text-[10px] font-bold text-duello ring-1 ring-duello/20">
                    Kariyer ›
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{
                    width: `${rankProgress}%`,
                    background: hedefRank
                      ? `linear-gradient(to right, ${simdikiRank.renk}80, ${simdikiRank.renk})`
                      : "linear-gradient(to right, #eab30880, #eab308)",
                  }}
                />
              </div>
              {hedefRank ? (
                <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>%{rankProgress} tamamlandı</span>
                  <span>
                    {hedefRank.ad}&apos;a {hedefeKalan} EP
                  </span>
                </div>
              ) : (
                <p className="mt-1.5 text-center text-[10px] font-semibold text-amber-400">
                  👑 Zirvedesin · Maksimum Rütbe
                </p>
              )}
            </button>

            {(() => {
              const tamamlanan = gorevState.gorevler.filter((g) => gorevState.durumlar[g.tur]?.tamamlandi).length;
              return (
                <div className="mb-2.5 rounded-xl bg-amber-500/5 ring-1 ring-amber-500/15 overflow-hidden">
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
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                      Görevler
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${gorevAcik ? "rotate-180" : ""}`} />
                    </span>
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
                                  <p className="text-[9px] text-muted-foreground trunc
