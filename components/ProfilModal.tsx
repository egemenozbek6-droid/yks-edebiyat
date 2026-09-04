"use client";

import { useEffect, useState } from "react";
import { Check, Lock, X } from "lucide-react";
import {
  mevcutKullanici,
  mevcutIstatistik,
  kullaniciKaydet,
  kullaniciAdiDegistirebilirMi,
  kullaniciAdiGuncelle,
} from "@/lib/user";
import { AVATARLAR, avatarEmoji, avatarLigKilitli, RANK_KADEMELERI } from "@/lib/avatars";
import { rankBul } from "@/lib/types";
import type { Kullanici } from "@/lib/types";

type Props = {
  onKapat: () => void;
  onGuncellendi: () => void;
};

type KilitliAvatar = { emoji: string; etiket: string; minEP: number; minLig: number } | null;

export default function ProfilModal({ onKapat, onGuncellendi }: Props) {
  const [kullanici, setKullanici] = useState<Kullanici | null>(null);
  const [seciliAvatar, setSeciliAvatar] = useState<string>("");
  const [mevcutEP, setMevcutEP] = useState(0);
  const [kilitliPreview, setKilitliPreview] = useState<KilitliAvatar>(null);
  const [yeniAd, setYeniAd] = useState("");
  const [adMesaji, setAdMesaji] = useState("");
  const [adKaydediliyor, setAdKaydediliyor] = useState(false);

  useEffect(() => {
    const k = mevcutKullanici();
    if (k) {
      setKullanici(k);
      setSeciliAvatar(k.avatar);
      setMevcutEP(mevcutIstatistik().puan);
    }
  }, []);

  const avatarSec = (avatarId: string, kilitli: boolean) => {
    if (kilitli) return;
    setSeciliAvatar(avatarId);
    if (!kullanici) return;
    const guncel = { ...kullanici, avatar: avatarId };
    kullaniciKaydet(guncel);
    setKullanici(guncel);
    onGuncellendi();
  };

  if (!kullanici) return null;

  const standartlar = AVATARLAR.filter((a) => a.kategori === "standart");
  const prestijler = AVATARLAR.filter((a) => a.kategori === "prestij");

  const simdikiRank = rankBul(mevcutEP);

  const renderAvatarButton = (a: (typeof AVATARLAR)[number]) => {
    const kilitli = a.kategori === "prestij" ? avatarLigKilitli(a.minLig, mevcutEP) : false;
    const secili = seciliAvatar === a.id;
    return (
      <button
        key={a.id}
        onClick={() => (kilitli ? setKilitliPreview({ emoji: a.emoji, etiket: a.etiket, minEP: a.minEP, minLig: a.minLig }) : avatarSec(a.id, false))}
        className={`relative grid aspect-square place-items-center rounded-xl text-lg transition ${
          secili
            ? "bg-primary/20 ring-2 ring-primary"
            : kilitli
              ? "bg-muted/40 opacity-50 cursor-pointer hover:opacity-70"
              : "bg-muted hover:bg-muted/70"
        }`}
        aria-label={a.etiket}
        title={kilitli ? `${a.etiket} — Lig ${a.minLig}` : a.etiket}
      >
        {kilitli ? (
          <>
            <span className="opacity-30 grayscale">{a.emoji}</span>
            <span className="absolute inset-0 grid place-items-center">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
          </>
        ) : (
          a.emoji
        )}
      </button>
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-md"
        onClick={onKapat}
      >
        <div
          className="animate-pop glass-card max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[1.75rem] p-6 shadow-2xl no-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-2xl ring-1 ring-primary/30">
                {avatarEmoji(seciliAvatar)}
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold tracking-tight text-card-foreground">
                  Profil
                </h2>
                <p className="text-xs text-muted-foreground">{kullanici.kullaniciAdi}</p>
              </div>
            </div>
            <button
              onClick={onKapat}
              className="text-muted-foreground transition hover:text-primary"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Kullanıcı adı — 100 EP'de tek seferlik hak */}
          <div className="mb-5">
            <label htmlFor="yeni-ad" className="mb-2 block text-sm font-bold text-foreground">İsim (Düello Rumuzu)</label>
            {kullaniciAdiDegistirebilirMi() ? (
              <div className="flex gap-2">
                <input id="yeni-ad" value={yeniAd} onChange={(e) => setYeniAd(e.target.value)} placeholder={kullanici.kullaniciAdi} className="min-w-0 flex-1 rounded-xl bg-muted/60 px-4 py-3 text-sm font-bold text-foreground outline-none ring-1 ring-primary/25 focus:ring-primary" />
                <button disabled={adKaydediliyor} onClick={async () => { setAdKaydediliyor(true); const sonuc = await kullaniciAdiGuncelle(yeniAd); setAdMesaji(sonuc.tamam ? "Rumuz güncellendi" : sonuc.hata ?? "İsim değiştirilemedi"); if (sonuc.tamam) { const guncel = mevcutKullanici(); if (guncel) setKullanici(guncel); onGuncellendi(); } setAdKaydediliyor(false); }} className="rounded-xl border-b-4 border-sky-900 bg-sky-600 px-4 py-2 text-xs font-bold text-white transition-all active:translate-y-1 active:border-b-0">Kaydet</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-4 py-3 ring-1 ring-border"><Lock className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="flex-1 truncate text-sm font-bold text-foreground">{kullanici.kullaniciAdi}</span><span className="text-[10px] font-bold text-muted-foreground">{kullanici.hasChangedName ? "KULLANILDI" : "100 EP'DE AÇILIR"}</span></div>
            )}
            {adMesaji && <p className="mt-1.5 text-[11px] font-semibold text-foreground">{adMesaji}</p>}
          </div>

          {/* Avatar seçimi — kategorili */}
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-xs font-semibold text-muted-foreground">
                Avatar Seç
              </label>
              <span className="text-[10px] font-bold text-sky-400">{mevcutEP} EP</span>
            </div>

            {/* Standart Avatarlar */}
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Standart Avatarlar
            </p>
            <div className="grid grid-cols-8 gap-1.5 mb-4">
              {standartlar.map(renderAvatarButton)}
            </div>

            {/* Prestij Avatarları */}
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-400">
              Prestij Avatarları
            </p>
            <div className="grid grid-cols-8 gap-1.5">
              {prestijler.map(renderAvatarButton)}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              🔒 Prestij avatarlar lig atladıkça açılır. Mevcut lig: <span className="font-bold text-sky-400">{simdikiRank.ad}</span>
            </p>
          </div>

          {/* Bilgi */}
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-muted/40 py-3 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            Avatar değişiklikleri anında kaydedilir
          </div>
        </div>
      </div>

      {/* Kilitli avatar önizleme modalı */}
      {kilitliPreview && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-5 backdrop-blur-md"
          onClick={() => setKilitliPreview(null)}
        >
          <div
            className="animate-pop glass-card w-full max-w-xs rounded-[1.75rem] p-6 text-center shadow-2xl ring-1 ring-sky-400/20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setKilitliPreview(null)}
              className="absolute right-4 top-4 text-muted-foreground transition hover:text-foreground"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-muted/40 text-4xl ring-1 ring-sky-400/20">
              <span className="opacity-40 grayscale">{kilitliPreview.emoji}</span>
            </div>
            <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-sky-400/15 text-sky-400 ring-1 ring-sky-400/30">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-base font-bold text-card-foreground">
              {kilitliPreview.etiket}
            </h3>
            <p className="mt-2 text-sm text-pretty text-muted-foreground">
              Bu avatar <span className="font-bold text-sky-400">{RANK_KADEMELERI[kilitliPreview.minLig - 1]?.ad ?? "Efsane"}</span> ligine ulaşınca açılır!
            </p>
            <div className="mt-3 rounded-xl bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
              Gerekli lig: <span className="font-bold text-foreground">{RANK_KADEMELERI[kilitliPreview.minLig - 1]?.ad ?? "Edebiyat Efsanesi"}</span> ({kilitliPreview.minEP}+ EP)
            </div>
            <button
              onClick={() => setKilitliPreview(null)}
              className="mt-4 w-full rounded-2xl bg-muted/60 py-3 text-sm font-semibold text-foreground transition hover:bg-muted active:scale-[0.98] ring-1 ring-border"
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </>
  );
}
