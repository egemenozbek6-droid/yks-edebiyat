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

  // Kazanılan EP (doğru şıkta, rakip cevaplayınca gösterilir)
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
  // Günlük görev ödülü alındığında Toplam EP kutusunda +EP hissi
  const [odulToast, setOdulToast] = useState<number | null>(null);
  const odulToastTimer = useRef<number | null>(null);

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

    // Ertelenmiş skoru uygula (her iki taraf cevaplayınca skora yansır)
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
    const bekleyenOdul = gorevState.gorevler.filter(
      (g) => gorevState.durumlar[g.tur]?.tamamlandi && !gorevState.durumlar[g.tur]?.odulAlindi,
    ).length;
    const gorevOduluAl = (tur: string) => {
      const { odul } = gorevOdulAl(tur as any);
      if (odul > 0) {
        const guncelIstatistik = mevcutIstatistik();
        const yeniIstatistik = { ...guncelIstatistik, puan: guncelIstatistik.puan + odul };
        istatistikYaz(yeniIstatistik);
        setIstatistik(yeniIstatistik);
        // Toplam EP kutusunda +EP hissi
        if (odulToastTimer.current) clearTimeout(odulToastTimer.current);
        setOdulToast(odul);
        odulToastTimer.current = window.setTimeout(() => setOdulToast(null), 2200);
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
              const alinan = gorevState.gorevler.filter((g) => gorevState.durumlar[g.tur]?.odulAlindi).length;
              return (
                <div
                  className={`mb-2.5 rounded-xl overflow-hidden transition ring-1 ${
                    bekleyenOdul > 0
                      ? "bg-amber-500/10 ring-amber-500/40 shadow-[0_0_18px_rgba(245,158,11,0.15)]"
                      : "bg-amber-500/5 ring-amber-500/15"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setGorevAcik(!gorevAcik)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition hover:bg-amber-500/10 active:scale-[0.99]"
                  >
                    <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-bold text-card-foreground">
                      <span className="text-base leading-none">🎯</span>
                      <span className="truncate">Günlük Görevler</span>
                      <span className="shrink-0 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-500 ring-1 ring-amber-500/25">
                        {tamamlanan}/{gorevState.gorevler.length}
                      </span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1.5">
                      {bekleyenOdul > 0 && (
                        <span className="animate-pulse rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                          {bekleyenOdul} ödül hazır!
                        </span>
                      )}
                      {bekleyenOdul === 0 && alinan === gorevState.gorevler.length && gorevState.gorevler.length > 0 && (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                          Tamam ✓
                        </span>
                      )}
                      <ChevronDown
                        className={`h-4 w-4 text-amber-500 transition-transform duration-300 ${gorevAcik ? "rotate-180" : ""}`}
                      />
                    </span>
                  </button>
                  {gorevAcik && (
                    <div className="space-y-2 px-3 pb-3 animate-rise">
                      <p className="text-[10px] text-muted-foreground">
                        Görevleri bitir, ödülü al — EP doğrudan Toplam EP&apos;ne eklenir.
                      </p>
                      {gorevState.gorevler.map((g) => {
                        const durum = gorevState.durumlar[g.tur];
                        if (!durum) return null;
                        const yuzde = Math.min(100, Math.round((durum.ilerleme / g.hedef) * 100));
                        const odulHazir = durum.tamamlandi && !durum.odulAlindi;
                        return (
                          <div
                            key={g.tur}
                            className={`rounded-lg p-2.5 ring-1 transition ${
                              odulHazir
                                ? "bg-emerald-500/10 ring-emerald-500/35"
                                : durum.odulAlindi
                                  ? "bg-muted/30 ring-border/60 opacity-80"
                                  : "bg-muted/40 ring-border"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-1.5">
                                <span className="shrink-0 text-base leading-none">{g.ikon}</span>
                                <div className="min-w-0">
                                  <p className="truncate text-[11px] font-bold text-card-foreground">{g.etiket}</p>
                                  <p className="truncate text-[9px] text-muted-foreground">{g.aciklama}</p>
                                </div>
                              </div>
                              <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-500 ring-1 ring-amber-500/20">
                                +{g.odul} EP
                              </span>
                            </div>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className={`h-full rounded-full transition-[width] duration-500 ${
                                  durum.tamamlandi ? "bg-emerald-500" : "bg-amber-500"
                                }`}
                                style={{ width: `${yuzde}%` }}
                              />
                            </div>
                            <div className="mt-1.5 flex items-center justify-between gap-2">
                              <span className="text-[10px] font-medium text-muted-foreground">
                                {durum.ilerleme} / {g.hedef}
                              </span>
                              {odulHazir ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    gorevOduluAl(g.tur);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-md shadow-emerald-500/25 transition hover:brightness-110 active:scale-95"
                                >
                                  <Zap className="h-3 w-3" /> Ödülü Al · +{g.odul} EP
                                </button>
                              ) : durum.odulAlindi ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                                  <Check className="h-3 w-3" /> Alındı · +{g.odul} EP
                                </span>
                              ) : (
                                <span className="text-[9px] font-semibold text-muted-foreground/80">
                                  Devam et
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="mt-auto grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-muted/40 p-2.5 text-center ring-1 ring-border">
                <p className="flex items-center justify-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Shield className="h-3 w-3 text-emerald-500" /> Galibiyet
                </p>
                <p className="mt-1 text-lg font-bold text-emerald-500">{istatistik?.galibiyet ?? 0}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-2.5 text-center ring-1 ring-border">
                <p className="flex items-center justify-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <X className="h-3 w-3 text-destructive" /> Mağlubiyet
                </p>
                <p className="mt-1 text-lg font-bold text-destructive">{istatistik?.maglubiyet ?? 0}</p>
              </div>
              <div className={`rounded-xl bg-muted/40 p-2.5 text-center ring-1 transition duration-300 ${
                odulToast !== null ? "ring-emerald-500/50 bg-emerald-500/10 scale-[1.03]" : "ring-border"
              }`}>
                <p className="flex items-center justify-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Zap className="h-3 w-3 text-duello" /> Toplam EP
                </p>
                <p className="mt-1 text-lg font-bold text-duello tabular-nums">{rp}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-lg bg-muted/30 px-3 py-1.5 text-[10px] text-muted-foreground ring-1 ring-border/60">
              <span>Kazanma Oranı</span>
              <span className="font-bold text-foreground">
                %
                {(istatistik?.macSayisi ?? 0) > 0
                  ? Math.round(((istatistik?.galibiyet ?? 0) / (istatistik?.macSayisi ?? 1)) * 100)
                  : 0}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={rastgeleRakip}
              disabled={cooldownAktif}
              className="flex items-center gap-3 rounded-xl glass-card p-3.5 text-left ring-1 ring-duello/30 transition hover:ring-duello/50 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-duello text-white shadow-[0_0_22px_rgba(220,38,38,0.35)]">
                <Swords className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-serif text-sm font-bold text-card-foreground">Dereceli Maç</p>
                  <span className="rounded-full bg-duello/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-duello">
                    Ranked
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Canlı rakip bul, EP kazan ve lig atla!
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-duello px-3.5 py-2 text-xs font-bold text-white">
                Oyna ›
              </span>
            </button>

            <div className="glass-card rounded-xl p-4 ring-1 ring-border">
              <div className="mb-2.5 flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-duello/10 text-duello ring-1 ring-duello/20">
                  <KeyRound className="h-4 w-4" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-serif text-sm font-bold text-card-foreground">Özel Oda</p>
                  <p className="text-[10px] text-muted-foreground">Arkadaşınla birebir dostluk maçı</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAdim("oda_kur")}
                  disabled={cooldownAktif}
                  className="rounded-xl bg-duello/15 py-2.5 text-sm font-semibold text-duello ring-1 ring-duello/20 transition hover:bg-duello/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                >
                  + Oda Kur
                </button>
                <button
                  onClick={() => {
                    setOdaInput("");
                    setOdaHata("");
                    setAdim("oda_katil");
                  }}
                  className="rounded-xl glass-card py-2.5 text-sm font-semibold text-foreground ring-1 ring-border transition hover:ring-duello/30 active:scale-[0.98]"
                >
                  › Odaya Katıl
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Ödül alındı — ekranın ortasında net görünür */}
        {odulToast !== null && (
          <div className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center p-6">
            <div className="animate-pop rounded-2xl bg-emerald-500 px-7 py-5 text-center shadow-2xl shadow-emerald-500/40 ring-2 ring-white/20">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Ödül alındı</p>
              <p className="mt-1 text-3xl font-black tabular-nums text-white">+{odulToast} EP</p>
              <p className="mt-1 text-[11px] font-semibold text-emerald-50">Toplam EP&apos;ye eklendi</p>
            </div>
          </div>
        )}

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
                {/* Dikey çizgi */}
                <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-border" />

                <div className="space-y-3">
                  {RANK_KADEMELERI.map((k, i) => {
                    const acik = rp >= k.min;
                    const simdiki = rp >= k.min && rp <= k.max;
                    const sonraki = i < RANK_KADEMELERI.length - 1 ? RANK_KADEMELERI[i + 1] : null;
                    const kalanEP = sonraki ? sonraki.min - rp : 0;
                    return (
                      <div key={k.ad} className="relative flex items-start gap-3 pl-0">
                        {/* Badge daire */}
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

                        {/* İçerik */}
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
                              Maksimum rütbeye ulaştın!
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

  // --- ODA KUR (sadece soru sayısı seçimi → oda kodu oluştur) ---
  if (adim === "oda_kur") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-rise glass-card rounded-xl p-7 shadow-sm max-w-sm w-full ring-1 ring-border">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-lg bg-duello/10 text-duello ring-1 ring-duello/20">
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
                      ? "bg-duello text-duello-foreground shadow-sm"
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
            className="mt-5 w-full rounded-lg bg-duello py-3.5 text-sm font-bold text-duello-foreground shadow-md transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Odayı Oluştur
          </button>
          <button
            onClick={() => setAdim("lobi")}
            className="mt-3 w-full text-xs font-semibold text-muted-foreground transition hover:text-duello"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  // --- ODA KATIL (4 kutulu kod girişi) ---
  if (adim === "oda_katil") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-rise glass-card rounded-xl p-7 shadow-sm max-w-sm w-full ring-1 ring-border">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-lg bg-duello/10 text-duello ring-1 ring-duello/20">
            <KeyRound className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-lg font-bold text-center text-card-foreground">Odaya Katıl</h2>
          <p className="mt-2 text-sm text-center text-pretty text-muted-foreground">
            Arkadaşının paylaştığı 4 haneli kodu gir.
          </p>

          <div className="mt-5 flex justify-center gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <input
                key={i}
                ref={(el) => { kutuRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus={i === 0}
                value={odaInput[i] ?? ""}
                disabled={katiliyor}
                onChange={(e) => kutuDegis(i, e.target.value)}
                onKeyDown={(e) => kutuTus(i, e)}
                onPaste={kutuYapistir}
                onFocus={(e) => e.target.select()}
                aria-label={`Oda kodu ${i + 1}. hane`}
                className="h-14 w-12 rounded-lg bg-muted/60 text-center text-2xl font-bold text-foreground outline-none ring-1 ring-border transition focus:ring-2 focus:ring-duello/60 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            ))}
          </div>
          {odaHata && (
            <p className="mt-3 text-xs font-semibold text-destructive text-center">{odaHata}</p>
          )}
          <button
            onClick={odayaKatil}
            disabled={odaInput.length !== 4 || katiliyor}
            className="mt-4 w-full rounded-lg bg-duello py-3.5 text-sm font-bold text-duello-foreground shadow-md transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {katiliyor ? "Katılınıyor..." : "Katıl"}
          </button>
          <button
            onClick={() => setAdim("lobi")}
            disabled={katiliyor}
            className="mt-3 w-full text-xs font-semibold text-muted-foreground transition hover:text-duello disabled:opacity-50"
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
        <div className="animate-rise glass-card rounded-xl p-7 shadow-sm max-w-sm w-full text-center ring-1 ring-border">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-lg bg-duello/10 text-duello ring-1 ring-duello/20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-duello/20 border-t-duello" />
          </div>
          <h2 className="font-serif text-lg font-bold text-card-foreground">Rakip bekleniyor...</h2>
          <p className="mt-2 text-xs text-muted-foreground">Oda kodun</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <div className="rounded-lg bg-muted/60 px-5 py-4 text-3xl font-bold tracking-[0.4em] text-duello ring-1 ring-duello/20">
              {olusturulanKod}
            </div>
            <button
              type="button"
              onClick={async () => {
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
              }}
              className="grid h-12 w-12 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:text-duello"
              aria-label="Kodu kopyala"
            >
              {kodKopyalandi ? (
                <Check className="h-5 w-5 text-emerald-500" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </button>
          </div>
          {kodKopyalandi && (
            <p className="mt-2 text-xs font-semibold text-emerald-500">Panoya kopyalandı</p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Bu kodu arkadaşınla paylaş. Rakip katılınca maç otomatik başlar.
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Soru sayısı: {friendlySoruSayisi}</span>
          </div>
          <button
            onClick={odaBeklemeIptal}
            className="mt-5 text-xs font-semibold text-muted-foreground transition hover:text-duello"
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
        <div className="animate-rise glass-card rounded-xl p-8 text-center shadow-sm max-w-sm w-full ring-1 ring-border">
          <div
            className={`mx-auto mb-5 grid h-20 w-20 place-items-center rounded-xl animate-pop ${
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
          <h2 className="font-sans text-2xl font-black tracking-tight text-card-foreground">
            {hukmenGalibiyet
              ? "Rakip kaçtı."
              : kazandi
                ? "Ezici üstünlük."
                : berabere
                  ? "Berabere kaldınız."
                  : "Bu sefer olmadı."}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {hukmenGalibiyet
              ? "Rakip oyundan çıktı. Galibiyet senin."
              : kazandi
                ? "Rakip utansın."
                : berabere
                  ? "İkiniz de aynı skoru yaptınız."
                  : "Rövanş ister misin, yoksa kaçacak mısın?"}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="glass-card rounded-lg p-4 ring-1 ring-border">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {kullanici?.kullaniciAdi}
              </p>
              <p className="mt-1 text-2xl font-bold text-duello">{sonuc.oyuncuSkor} EP</p>
            </div>
            <div className="glass-card rounded-lg p-4 ring-1 ring-border">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {sonuc.rakipAdi}
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">{sonuc.rakipSkor} EP</p>
            </div>
          </div>

          {dueloModu === "ranked" && (
            <div className="mt-4 space-y-2">
              <div className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold ring-1 ${
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
                <div className="flex items-center justify-center gap-2 rounded-lg bg-orange-500/10 py-2.5 text-sm font-semibold text-orange-500 ring-1 ring-orange-500/20">
                  <Flame className="h-4 w-4" /> {sonuc.seri} Galibiyet Serisi
                </div>
              )}
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={async () => {
                const mod = dueloModuRef.current;
                const mid = matchIdRef.current || sonFriendlyMatchRef.current;
                const k = kullaniciRef.current;
                const kid = k?.cihazId || k?.kullaniciAdi;

                // Özel oda rövanş
                if (mod === "friendly") {
                  if (!mid || mid.startsWith("bot_") || !kid) {
                    setRovanşBekleniyor(false);
                    alert("Rövanş için maç bilgisi bulunamadı. Lobiye dönüp yeni oda kur.");
                    return;
                  }
                  setRovanşBekleniyor(true);
                  try {
                    // dinleyiciyi garanti et
                    rovanşDinlemeyiBaslatRef.current?.(mid);
                    await rovanşTeklifEt(mid, kid);
                    const basladi = await rovanşBaslatIfHazir(mid);
                    if (!basladi) {
                      // rakip henüz kabul etmedi — sonuç ekranında bekle
                    }
                  } catch (e) {
                    console.error("[rovanş]", e);
                    setRovanşBekleniyor(false);
                    alert("Rövanş teklifi gönderilemedi.");
                  }
                  return;
                }

                // Ranked rövanş — önce adımı aramaya al, sonra sıfırla (boş ekran olmasın)
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
              className="btn-press-duello flex items-center justify-center gap-2 rounded-lg bg-duello py-3.5 text-sm font-bold text-duello-foreground disabled:opacity-60"
            >
              <Swords className="h-4 w-4" />
              {rovanşBekleniyor ? "Rakip bekleniyor..." : "Rövanş"}
            </button>
            <button
              onClick={cikisIste}
              className="btn-press-muted flex items-center justify-center gap-2 rounded-lg bg-card py-3.5 text-sm font-bold text-muted-foreground ring-1 ring-border"
            >
              <Home className="h-4 w-4" /> Çık
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- DUELO (aktif maç) ---
  const soru = sorular[soruIndex];
  if (!soru || !kullanici || !rakip) {
    // Boş ekran olmasın: düello state eksikse lobiye dön
    if (adim === "duelo" || adim === "sonuc") {
      // sonuç silinmiş / rövanş yarım kalmış
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

  const oyuncuRank = rankBul(istatistik?.puan ?? 0);
  const rakipRank = rankBul((rakip as { puan?: number }).puan ?? 0);
  const oyuncuOnde = oyuncuSkor > rakipSkor;
  const rakipOnde = rakipSkor > oyuncuSkor;
  // berabere → ikisi de kırmızı
  const oyuncuSkorRenk = oyuncuOnde ? "text-emerald-500" : "text-destructive";
  const rakipSkorRenk = rakipOnde ? "text-emerald-500" : "text-destructive";
  const sureYuzde = (sure / SURE) * 100;
  const sonUcSaniye = sure <= 3 && sure > 0;
  const sureRenk = sure > 5 ? "bg-duello" : sure > 3 ? "bg-amber-500" : "bg-destructive";
  const sureMetinRenk = sure > 5 ? "text-duello" : sure > 3 ? "text-amber-500" : "text-destructive";
  const bekleniyor = secim !== null && !rakipCevapladi;
  const cevapDogru = secim !== null && secim !== ZAMAN_ASIMI && secim === soru.dogru;

  return (
    <div className="flex flex-col flex-1 min-h-0 animate-rise">
      {/* Skor barı — skor ortada büyük; rütbe kesilmez */}
      <div className="mb-3 glass-card rounded-xl px-2.5 py-2.5 ring-1 ring-border shrink-0">
        <div className="flex items-center gap-1.5">
          {/* Oyuncu */}
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-base ring-1 ring-border">
              {avatarEmoji(kullanici.avatar)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-bold leading-tight text-card-foreground">
                {kullanici.kullaniciAdi}
              </p>
              <p
                className="mt-0.5 text-[9px] font-semibold leading-tight"
                style={{ color: oyuncuRank.renk }}
              >
                <span className="mr-0.5">{oyuncuRank.ikon}</span>
                {oyuncuRank.ad}
              </p>
            </div>
          </div>

          {/* Skorlar + VS — her zaman tam görünür */}
          <div className="flex shrink-0 items-center gap-1.5 px-0.5">
            <span className={`min-w-[1.75rem] text-center text-2xl font-black tabular-nums leading-none ${oyuncuSkorRenk}`}>
              {oyuncuSkor}
            </span>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
              VS
            </span>
            <span className={`min-w-[1.75rem] text-center text-2xl font-black tabular-nums leading-none ${rakipSkorRenk}`}>
              {rakipSkor}
            </span>
          </div>

          {/* Rakip */}
          <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
            <div className="min-w-0 flex-1 text-right">
              <p className="truncate text-[11px] font-bold leading-tight text-card-foreground">{rakip.ad}</p>
              <p
                className="mt-0.5 text-[9px] font-semibold leading-tight"
                style={{ color: rakipRank.renk }}
              >
                {rakipRank.ad}
                <span className="ml-0.5">{rakipRank.ikon}</span>
              </p>
            </div>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-base ring-1 ring-border">
              {avatarEmoji(rakip.avatar)}
            </div>
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
      <div className="relative bg-card flex flex-col rounded-xl p-4 border border-border">
        {/* Terk Et butonu — sağ üst köşe */}
        <button
          onClick={forfeitYap}
          className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/20 active:scale-95 ring-1 ring-destructive/20"
          aria-label="Maçı terk et"
        >
          <LogOut className="h-3.5 w-3.5" /> Terk Et
        </button>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-duello">
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
            // Rakip de cevaplayınca doğru/yanlış + EP birlikte
            const gosterDogru = secim !== null && rakipCevapladi && dogruSecenek;
            const gosterYanlis = secildi && !dogruSecenek && rakipCevapladi;
            const epGoster =
              rakipCevapladi &&
              secim !== null &&
              secim !== ZAMAN_ASIMI &&
              dogruSecenek &&
              secim === soru.dogru &&
              gosterilenPuan !== null &&
              gosterilenPuan > 0;

            let stil = "bg-background border border-border text-card-foreground hover:border-duello/50 hover:bg-muted/40";
            if (gosterDogru) stil = "bg-emerald-500/10 border-emerald-500/50 text-emerald-500";
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
                <span className="text-pretty flex-1">{secenek}</span>
                {epGoster && (
                  <span className="shrink-0 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-500 ring-1 ring-emerald-500/30">
                    +{gosterilenPuan} EP
                  </span>
                )}
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
                {dogruSeri >= 2 && (
                  <span className="inline-flex items-center gap-0.5 text-orange-500">
                    <Flame className="h-3 w-3" /> {dogruSeri}
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
      </div>

      {/* Rövanş teklifi popup */}
      {rovanşPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm">
          <div className="animate-pop glass-card max-w-sm w-full rounded-xl p-7 text-center shadow-lg ring-1 ring-duello/20">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-xl bg-duello/15 text-duello ring-1 ring-duello/30">
              <Swords className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-xl font-bold tracking-tight text-card-foreground">
              Rövanş teklifi
            </h2>
            <p className="mt-2 text-sm text-pretty text-muted-foreground">
              <span className="font-semibold text-foreground">{rovanşPopup.rakipAd}</span>
              {" "}rövanş teklif etti. Aynı odada tekrar oynamak ister misin?
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRovanşPopup(null)}
                className="rounded-lg bg-muted/60 py-3.5 text-sm font-semibold text-foreground transition hover:bg-muted/40 active:scale-[0.98]"
              >
                Reddet
              </button>
              <button
                type="button"
                onClick={async () => {
                  const kid =
                    kullaniciRef.current?.cihazId || kullaniciRef.current?.kullaniciAdi;
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
                className="btn-press-duello rounded-lg bg-duello py-3.5 text-sm font-bold text-duello-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
              >
                Kabul et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forfeit onay modalı — oyuncu Terk Et'e bastığında */}
      {forfeitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm">
          <div className="animate-pop glass-card max-w-sm w-full rounded-xl p-7 text-center shadow-2xl ring-1 ring-destructive/20">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-xl bg-destructive/15 text-destructive animate-pop ring-1 ring-destructive/30">
              <LogOut className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-xl font-bold tracking-tight text-card-foreground">
              Maçtan kaçacak mısın?
            </h2>
            <p className="mt-2 text-sm text-pretty text-muted-foreground">
              Terk edersen maçı kaybedersin, rakibin hükmen galip sayılır. Gerçekten çıkmak istiyor musun?
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => setForfeitConfirm(false)}
                className="rounded-lg bg-muted/60 py-3.5 text-sm font-semibold text-foreground transition hover:bg-muted/40 active:scale-[0.98]"
              >
                Vazgeç
              </button>
              <button
                onClick={forfeitOnayla}
                className="rounded-lg bg-destructive py-3.5 text-sm font-bold text-white shadow-md transition hover:brightness-110 active:scale-[0.98]"
              >
                Evet, Terk Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forfeit popup — rakip oyundan çekildi */}
      {forfeitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm">
          <div className="animate-pop glass-card max-w-sm w-full rounded-xl p-8 text-center shadow-2xl ring-1 ring-emerald-500/20">
            <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-xl bg-emerald-500/15 text-emerald-500 animate-pop ring-1 ring-emerald-500/30">
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
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-duello py-3.5 text-sm font-bold text-duello-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
            >
              <Home className="h-4 w-4" /> Ana Sayfaya Dön
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
