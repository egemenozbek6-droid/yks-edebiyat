"use client";

import { Layers } from "lucide-react";

/**
 * Açılış ekranı — uygulama temasına uyumlu (teal, sade, premium dark)
 * Süre: ~1.2s (page.tsx timeout ile senkron tut)
 */
export default function SplashEkran() {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center animate-splash-fadeout"
      style={{ background: "#0B0F17" }}
    >
      {/* Logo kutusu */}
      <div className="relative mb-7">
        <div
          className="absolute -inset-4 rounded-[2rem] opacity-60 blur-2xl"
          style={{
            background:
              "radial-gradient(circle, rgba(20,184,166,0.28) 0%, transparent 70%)",
          }}
        />
        <div
          className="relative grid h-[4.5rem] w-[4.5rem] place-items-center rounded-2xl border border-teal-500/30 bg-teal-500/10 shadow-[0_0_24px_rgba(20,184,166,0.15)]"
        >
          <Layers className="h-8 w-8 text-teal-400" strokeWidth={1.6} />
        </div>
      </div>

      {/* Marka */}
      <h1 className="text-[1.65rem] font-bold tracking-tight text-white">
        Edebi<span className="text-teal-400">Kart</span>
      </h1>

      {/* Üç sekme ipucu */}
      <p className="mt-2.5 flex items-center gap-2 text-[11px] font-medium tracking-wide text-white/45">
        <span className="text-teal-400/90">Yazar</span>
        <span className="text-white/25">·</span>
        <span className="text-violet-400/90">Eser</span>
        <span className="text-white/25">·</span>
        <span className="text-red-400/80">Düello</span>
      </p>

      {/* İnce yükleme çizgisi */}
      <div className="absolute bottom-14 left-1/2 h-[2px] w-28 -translate-x-1/2 overflow-hidden rounded-full bg-white/10">
        <div className="splash-bar h-full rounded-full bg-teal-500/80" />
      </div>

      <style>{`
        @keyframes splash-bar {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes splash-fadeout {
          0%, 72% { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }
        .splash-bar {
          width: 0%;
          animation: splash-bar 1.15s ease-out forwards;
        }
        .animate-splash-fadeout {
          animation: splash-fadeout 1.2s ease-in forwards;
        }
      `}</style>
    </div>
  );
}
