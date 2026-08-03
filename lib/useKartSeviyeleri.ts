// ============================================================
// EdebiKart — Leitner kart seviye yönetimi (hook)
// Seviye 1-5. "Öğrendim" +1, "Tekrar" => 1.
// ============================================================

import { useCallback, useEffect, useState } from "react";
import { kartSeviyeleri, kartSeviyesiGuncelle } from "./user";

export const MIN_SEVIYE = 1;
export const MAX_SEVIYE = 5;

export type KartSeviyeHaritasi = Record<number, number>;

export function useKartSeviyeleri() {
  const [seviyeler, setSeviyeler] = useState<KartSeviyeHaritasi>({});

  useEffect(() => {
    setSeviyeler(kartSeviyeleri());
  }, []);

  const ogren = useCallback((kartId: number) => {
    setSeviyeler((onceki) => {
      const mevcut = onceki[kartId] ?? MIN_SEVIYE;
      const yeni = Math.min(MAX_SEVIYE, mevcut + 1);
      kartSeviyesiGuncelle(kartId, yeni);
      return { ...onceki, [kartId]: yeni };
    });
  }, []);

  const tekrar = useCallback((kartId: number) => {
    setSeviyeler((onceki) => {
      kartSeviyesiGuncelle(kartId, MIN_SEVIYE);
      return { ...onceki, [kartId]: MIN_SEVIYE };
    });
  }, []);

  return { seviyeler, ogren, tekrar };
}
