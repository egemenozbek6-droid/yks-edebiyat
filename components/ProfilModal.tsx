"use client";

import { useEffect, useState } from "react";
import { Check, Lock, X } from "lucide-react";
import {
  mevcutKullanici,
  mevcutIstatistik,
  kullaniciKaydet,
} from "@/lib/user";
import { AVATARLAR, avatarEmoji, avatarKilitli } from "@/lib/avatars";
import type { Kullanici } from "@/lib/types";

type Props = {
  onKapat: () => void;
  onGuncellendi: () => void;
};

export default function ProfilModal({ onKapat, onGuncellendi }: Props) {
  const [kullanici, setKullanici] = useState<Kullanici | null>(null);
  const [seciliAvatar, setSeciliAvatar] = useState<string>("");
  const [mevcutEP, setMevcutEP] = useState(0);

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

  return (
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

        {/* Kullanıcı adı — kalıcı, kilitli */}
        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            İsminiz
          </label>
          <div className="flex items-center gap-2 rounded-2xl bg-muted/60 px-4 py-3 ring-1 ring-primary/20">
            <Lock className="h-4 w-4 shrink-0 text-primary" />
            <span className="flex-1 truncate text-sm font-bold text-foreground">
              İsminiz Sabit: {kullanici.kullaniciAdi}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              <Lock className="h-2.5 w-2.5" /> Sabit
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            İsminiz sabittir ve daha sonra değiştirilemez.
          </p>
        </div>

        {/* Avatar seçimi */}
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-xs font-semibold text-muted-foreground">
              Avatar Seç
            </label>
            <span className="text-[10px] text-muted-foreground">{mevcutEP} EP</span>
          </div>
          <div className="grid grid-cols-8 gap-1.5">
            {AVATARLAR.map((a) => {
              const kilitli = avatarKilitli(a.minEP, mevcutEP);
              const secili = seciliAvatar === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => avatarSec(a.id, kilitli)}
                  disabled={kilitli}
                  className={`relative grid aspect-square place-items-center rounded-xl text-lg transition ${
                    secili
                      ? "bg-primary/20 ring-2 ring-primary"
                      : kilitli
                        ? "bg-muted/40 opacity-50 cursor-not-allowed"
                        : "bg-muted hover:bg-muted/70"
                  }`}
                  aria-label={a.etiket}
                  title={kilitli ? `${a.etiket} — ${a.minEP} EP gerekli` : a.etiket}
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
            })}
          </div>
          {AVATARLAR.some((a) => avatarKilitli(a.minEP, mevcutEP)) && (
            <p className="mt-2 text-[10px] text-muted-foreground">
              🔒 simgeli avatarlar belirli EP seviyelerine ulaşınca açılır
            </p>
          )}
        </div>

        {/* Bilgi */}
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-muted/40 py-3 text-xs text-muted-foreground">
          <Check className="h-3.5 w-3.5 text-emerald-500" />
          Avatar değişiklikleri anında kaydedilir
        </div>
      </div>
    </div>
  );
}
