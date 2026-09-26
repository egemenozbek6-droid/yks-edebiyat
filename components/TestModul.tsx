"use client";

import { useState } from "react";
import { BookOpen, Sparkles, Users, Compass, ChevronRight, Brain } from "lucide-react";
import { anaDonemler, type AnaDonem } from "@/src/data";
import DonemTestiModulu from "@/components/DonemTestiModulu";
import KadinYazarlarTestModulu from "@/components/KadinYazarlarTestModulu";
import EserKahramanTestModulu from "@/components/EserKahramanTestModulu";
import AkimTestModulu from "@/components/AkimTestModulu";

type AltMod = "menu" | "donem" | "kadin" | "kahraman" | "akim";

export default function TestModul() {
  const [altMod, setAltMod] = useState<AltMod>("menu");
  const [seciliDonem, setSeciliDonem] = useState<AnaDonem | null>(null);

  if (altMod === "donem" && seciliDonem) {
    return <DonemTestiModulu donem={seciliDonem} onDonustu={() => setAltMod("menu")} />;
  }
  if (altMod === "kadin") {
    return <KadinYazarlarTestModulu onDonustu={() => setAltMod("menu")} />;
  }
  if (altMod === "kahraman") {
    return <EserKahramanTestModulu onDonustu={() => setAltMod("menu")} />;
  }
  if (altMod === "akim") {
    return <AkimTestModulu onDonustu={() => setAltMod("menu")} />;
  }

  return (
    <div className="flex-1 flex flex-col gap-3 p-1 animate-rise max-w-xl mx-auto w-full">
      {/* Test Modu Ana Banner */}
      <div className="rounded-2xl bg-card border border-border p-5 text-center shadow-sm">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-violet-500/15 text-violet-500 ring-1 ring-violet-500/30">
          <Brain className="h-6 w-6" strokeWidth={1.8} />
        </div>
        <h2 className="font-serif text-xl font-bold text-card-foreground">Test Modu</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Dönemleri tara veya özel seçkilerle bilgilerini pekiştir. Sınav provasına başla.
        </p>
      </div>

      {/* Dönem Testleri */}
      <div className="glass-card rounded-2xl p-4 ring-1 ring-border/80">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-violet-500" />
            <p className="font-serif text-sm font-bold text-card-foreground">Dönem Testleri</p>
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground">15 Soru</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {anaDonemler.map((donem) => (
            <button
              key={donem}
              onClick={() => {
                setSeciliDonem(donem);
                setAltMod("donem");
              }}
              className="flex items-center justify-between rounded-xl bg-muted/40 p-3 text-xs font-semibold text-muted-foreground ring-1 ring-border/60 transition hover:bg-muted/70 hover:text-foreground active:scale-[0.98]"
            >
              <span className="truncate">{donem}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </button>
          ))}
        </div>
      </div>

      {/* Kadın Yazarlar */}
      <button
        onClick={() => setAltMod("kadin")}
        className="glass-card flex items-center justify-between rounded-2xl p-4 ring-1 ring-border/80 transition hover:border-pink-500/40 hover:bg-pink-500/5 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-pink-500/15 text-pink-500 ring-1 ring-pink-500/25">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <p className="font-serif text-sm font-bold text-card-foreground">Kadın Yazarlar & Eserleri</p>
              <span className="rounded-full bg-pink-500/15 px-1.5 py-0.5 text-[9px] font-bold text-pink-500">Özel</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Sadece kadın yazar ve eserleri! 🌸</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Eser - Kahraman & Edebi Akımlar */}
      <div className="grid grid-cols-1 gap-2.5">
        <button
          onClick={() => setAltMod("kahraman")}
          className="glass-card flex items-center justify-between rounded-2xl p-4 ring-1 ring-border/80 transition hover:border-amber-500/40 hover:bg-amber-500/5 active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/25">
              <Users className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <p className="font-serif text-sm font-bold text-card-foreground">Eser – Kahraman</p>
                <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-500">Karakter</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Eser ↔ karakter eşleştir, bankoları ezberle! 🎭</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        <button
          onClick={() => setAltMod("akim")}
          className="glass-card flex items-center justify-between rounded-2xl p-4 ring-1 ring-border/80 transition hover:border-sky-500/40 hover:bg-sky-500/5 active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/15 text-sky-500 ring-1 ring-sky-500/25">
              <Compass className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <p className="font-serif text-sm font-bold text-card-foreground">Batı Edebi Akımları</p>
                <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[9px] font-bold text-sky-500">Akım</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Akımları, temsilcileri ve özellikleriyle tanı! 🌐</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
