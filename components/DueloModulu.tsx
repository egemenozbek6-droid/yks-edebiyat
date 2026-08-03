"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Clock,
  Flame,
  Home,
  KeyRound,
  Lock,
  RotateCcw,
  Search,
  Swords,
  Trophy,
  UserCircle,
  X,
  Zap,
} from "lucide-react";
import { sorulariUret, type Soru } from "@/lib/soru";
import { gecerliYazarlar } from "@/src/data";
import {
  mevcutKullanici,
  mevcutIstatistik,
  istatistikGuncelle,
  kazanilanPuan,
  kullaniciKaydet,
  kullaniciAdiKontrol,
} from "@/lib/user";
import { rastgeleBot, botGecikme, botDogruMu, botBonus } from "@/lib/bots";
import { avatarEmoji, rastgeleAvatarId, AVATARLAR } from "@/lib/avatars";
import type { Istatistik, Kullanici, MacSonucu, Rakip } from "@/lib/types";

type Adim = "nick" | "lobi" | "aratma" | "oda" | "duelo" | "sonuc";
type DueloModu = "ranked" | "friendly";

const SORU_SAYISI = 10;
const SURE = 10;
const ZAMAN_ASIMI = "__zaman_asimi__";
const BEKLEME_SURESI = 1500; // her iki taraf cevapladıktan sonra bekleme
const ARAMA_SURESI_MIN = 3000;
const ARAMA_SURESI_MAX = 5000;

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
  const [friendlySoruSayisi, setFriendlySoruSayisi] = useState(5);

  const [dueloModu, setDueloModu] = useState<DueloModu>("ranked");
  const [rakip, setRakip] = useState<Rakip | null>(null);

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

  const aramaTimer = useRef<number | null>(null);
  const odaTimer = useRef<number | null>(null);
  const rakipTimer = useRef<number | null>(null);
  const gecisTimer = useRef<number | null>(null);
  const sureTimer = useRef<number | null>(null);
  const botCevapZaman = useRef<number>(0);

  // --- Başlangıçta kullanıcı yükle ---
  useEffect(() => {
    const k = mevcutKullanici();
    if (k) {
      setKullanici(k);
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

  // --- Timer temizleme ---
  useEffect(() => {
    return () => {
      if (aramaTimer.current) clearTimeout(aramaTimer.current);
      if (odaTimer.current) clearTimeout(odaTimer.current);
      if (rakipTimer.current) clearTimeout(rakipTimer.current);
      if (gecisTimer.current) clearTimeout(gecisTimer.current);
      if (sureTimer.current) clearTimeout(sureTimer.current);
    };
  }, []);

  // --- Nick kaydetme ---
  const nickKaydet = useCallback(() => {
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
    kullaniciKaydet(yeniKullanici);
    setKullanici(yeniKullanici);
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

  // --- Duelo başlat ---
  const dueloBaslat = useCallback(
    (mod: DueloModu, rakipBilgi: Rakip, soruSayisi: number) => {
      const havuz = gecerliYazarlar();
      setSorular(sorulariUret(havuz).slice(0, soruSayisi));
      setSoruIndex(0);
      setSure(SURE);
      setSecim(null);
      setRakipCevapladi(false);
      setOyuncuSkor(0);
      setRakipSkor(0);
      setRakip(rakipBilgi);
      setDueloModu(mod);
      setAktifSoruSayisi(soruSayisi);
      setSonuc(null);
      setHukmenGalibiyet(false);
      setAdim("duelo");
    },
    [],
  );

  // --- Rastgele rakip bul (ranked) ---
  const rastgeleRakip = useCallback(() => {
    setDueloModu("ranked");
    setAdim("aratma");
    const gecikme = ARAMA_SURESI_MIN + Math.random() * (ARAMA_SURESI_MAX - ARAMA_SURESI_MIN);
    aramaTimer.current = window.setTimeout(() => {
      const bot = rastgeleBot();
      dueloBaslat("ranked", bot, SORU_SAYISI);
    }, gecikme);
  }, [dueloBaslat]);

  const aramaIptal = useCallback(() => {
    if (aramaTimer.current) {
      clearTimeout(aramaTimer.current);
      aramaTimer.current = null;
    }
    setAdim("lobi");
  }, []);

  // --- Özel oda kur ---
  const odaKur = useCallback(() => {
    const kod = Math.floor(1000 + Math.random() * 9000).toString();
    setOlusturulanKod(kod);
    // Bot rakip otomatik eşleşir (friendly)
    odaTimer.current = window.setTimeout(() => {
      const bot = rastgeleBot();
      dueloBaslat("friendly", bot, friendlySoruSayisi);
    }, 3000);
  }, [dueloBaslat, friendlySoruSayisi]);

  const odaIptal = useCallback(() => {
    if (odaTimer.current) {
      clearTimeout(odaTimer.current);
      odaTimer.current = null;
    }
    setOlusturulanKod("");
  }, []);

  // --- Odaya katıl ---
  const odayaKatil = useCallback(() => {
    if (odaInput.trim().length !== 4) return;
    const bot = rastgeleBot();
    dueloBaslat("friendly", bot, friendlySoruSayisi);
  }, [odaInput, dueloBaslat, friendlySoruSayisi]);

  // --- Cevapla (oyuncu) ---
  const cevapla = useCallback(
    (secenek: string) => {
      if (secim !== null) return;
      setSecim(secenek);
      const soru = sorular[soruIndex];
      if (secenek === soru.dogru) {
        const bonus = Math.round((sure / SURE) * 50);
        setOyuncuSkor((s) => s + 100 + bonus);
      }
    },
    [secim, sorular, soruIndex, sure],
  );

  // --- Süre sayacı ---
  useEffect(() => {
    if (adim !== "duelo" || secim !== null) return;
    if (sure <= 0) {
      setSecim(ZAMAN_ASIMI);
      return;
    }
    sureTimer.current = window.setTimeout(() => setSure((s) => s - 1), 1000);
    return () => {
      if (sureTimer.current) clearTimeout(sureTimer.current);
    };
  }, [sure, secim, adim]);

  // --- Bot cevap simülasyonu (senkron) ---
  useEffect(() => {
    if (adim !== "duelo" || rakipCevapladi) return;
    const gecikme = botGecikme();
    botCevapZaman.current = gecikme / 1000;
    rakipTimer.current = window.setTimeout(() => {
      setRakipCevapladi(true);
      if (botDogruMu(0.7)) {
        const kalanSure = Math.max(0, SURE - botCevapZaman.current);
        const bonus = Math.round((kalanSure / SURE) * 50) + botBonus();
        setRakipSkor((s) => s + 100 + bonus);
      }
    }, gecikme);
    return () => {
      if (rakipTimer.current) clearTimeout(rakipTimer.current);
    };
  }, [soruIndex, adim, rakipCevapladi]);

  // --- Senkron geçiş: her iki taraf da cevapladıysa veya süre dolduysa ---
  const herIkiTarafHazir = secim !== null && rakipCevapladi;

  useEffect(() => {
    if (!herIkiTarafHazir || adim !== "duelo") return;
    gecisTimer.current = window.setTimeout(() => {
      if (soruIndex + 1 >= aktifSoruSayisi) {
        // Maç bitti
        const kazandi = oyuncuSkor > rakipSkor;
        const berabere = oyuncuSkor === rakipSkor;
        const hukmen = false;
        const puanKazandi = kazanilanPuan(oyuncuSkor, rakipSkor, hukmen);
        const sonucObj: MacSonucu = {
          kazandi,
          berabere,
          hukmenGalibiyet: hukmen,
          oyuncuSkor,
          rakipSkor,
          rakipAdi: rakip?.ad ?? "",
          puanKazandi: dueloModu === "ranked" ? puanKazandi : 0,
          seri: 0,
          ranked: dueloModu === "ranked",
        };
        const guncelIstatistik = istatistikGuncelle(sonucObj);
        sonucObj.seri = guncelIstatistik.seri;
        setIstatistik(guncelIstatistik);
        setSonuc(sonucObj);
        setAdim("sonuc");
      } else {
        setSoruIndex((i) => i + 1);
        setSecim(null);
        setRakipCevapladi(false);
        setSure(SURE);
      }
    }, BEKLEME_SURESI);
    return () => {
      if (gecisTimer.current) clearTimeout(gecisTimer.current);
    };
  }, [herIkiTarafHazir, adim, soruIndex, aktifSoruSayisi, oyuncuSkor, rakipSkor, rakip, dueloModu]);

  // --- Hükmen galibiyet (rakip ayrıldı simülasyonu - bot modunda aktif değil) ---
  const rakipAyrildi = useCallback(() => {
    if (adim !== "duelo") return;
    if (rakipTimer.current) clearTimeout(rakipTimer.current);
    if (sureTimer.current) clearTimeout(sureTimer.current);
    if (gecisTimer.current) clearTimeout(gecisTimer.current);

    const hukmen = true;
    const puanKazandi = kazanilanPuan(oyuncuSkor, rakipSkor, hukmen);
    const sonucObj: MacSonucu = {
      kazandi: true,
      berabere: false,
      hukmenGalibiyet: hukmen,
      oyuncuSkor,
      rakipSkor,
      rakipAdi: rakip?.ad ?? "",
      puanKazandi: dueloModu === "ranked" ? puanKazandi : 0,
      seri: 0,
      ranked: dueloModu === "ranked",
    };
    const guncelIstatistik = istatistikGuncelle(sonucObj);
    sonucObj.seri = guncelIstatistik.seri;
    setIstatistik(guncelIstatistik);
    setSonuc(sonucObj);
    setHukmenGalibiyet(true);
    setAdim("sonuc");
  }, [adim, oyuncuSkor, rakipSkor, rakip, dueloModu]);

  // --- Çıkış (navigation guard ile) ---
  const cikisIste = useCallback(() => {
    if (adim === "duelo") {
      onCikisOnayGerekir(
        "Düellodan ayrılırsanız maçı kaybetmiş sayılacaksınız!",
        () => {
          // Forfeit: oyuncu ayrılıyor, hükmen mağlubiyet
          if (rakipTimer.current) clearTimeout(rakipTimer.current);
          if (sureTimer.current) clearTimeout(sureTimer.current);
          if (gecisTimer.current) clearTimeout(gecisTimer.current);
          if (dueloModu === "ranked") {
            const sonucObj: MacSonucu = {
              kazandi: false,
              berabere: false,
              hukmenGalibiyet: false,
              oyuncuSkor,
              rakipSkor,
              rakipAdi: rakip?.ad ?? "",
              puanKazandi: 0,
              seri: 0,
              ranked: true,
            };
            const guncel = istatistikGuncelle(sonucObj);
            setIstatistik(guncel);
          }
          onCikis();
        },
      );
    } else {
      onCikis();
    }
  }, [adim, onCikis, onCikisOnayGerekir, dueloModu, oyuncuSkor, rakipSkor, rakip]);

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
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-rise w-full max-w-sm">
          {/* Profil kartı */}
          <button
            onClick={onProfilAc}
            className="mb-5 flex w-full items-center gap-3 rounded-[1.75rem] bg-card p-4 text-left shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] transition hover:shadow-md active:scale-[0.99]"
          >
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-2xl">
              {avatarEmoji(kullanici.avatar)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-base font-bold text-card-foreground">
                {kullanici.kullaniciAdi}
              </p>
              {istatistik && (
                <p className="text-xs text-muted-foreground">
                  {istatistik.puan} puan · {istatistik.galibiyet}G/{istatistik.maglubiyet}M
                  {istatistik.seri >= 2 && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 font-semibold text-orange-500">
                      <Flame className="h-3 w-3" /> {istatistik.seri} seri
                    </span>
                  )}
                </p>
              )}
            </div>
            <UserCircle className="h-5 w-5 shrink-0 text-muted-foreground" />
          </button>

          <button
            onClick={rastgeleRakip}
            className="flex w-full items-center gap-4 rounded-2xl bg-card p-5 text-left shadow-sm transition hover:shadow-md active:scale-[0.99] mb-3"
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary shrink-0">
              <Search className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-bold text-card-foreground">Normal Rakip Bul</p>
              <p className="text-xs text-muted-foreground">10 soru · Derece puanı kazan</p>
            </div>
          </button>

          <button
            onClick={() => setAdim("oda")}
            className="flex w-full items-center gap-4 rounded-2xl bg-card p-5 text-left shadow-sm transition hover:shadow-md active:scale-[0.99]"
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary shrink-0">
              <KeyRound className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-bold text-card-foreground">Özel Oda Kur / Katıl</p>
              <p className="text-xs text-muted-foreground">Arkadaşınla dostluk maçı</p>
            </div>
          </button>

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
          <p className="mt-2 text-sm text-muted-foreground">
            Eşleşme sağlanana kadar lütfen bekle. Uygun rakip bulunamazsa bot atanır.
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

  // --- ODA ---
  if (adim === "oda") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-rise rounded-[1.75rem] bg-card p-7 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] max-w-sm w-full">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <KeyRound className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-lg font-bold text-center text-card-foreground">Özel Oda</h2>

          {olusturulanKod ? (
            <div className="mt-5 text-center">
              <p className="text-xs text-muted-foreground mb-2">Oda kodun</p>
              <div className="rounded-2xl bg-muted py-4 text-3xl font-bold tracking-[0.4em] text-foreground">
                {olusturulanKod}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Rakip bekleniyor...</p>
              <div className="mt-4 flex justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span>Soru sayısı: {friendlySoruSayisi}</span>
              </div>
              <button
                onClick={odaIptal}
                className="mt-5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
              >
                Geri Dön
              </button>
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm text-center text-pretty text-muted-foreground">
                Bir oda kur ve 4 haneli kodunu arkadaşınla paylaş, ya da elindeki koda katıl.
              </p>

              {/* Soru sayısı seçimi */}
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
                onChange={(e) => setOdaInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                onKeyDown={(e) => e.key === "Enter" && odayaKatil()}
                placeholder="4 haneli kod..."
                maxLength={4}
                className="mt-4 w-full rounded-2xl bg-muted px-4 py-3 text-sm font-bold tracking-widest text-center text-foreground placeholder:text-muted-foreground/60 placeholder:tracking-normal placeholder:font-normal outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
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
            </>
          )}
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
            {sonuc.hukmenGalibiyet
              ? "Hükmen Galibiyet!"
              : kazandi
                ? "Kazandın!"
                : berabere
                  ? "Berabere!"
                  : "Kaybettin!"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {sonuc.hukmenGalibiyet
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
      {/* Skor barı — avatarlı */}
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
          <div className="px-2 text-xs font-bold text-muted-foreground">VS</div>
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
