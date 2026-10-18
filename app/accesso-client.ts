"use client";

import { useCallback, useEffect, useState } from "react";

export type StatoAccesso = { pagamenti: boolean; abbonato: boolean; codice: string | null; gratisAlMese: number; gratisRimaste: number };

/** Stato delle prove gratuite e dell'abbonamento di questo browser. */
export function useAccesso() {
  const [stato, setStato] = useState<StatoAccesso | null>(null);
  const aggiorna = useCallback(() => {
    fetch("/api/accesso", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => s && setStato(s))
      .catch(() => {});
  }, []);
  useEffect(() => {
    aggiorna();
    const f = () => aggiorna();
    window.addEventListener("ec-accesso", f);
    return () => window.removeEventListener("ec-accesso", f);
  }, [aggiorna]);
  return { stato, aggiorna: () => window.dispatchEvent(new Event("ec-accesso")) };
}
