"use client";

import { useEffect, useState } from "react";
import { Check, Flame, Lock, Trophy, X, Zap } from "lucide-react";
import {
  mevcutKullanici,
  mevcutIstatistik,
  kullaniciKaydet,
} from "@/lib/user";
import { AVATARLAR, avatarEmoji } from "@/lib/avatars";
import type { Istatistik, Kullanici } from "@/lib/types";

type Props = {
  onKapat: () => void;
  onGuncellendi: () => void;
};

export default function ProfilModal({ onKapat, onGuncellendi }: Props) {
  const [kullanici, setKullanici] = useState<Kullanici | null>(null);
  const [istatistik, setIstatistik] = useState<Istatistik | null>(null);
  const [seciliAvatar, setSeciliAvatar] = useState<string>("");
  const [kaydedildi, setKaydedildi] = useState(false);

  useEffect(() => {
    const k = mevcutKullanici();
    if (k) {
      setKullanici(k);
      setSeciliAvatar(k.avatar);
    }
    setIstatistik(mevcutIstatistik());
  }, []);

  const avatarSec = (avatarId: string) => {
    setSeciliAvatar(avatarId);
    if (!kullanici) return;
    const guncel = { ...kullanici, avatar: avatarId };
    kullaniciKaydet(guncel);
    setKullanici(guncel);
    onGuncellendi();
  };

  if (!kullanici || !istatistik) return null;

  const galibiyetOrani =
    istatistik.macSayisi > 0
      ? Math.round((istatistik.galibiyet / istatistik.macSayisi) * 100)
      : 0;

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
            Rumuz
          </label>
          <div className="flex items-center gap-2 rounded-2xl bg-muted/60 px-4 py-3 ring-1 ring-primary/20">
            <Lock className="h-4 w-4 shrink-0 text-primary" />
            <span className="flex-1 truncate text-sm font-bold text-foreground">
              {kullanici.kullaniciAdi}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              <Lock className="h-2.5 w-2.5" /> Rumuz Sabit
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Rumuzunuz kalıcıdır ve daha sonra değiştirilemez.
          </p>
        </div>

        {/* Avatar seçimi */}
        <div className="mb-5">
          <label className="mb-2 block text-xs font-semibold text-muted-foreground">
            Avatar
          </label>
          <div className="grid grid-cols-8 gap-1.5">
            {AVATARLAR.map((a) => (
              <button
                key={a.id}
                onClick={() => avatarSec(a.id)}
                className={`grid aspect-square place-items-center rounded-xl text-lg transition ${
                  seciliAvatar === a.id
                    ? "bg-primary/20 ring-2 ring-primary"
                    : "bg-muted hover:bg-muted/70"
                }`}
                aria-label={a.etiket}
              >
                {a.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* İstatistikler — E-sports mini kartlar */}
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Derece İstatistikleri
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="glass-card rounded-2xl p-3.5 ring-1 ring-primary/15">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Zap className="h-3 w-3 text-primary" /> Puan
              </div>
              <p className="mt-1 text-xl font-bold text-primary">{istatistik.puan}</p>
            </div>
            <div className="glass-card rounded-2xl p-3.5 ring-1 ring-border">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Trophy className="h-3 w-3" /> Maç
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">{istatistik.macSayisi}</p>
            </div>
            <div className="glass-card rounded-2xl p-3.5 ring-1 ring-emerald-500/20">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Galibiyet
              </div>
              <p className="mt-1 text-xl font-bold text-emerald-500">
                {istatistik.galibiyet}
              </p>
            </div>
            <div className="glass-card rounded-2xl p-3.5 ring-1 ring-destructive/20">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Mağlubiyet
              </div>
              <p className="mt-1 text-xl font-bold text-destructive">{istatistik.maglubiyet}</p>
            </div>
          </div>

          {/* Kazanma oranı */}
          <div className="mt-2.5 glass-card rounded-2xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Kazanma Oranı</span>
              <span className="text-sm font-bold text-primary">%{galibiyetOrani}</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${galibiyetOrani}%` }}
              />
            </div>
          </div>

          {/* Galibiyet serisi */}
          {istatistik.seri >= 2 && (
            <div className="mt-2.5 flex items-center justify-center gap-2 rounded-2xl bg-orange-500/10 py-3 text-sm font-bold text-orange-500 animate-pop ring-1 ring-orange-500/20">
              <Flame className="h-4 w-4" /> {istatistik.seri} Galibiyet Serisi
            </div>
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
