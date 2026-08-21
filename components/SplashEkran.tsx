"use client";

import { Layers } from "lucide-react";

export default function SplashEkran() {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center animate-splash-fadeout"
      style={{ background: "#0B0F17" }}
    >
      {/* Logo + glow */}
      <div className="relative mb-6 animate-splash-pulse">
        <div
          className="absolute inset-0 rounded-[2rem] blur-2xl"
          style={{ background: "radial-gradient(circle, rgba(234,88,12,0.35) 0%, transparent 70%)" }}
        />
        <Layers
          className="relative h-16 w-16 text-white"
          strokeWidth={1.5}
          style={{ filter: "drop-shadow(0 0 12px rgba(234,88,12,0.5))" }}
        />
      </div>

      {/* Yazı */}
      <h1 className="font-serif text-2xl font-bold tracking-tight text-white">
        Edebikart
      </h1>
      <p className="mt-1 text-xs font-medium tracking-wide text-white/50">
        YKS Edebiyat & Düello
      </p>

      {/* Progress bar */}
      <div className="absolute bottom-12 left-1/2 h-1 w-48 -translate-x-1/2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(to right, rgba(234,88,12,0.4), rgb(234,88,12))",
            boxShadow: "0 0 10px rgba(234,88,12,0.6)",
            animation: "splash-progress 1.5s ease-out forwards",
          }}
        />
      </div>

      <style>{`
        @keyframes splash-progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes splash-pulse {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(234,88,12,0.3)); }
          50% { filter: drop-shadow(0 0 20px rgba(234,88,12,0.6)); }
        }
        @keyframes splash-fadeout {
          0%, 70% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-splash-pulse {
          animation: splash-pulse 1.5s ease-in-out infinite;
        }
        .animate-splash-fadeout {
          animation: splash-fadeout 1.5s ease-in forwards;
        }
      `}</style>
    </div>
  );
}
