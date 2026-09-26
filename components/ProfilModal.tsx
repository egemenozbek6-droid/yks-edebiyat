"use client";

import { useEffect, useState } from "react";
import { Lock, X, Check, Sparkles, User } from "lucide-react";
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
  const [aktifSekme, setAktifSekme] = useState<"standart" | "prestij">("standart");

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
  const isimKilitli = Boolean(kullanici.isimDegisti || kullanici.hasChangedUsername);

  const renderAvatarButton = (a: (typeof AVATARLAR)[number]) => {
    const kilitli = a.kategori === "prestij" ? avatarLigKilitli(a.minLig, mevcutEP) : false;
    const secili = seciliAvatar === a.id;
    return (
      <button
        key={a.id}
        onClick={() =>
          kilitli
            ? setKilitliPreview({ emoji: a.emoji, etiket: a.etiket, minEP: a.minEP, minLig: a.minLig })
            : avatarSec(a.id, false)
        }
        className={`group relative flex aspect-square items-center justify-center rounded-xl text-xl transition-all active:scale-95 ${
          secili
            ? "bg-duello/15 ring-2 ring-duello shadow-md scale-105"
            : kilitli
              ? "bg-muted/20 opacity-40 hover:opacity-60 cursor-pointer"
              : "bg-muted/40 hover:bg-muted hover:scale-100"
        }`}
        aria-label={a.etiket}
        title={kilitli ? `${a.etiket} — Lig ${a.minLig}` : a.etiket}
      >
        {kilitli ? (
          <>
            <span className="opacity-30 grayscale text-base">{a.emoji}</span>
            <div className="absolute inset-0 grid place-items-center">
              <Lock className="h-3.5 w-3.5 text-muted-foreground/80" />
            </div>
          </>
        ) : (
          <span>{a.emoji}</span>
        )}
        {secili && (
          <div className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-duello text-white">
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </div>
        )}
      </button>
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
        onClick={onKapat}
      >
        <div
          className="animate-pop glass-card flex max-h-[90vh] w-full max-w-sm flex-col rounded-2xl border border-border p-5 shadow-2xl no-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Üst Kapatma Çarpısı */}
          <div className="flex items-center justify-between pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Profil Özelleştirme
            </span>
            <button
              onClick={onKapat}
              className="grid h-7 w-7 place-items-center rounded-full bg-muted/60 text-muted-foreground transition hover:text-foreground active:scale-95"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Hero Vitrin */}
          <div className="my-3 flex flex-col items-center text-center">
            <div className="relative mb-2.5">
              <div
                className="grid h-20 w-20 place-items-center rounded-2xl bg-muted/40 text-4xl shadow-inner ring-2"
                style={{
                  boxShadow: `0 0 20px ${simdikiRank.renk}30`,
                  borderColor: simdikiRank.renk,
                }}
              >
                {avatarEmoji(seciliAvatar)}
              </div>
              <div
                className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border border-background text-xs font-bold text-white shadow"
                style={{ background: simdikiRank.renk }}
                title={simdikiRank.ad}
              >
                {simdikiRank.ikon}
              </div>
            </div>
            <h2 className="font-serif text-lg font-bold text-card-foreground">
              {kullanici.kullaniciAdi}
            </h2>
            <div className="mt-1 flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground ring-1 ring-border">
              <span style={{ color: simdikiRank.renk }}>{simdikiRank.ad}</span>
              <span className="text-border">·</span>
              <span className="text-amber-500 font-bold">{mevcutEP} EP</span>
            </div>
          </div>

          {/* Kullanıcı Adı Ayarı */}
          <div className="mb-4 rounded-xl bg-muted/30 p-2.5 ring-1 ring-border">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-semibold text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" /> Kullanıcı Adı
              </span>
              {isimKilitli ? (
                <span className="flex items-center gap-1 font-bold text-muted-foreground">
                  <Lock className="h-3 w-3" /> Kilitli
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-500">1 Hakkın Var</span>
              )}
            </div>

            {isimKilitli ? (
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                <span className="font-bold text-foreground">{kullanici.kullaniciAdi}</span>
                <span className="text-[10px]">Değiştirilemez</span>
              </div>
            ) : kullaniciAdiDegistirebilirMi() ? (
              <div>
                <div className="flex gap-1.5">
                  <input
                    value={isimInput}
                    onChange={(e) => {
                      setIsimInput(e.target.value);
                      setIsimHata("");
                      setIsimOk(false);
                    }}
                    placeholder={kullanici.kullaniciAdi}
                    maxLength={20}
                    className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium outline-none focus:border-duello/50"
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
                    className="shrink-0 rounded-lg bg-duello px-3 py-1.5 text-xs font-bold text-duello-foreground transition hover:brightness-110 disabled:opacity-40"
                  >
                    Değiştir
                  </button>
                </div>
                {isimKontrol && isimInput.trim() && (
                  <p className={`mt-1 text-[10px] font-medium ${isimKontrol.musait ? "text-emerald-500" : "text-destructive"}`}>
                    {isimKontrol.mesaj}
                  </p>
                )}
                {isimHata && <p className="mt-1 text-[10px] font-medium text-destructive">{isimHata}</p>}
                {isimOk && <p className="mt-1 text-[10px] font-medium text-emerald-500">İsim güncellendi!</p>}
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs">
                <span className="font-bold text-foreground">{kullanici.kullaniciAdi}</span>
                <span className="text-[10px] text-amber-500 font-semibold">100 EP'de açılır</span>
              </div>
            )}
          </div>

          {/* Sekmeli Avatar Seçimi */}
          <div className="flex flex-col flex-1 min-h-0">
            {/* Sekme Butonları */}
            <div className="mb-2 flex rounded-lg bg-muted/60 p-1 ring-1 ring-border">
              <button
                type="button"
                onClick={() => setAktifSekme("standart")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition ${
                  aktifSekme === "standart"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Standart</span>
                <span className="text-[10px] opacity-70">({standartlar.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setAktifSekme("prestij")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition ${
                  aktifSekme === "prestij"
                    ? "bg-amber-500/15 text-amber-500 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>Prestij</span>
                <span className="text-[10px] opacity-70">({prestijler.length})</span>
              </button>
            </div>

            {/* Avatar Izgarası (6 sütunlu, taşmasız) */}
            <div className="overflow-y-auto max-h-48 p-1 no-scrollbar">
              <div className="grid grid-cols-6 gap-2">
                {(aktifSekme === "standart" ? standartlar : prestijler).map(renderAvatarButton)}
              </div>
            </div>

            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              {aktifSekme === "standart"
                ? "İstediğin temel avatarı serbestçe seçebilirsin."
                : `Prestij avatarlar lig atladıkça açılır. (${simdikiRank.ad})`}
            </p>
          </div>

          {/* Tamamla Butonu */}
          <button
            onClick={onKapat}
            className="mt-4 w-full rounded-xl bg-duello py-2.5 text-xs font-bold text-duello-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
          >
            Tamam
          </button>
        </div>
      </div>

      {/* Kilitli Avatar Önizleme Modalı */}
      {kilitliPreview && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
          onClick={() => setKilitliPreview(null)}
        >
          <div
            className="animate-pop glass-card w-full max-w-xs rounded-2xl p-5 text-center shadow-2xl ring-1 ring-amber-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setKilitliPreview(null)}
              className="absolute right-4 top-4 text-muted-foreground transition hover:text-foreground"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="relative mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-muted/40 text-4xl ring-1 ring-amber-500/20">
              <span className="opacity-40 grayscale">{kilitliPreview.emoji}</span>
              <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-amber-500 text-white shadow">
                <Lock className="h-3 w-3" />
              </span>
            </div>
            <h3 className="font-serif text-sm font-bold text-card-foreground">
              {kilitliPreview.etiket}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-bold text-amber-500">
                {RANK_KADEMELERI[kilitliPreview.minLig - 1]?.ad ?? "Efsane"}
              </span>{" "}
              ligine ulaşınca açılır ({kilitliPreview.minEP}+ EP)
            </p>
            {mevcutEP < kilitliPreview.minEP && (
              <div className="mt-2.5 rounded-lg bg-amber-500/10 py-1.5 text-[11px] font-semibold text-amber-500">
                {kilitliPreview.minEP - mevcutEP} EP daha kazanmalısın
              </div>
            )}
            <button
              onClick={() => setKilitliPreview(null)}
              className="mt-3.5 w-full rounded-lg bg-muted/60 py-2 text-xs font-semibold text-foreground ring-1 ring-border transition hover:bg-muted"
            >
              Anladım
            </button>
          </div>
        </div>
      )}
    </>
  );
}
