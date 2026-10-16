// Abbinamento dei movimenti bancari alle fatture elettroniche.
import { giorniTra } from "./numeri";
import type { Abbinamento, ControlloSaldi, Estratto, Fattura, Movimento } from "./types";

const PAROLE_VUOTE = new Set(["SRL", "SPA", "SAS", "SNC", "SRLS", "S.R.L.", "S.P.A.", "DI", "E", "DEL", "DELLA", "&", "SOCIETA"]);

function parole(nome: string): string[] {
  return nome
    .toUpperCase()
    .replace(/[^A-Z0-9À-Ù ]/g, " ")
    .split(/\s+/)
    .filter((p) => p.length >= 3 && !PAROLE_VUOTE.has(p));
}

function punteggio(m: Movimento, f: Fattura): { punteggio: number; motivi: string[] } | null {
  const segnoOk = f.tipo === "sconosciuta" || (f.tipo === "attiva" ? m.importo > 0 : m.importo < 0);
  if (!segnoOk) return null;

  const valore = Math.abs(m.importo);
  const importi = [f.totale, ...f.scadenze.map((s) => s.importo)].filter((v) => v > 0);
  const importoEsatto = importi.some((v) => Math.abs(v - valore) < 0.01);
  if (!importoEsatto) return null;

  const motivi = ["importo identico"];
  let p = 0.5;

  const descr = m.descrizione.toUpperCase();
  if (f.numero && new RegExp(`\\b${f.numero.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}\\b`).test(descr)) {
    p += 0.3;
    motivi.push(`numero fattura ${f.numero} nella causale`);
  }
  const controparte = f.tipo === "passiva" ? f.cedente : f.tipo === "attiva" ? f.cessionario : `${f.cedente} ${f.cessionario}`;
  const comuni = parole(controparte).filter((w) => descr.includes(w));
  if (comuni.length) {
    p += 0.2;
    motivi.push(`nome ${comuni.join(" ")} nella causale`);
  }

  const riferimenti = [f.data, ...f.scadenze.map((s) => s.data)].filter(Boolean) as string[];
  const distanza = Math.min(...riferimenti.map((d) => Math.abs(giorniTra(d, m.data))));
  if (giorniTra(f.data, m.data) < -5) return null; // pagato prima della fattura: improbabile
  if (distanza <= 10) {
    p += 0.1;
    motivi.push("data vicina a fattura o scadenza");
  } else if (distanza > 120) p -= 0.2;

  return { punteggio: Math.min(1, p), motivi };
}

/** Abbinamento greedy: prima le coppie più sicure, ogni movimento e fattura usati una volta. */
export function riconcilia(movimenti: Movimento[], fatture: Fattura[]): Abbinamento[] {
  const candidati: Abbinamento[] = [];
  for (const m of movimenti)
    for (const f of fatture) {
      const r = punteggio(m, f);
      if (r && r.punteggio >= 0.5) candidati.push({ movimentoId: m.id, fatturaId: f.id, ...r });
    }
  candidati.sort((a, b) => b.punteggio - a.punteggio);
  const usatiM = new Set<string>();
  const usatiF = new Set<string>();
  const scelti: Abbinamento[] = [];
  for (const c of candidati) {
    if (usatiM.has(c.movimentoId) || usatiF.has(c.fatturaId)) continue;
    usatiM.add(c.movimentoId);
    usatiF.add(c.fatturaId);
    scelti.push(c);
  }
  return scelti;
}

/** Verifica che saldo iniziale + movimenti = saldo finale. */
export function controllaSaldi(e: Pick<Estratto, "saldoIniziale" | "saldoFinale" | "movimenti">): ControlloSaldi {
  if (e.saldoIniziale === null || e.saldoFinale === null) return { eseguito: false, quadra: false, differenza: null };
  const somma = e.movimenti.reduce((s, m) => s + m.importo, 0);
  const differenza = Math.round((e.saldoIniziale + somma - e.saldoFinale) * 100) / 100;
  return { eseguito: true, quadra: Math.abs(differenza) < 0.01, differenza };
}
