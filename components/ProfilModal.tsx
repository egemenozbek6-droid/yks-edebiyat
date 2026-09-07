"use client";

import { useEffect, useState } from "react";
import { Lock, X } from "lucide-react";
import {
  mevcutKullanici,
  mevcutIstatistik,
  kullaniciKaydet,
  kullaniciAdiDegistirebilirMi,
  kullaniciAdiGuncelle,
  kullaniciAdiKontrol,
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
  const [isimInput, setIsimInput] = useState("");
  const [isimHata, setIsimHata] = useState("");
  const [isimOk, setIsimOk] = useState(false);
  const [isimKontrol, setIsimKontrol] = useState<{ musait: boolean; mesaj: string } | null>(null);

  useEffect(() => {
    const k = mevcutKullanici();
    if (k) {
      setKullanici(k);
      setSeciliAvatar(k.avatar);
      setMevcutEP(mevcutIstatistik().puan);
    }
  }, []);

  useEffect(() => {
    if (!isimInput.trim()) {
      setIsimKontrol(null);
      return;
    }
    const t = setTimeout(() => setIsimKontrol(kullaniciAdiKontrol(isimInput)), 250);
    return () => clearTimeout(t);
  }, [isimInput]);

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
            ? "bg-duello/20 ring-2 ring-duello"
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm"
        onClick={onKapat}
      >
        <div
          className="animate-pop glass-card max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl p-6 shadow-lg no-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-lg bg-duello/15 text-2xl ring-1 ring-duello/30">
                {avatarEmoji(seciliAvatar)}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Profil
                </p>
                <h2 className="font-serif text-lg font-bold tracking-tight text-card-foreground">
                  {kullanici.kullaniciAdi}
                </h2>
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

          {/* Kullanıcı adı — Eser Çırağı ile 1 kez değişebilir */}
          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Kullanıcı adı
            </label>
           {(kullanici.isimDegisti || kullanici.hasChangedUsername) ? (
              <>
                <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-4 py-3 border border-border">
                  <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-sm font-bold text-foreground">
                    {kullanici.kullaniciAdi}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Kilitli
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Tek seferlik isim hakkınızı kullandınız. Artık değiştirilemez.
                </p>
              </>
            ) : kullaniciAdiDegistirebilirMi() ? (
              <>
                <div className="mb-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] leading-relaxed text-emerald-600 dark:text-emerald-400">
                  <span className="font-bold">Eser Çırağı ödülü:</span> Bir kez isim değiştirebilirsin. İsmini seç.
                </div>
                <div className="flex gap-2">
                  <input
                    value={isimInput}
                    onChange={(e) => {
                      setIsimInput(e.target.value);
                      setIsimHata("");
                      setIsimOk(false);
                    }}
                    placeholder={kullanici.kullaniciAdi}
                    maxLength={20}
                    className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium outline-none focus:border-duello/50"
                  />
                  <button
                    type="button"
                    disabled={!isimInput.trim() || (isimKontrol !== null && !isimKontrol.musait)}
                    onClick={() => {
                      const sonuc = kullaniciAdiGuncelle(isimInput);
                      if (!sonuc.tamam) {
                        setIsimHata(sonuc.hata ?? "Değiştirilemedi");
                        setIsimOk(false);
                        return;
                      }
                      setIsimHata("");
                      setIsimOk(true);
                      setIsimInput("");
                      const k = mevcutKullanici();
                      if (k) setKullanici(k);
                      onGuncellendi();
                    }}
                    className="shrink-0 rounded-lg bg-duello px-3 py-2.5 text-xs font-bold text-duello-foreground disabled:opacity-40"
                  >
                    Kaydet
                  </button>
                </div>
                {isimKontrol && isimInput.trim() && (
                  <p className={`mt-1.5 text-[11px] font-medium ${isimKontrol.musait ? "text-emerald-500" : "text-destructive"}`}>
                    {isimKontrol.mesaj}
                  </p>
                )}
                {isimHata && <p className="mt-1.5 text-[11px] font-medium text-destructive">{isimHata}</p>}
                {isimOk && <p className="mt-1.5 text-[11px] font-medium text-emerald-500">İsim güncellendi. Bu haktı yalnızca bir kez kullanabilirsiniz.</p>}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-4 py-3 border border-border">
                  <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-sm font-bold text-foreground">
                    {kullanici.kullaniciAdi}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Kilitli
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground">Eser Çırağı</span> rütbesine ulaşınca (100 EP) bir kez isim değiştirme hakkı kazanırsın.
                  {mevcutEP < 100 && (
                    <span className="text-amber-500"> · {100 - mevcutEP} EP kaldı</span>
                  )}
                </p>
              </>
            )}
          </div>

          {/* Avatar seçimi — kategorili */}
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-xs font-semibold text-muted-foreground">
                Avatar Seç
              </label>
              <span className="text-[10px] font-bold text-amber-500">{mevcutEP} EP</span>
            </div>

            {/* Standart Avatarlar */}
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Standart Avatarlar
            </p>
            <div className="grid grid-cols-8 gap-1.5 mb-4">
              {standartlar.map(renderAvatarButton)}
            </div>

            {/* Prestij Avatarları */}
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-500">
              Prestij Avatarları
            </p>
            <div className="grid grid-cols-8 gap-1.5">
              {prestijler.map(renderAvatarButton)}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              🔒 Prestij avatarlar lig atladıkça açılır. Mevcut lig: <span className="font-bold text-amber-500">{simdikiRank.ad}</span>
            </p>
          </div>

        </div>
      </div>

      {/* Kilitli avatar önizleme modalı */}
      {kilitliPreview && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
          onClick={() => setKilitliPreview(null)}
        >
          <div
            className="animate-pop glass-card w-full max-w-xs rounded-xl p-6 text-center shadow-lg ring-1 ring-amber-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setKilitliPreview(null)}
              className="absolute right-4 top-4 text-muted-foreground transition hover:text-foreground"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="relative mx-auto mb-4 grid h-20 w-20 place-items-center rounded-xl bg-muted/40 text-4xl ring-1 ring-amber-500/20">
              <span className="opacity-40 grayscale">{kilitliPreview.emoji}</span>
              <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30">
                <Lock className="h-4 w-4" />
              </span>
            </div>
            <h3 className="font-serif text-base font-bold text-card-foreground">
              {kilitliPreview.etiket}
            </h3>
            <p className="mt-2 text-sm text-pretty text-muted-foreground">
              <span className="font-bold text-amber-500">{RANK_KADEMELERI[kilitliPreview.minLig - 1]?.ad ?? "Efsane"}</span> ligine ulaşınca açılır
              <span className="text-muted-foreground"> ({kilitliPreview.minEP}+ EP)</span>
            </p>
            {mevcutEP < kilitliPreview.minEP && (
              <div className="mt-3 rounded-xl bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-500 ring-1 ring-amber-500/20">
                {kilitliPreview.minEP - mevcutEP} EP daha
              </div>
            )}
            <button
              onClick={() => setKilitliPreview(null)}
              className="mt-4 w-full rounded-lg bg-muted/60 py-3 text-sm font-semibold text-foreground transition hover:bg-muted active:scale-[0.98] ring-1 ring-border"
            >
              Anladım
            </button>
          </div>
        </div>
      )}
    </>
  );
}
