// Abbinamento dei movimenti bancari alle fatture elettroniche.
import { arrotonda, giorniTra } from "./numeri";
import type { Abbinamento, ControlloSaldi, Estratto, Fattura, Movimento, StatoFattura } from "./types";

const PAROLE_VUOTE = new Set(["SRL", "SPA", "SAS", "SNC", "SRLS", "S.R.L.", "S.P.A.", "DI", "E", "DEL", "DELLA", "&", "SOCIETA"]);

function parole(nome: string): string[] {
  return nome
    .toUpperCase()
    .replace(/[^A-Z0-9À-Ù ]/g, " ")
    .split(/\s+/)
    .filter((p) => p.length >= 3 && !PAROLE_VUOTE.has(p));
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

function punteggio(m: Movimento, f: Fattura): Omit<Abbinamento, "movimentoId" | "fatturaId"> | null {
  const segnoOk = f.tipo === "sconosciuta" || (f.tipo === "attiva" ? m.importo > 0 : m.importo < 0);
  if (!segnoOk) return null;
  if (giorniTra(f.data, m.data) < -5) return null; // pagato prima della fattura: improbabile

  const valore = Math.abs(m.importo);
  const descr = m.descrizione.toUpperCase();
  const numeroInCausale = Boolean(f.numero) && new RegExp(`(^|[^0-9A-Z])${escape(f.numero.toUpperCase())}([^0-9A-Z]|$)`).test(descr);
  const controparte = f.tipo === "passiva" ? f.cedente : f.tipo === "attiva" ? f.cessionario : `${f.cedente} ${f.cessionario}`;
  const comuni = parole(controparte).filter((w) => descr.includes(w));

  const importi = [f.totale, ...f.scadenze.map((s) => s.importo)].filter((v) => v > 0);
  const importoEsatto = importi.some((v) => Math.abs(v - valore) < 0.01);
  // Acconto o rata: importo minore del totale, accettato solo se la causale cita il numero della fattura.
  const parziale = !importoEsatto && numeroInCausale && valore < f.totale - 0.01;
  if (!importoEsatto && !parziale) return null;

  const motivi = [importoEsatto ? "importo identico" : "pagamento parziale con numero fattura in causale"];
  let p = importoEsatto ? 0.5 : 0.4;
  if (numeroInCausale) {
    p += 0.3;
    motivi.push(`numero fattura ${f.numero} nella causale`);
  }
  if (comuni.length) {
    p += 0.2;
    motivi.push(`nome ${comuni.join(" ")} nella causale`);
  }
  const riferimenti = [f.data, ...f.scadenze.map((s) => s.data)].filter(Boolean) as string[];
  const distanza = Math.min(...riferimenti.map((d) => Math.abs(giorniTra(d, m.data))));
  if (distanza <= 10) {
    p += 0.1;
    motivi.push("data vicina a fattura o scadenza");
  } else if (distanza > 120) p -= 0.2;

  return { punteggio: arrotonda(Math.min(1, p)), motivi, importo: arrotonda(valore), parziale };
}

/** Abbinamento greedy: prima le coppie più sicure. Ogni movimento è usato una volta;
 *  una fattura può ricevere più pagamenti parziali finché non è coperta. */
export function riconcilia(movimenti: Movimento[], fatture: Fattura[]): Abbinamento[] {
  const candidati: Abbinamento[] = [];
  for (const m of movimenti)
    for (const f of fatture) {
      const r = punteggio(m, f);
      if (r && r.punteggio >= 0.5) candidati.push({ movimentoId: m.id, fatturaId: f.id, ...r });
    }
  // Prima gli importi identici, poi i pagamenti parziali, così un acconto non consuma una fattura saldata per intero.
  candidati.sort((a, b) => Number(a.parziale) - Number(b.parziale) || b.punteggio - a.punteggio);
  const usatiM = new Set<string>();
  const residuo = new Map(fatture.map((f) => [f.id, f.totale]));
  const scelti: Abbinamento[] = [];
  for (const c of candidati) {
    const r = residuo.get(c.fatturaId) ?? 0;
    if (usatiM.has(c.movimentoId) || c.importo > r + 0.01) continue;
    usatiM.add(c.movimentoId);
    residuo.set(c.fatturaId, arrotonda(r - c.importo));
    // Un pagamento che chiude il residuo dopo un acconto è a sua volta parziale rispetto al totale.
    const f = fatture.find((x) => x.id === c.fatturaId);
    scelti.push({ ...c, parziale: f ? c.importo < f.totale - 0.01 : c.parziale });
  }
  return scelti;
}

export function statoFattura(f: Fattura, abbinamenti: Abbinamento[]): StatoFattura {
  const pagato = arrotonda(abbinamenti.filter((a) => a.fatturaId === f.id).reduce((s, a) => s + a.importo, 0));
  const residuo = arrotonda(Math.max(0, f.totale - pagato));
  return { stato: pagato === 0 ? "aperta" : residuo < 0.01 ? "pagata" : "parziale", pagato, residuo };
}

/** Verifica che saldo iniziale + movimenti = saldo finale e, dove la banca stampa il saldo
 *  progressivo, segnala la prima riga da cui i conti smettono di tornare. */
export function controllaSaldi(e: Pick<Estratto, "saldoIniziale" | "saldoFinale" | "movimenti">): ControlloSaldi {
  const righeSospette: string[] = [];
  let atteso = e.saldoIniziale;
  for (const m of e.movimenti) {
    if (atteso !== null) atteso = arrotonda(atteso + m.importo);
    if (m.saldo !== null) {
      if (atteso !== null && Math.abs(atteso - m.saldo) >= 0.01) righeSospette.push(m.id);
      atteso = m.saldo; // riparte dal saldo stampato, così si segnala solo la riga che rompe la catena
    }
  }
  if (e.saldoIniziale === null || e.saldoFinale === null) return { eseguito: false, quadra: false, differenza: null, righeSospette };
  const somma = e.movimenti.reduce((s, m) => s + m.importo, 0);
  const differenza = arrotonda(e.saldoIniziale + somma - e.saldoFinale);
  return { eseguito: true, quadra: Math.abs(differenza) < 0.01, differenza, righeSospette };
}
