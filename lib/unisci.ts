import { formatData } from "./numeri";
import { riconcilia } from "./riconciliazione";
import type { Estratto, Risultato } from "./types";

const MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
const mese = (iso: string) => `${MESI[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

/** Nome breve di un estratto: banca, ultime cifre dell'IBAN e periodo. */
export const etichettaEstratto = (e: Estratto) => {
  const periodo =
    e.periodoDa && e.periodoA && e.periodoDa.slice(0, 7) === e.periodoA.slice(0, 7)
      ? mese(e.periodoDa)
      : e.periodoDa
        ? `${formatData(e.periodoDa)}-${formatData(e.periodoA)}`
        : null;
  const banca = e.banca && e.banca === e.banca.toUpperCase() ? e.banca.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase()) : e.banca;
  return [banca ?? "Estratto", e.iban ? `…${e.iban.slice(-4)}` : null, periodo].filter(Boolean).join(" · ");
};

/** Unisce più estratti in un solo risultato e rifà l'abbinamento con le fatture su tutti i movimenti insieme. */
export function unisci(risultati: Risultato[]): Risultato {
  if (risultati.length === 1) return risultati[0];
  const movimenti = risultati.flatMap((r, i) =>
    r.estratto.movimenti.map((m) => ({ ...m, id: `e${i + 1}-${m.id}`, conto: etichettaEstratto(r.estratto) })),
  );
  movimenti.sort((a, b) => a.data.localeCompare(b.data));
  const fatture = risultati.find((r) => r.fatture.length)?.fatture ?? [];
  const date = risultati.flatMap((r) => [r.estratto.periodoDa, r.estratto.periodoA]).filter((d): d is string => Boolean(d)).sort();
  const tutti = risultati.every((r) => r.estratto.controlloSaldi.eseguito);
  const estratto: Estratto = {
    banca: `${risultati.length} estratti conto`,
    intestatario: [...new Set(risultati.map((r) => r.estratto.intestatario).filter(Boolean))].join(", ") || null,
    iban: null,
    periodoDa: date[0] ?? null,
    periodoA: date.at(-1) ?? null,
    saldoIniziale: null,
    saldoFinale: null,
    movimenti,
    metodo: risultati.some((r) => r.estratto.metodo === "ai") ? "ai" : "regole",
    controlloSaldi: {
      eseguito: tutti,
      quadra: tutti && risultati.every((r) => r.estratto.controlloSaldi.quadra),
      differenza: null,
      righeSospette: risultati.flatMap((r, i) => r.estratto.controlloSaldi.righeSospette.map((id) => `e${i + 1}-${id}`)),
    },
  };
  return { estratto, fatture, abbinamenti: riconcilia(movimenti, fatture) };
}
