// Lettura delle fatture elettroniche FatturaPA (XML dello SDI).
import { XMLParser } from "fast-xml-parser";
import { arrotonda } from "./numeri";
import type { Fattura } from "./types";

const parser = new XMLParser({
  ignoreAttributes: true,
  removeNSPrefix: true,
  parseTagValue: false,
  isArray: (nome) => ["FatturaElettronicaBody", "DettaglioPagamento", "DatiPagamento", "DatiRiepilogo"].includes(nome),
});

type Nodo = Record<string, unknown>;
const get = (o: unknown, ...path: string[]): unknown =>
  path.reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Nodo)[k] : undefined), o);
const str = (v: unknown) => (v === undefined || v === null ? "" : String(v).trim());
const num = (v: unknown) => {
  const n = Number(str(v));
  return Number.isFinite(n) ? n : 0;
};

function nomeAnagrafica(dati: unknown): string {
  const a = get(dati, "Anagrafica");
  return str(get(a, "Denominazione")) || [str(get(a, "Nome")), str(get(a, "Cognome"))].filter(Boolean).join(" ");
}

/** Legge un file FatturaPA. `pivaCliente` serve a capire se è attiva o passiva. */
export function leggiFatturaPA(xml: string, file: string, pivaCliente?: string): Fattura[] {
  const doc = parser.parse(xml);
  const root = get(doc, "FatturaElettronica");
  if (!root) throw new Error(`${file}: non è una fattura elettronica valida`);

  const header = get(root, "FatturaElettronicaHeader");
  const cedente = get(header, "CedentePrestatore", "DatiAnagrafici");
  const cessionario = get(header, "CessionarioCommittente", "DatiAnagrafici");
  const cedentePiva = str(get(cedente, "IdFiscaleIVA", "IdCodice")) || null;
  const cessionarioPiva = str(get(cessionario, "IdFiscaleIVA", "IdCodice")) || str(get(cessionario, "CodiceFiscale")) || null;

  const piva = pivaCliente?.replace(/^IT/i, "").trim();
  const tipo: Fattura["tipo"] = !piva ? "sconosciuta" : piva === cedentePiva ? "attiva" : piva === cessionarioPiva ? "passiva" : "sconosciuta";

  const bodies = (get(root, "FatturaElettronicaBody") as unknown[]) ?? [];
  return bodies.map((body, i) => {
    const gen = get(body, "DatiGenerali", "DatiGeneraliDocumento");
    let totale = num(get(gen, "ImportoTotaleDocumento"));
    if (!totale) {
      const riep = (get(body, "DatiBeniServizi", "DatiRiepilogo") as unknown[]) ?? [];
      totale = riep.reduce<number>((s, r) => s + num(get(r, "ImponibileImporto")) + num(get(r, "Imposta")), 0);
    }
    const scadenze = ((get(body, "DatiPagamento") as unknown[]) ?? []).flatMap((dp) =>
      ((get(dp, "DettaglioPagamento") as unknown[]) ?? []).map((d) => ({
        data: str(get(d, "DataScadenzaPagamento")) || null,
        importo: arrotonda(num(get(d, "ImportoPagamento"))),
      })),
    );
    return {
      id: `${file}#${i + 1}`,
      file,
      numero: str(get(gen, "Numero")),
      data: str(get(gen, "Data")),
      tipo,
      cedente: nomeAnagrafica(cedente),
      cedentePiva,
      cessionario: nomeAnagrafica(cessionario),
      cessionarioPiva,
      totale: arrotonda(totale),
      scadenze,
    };
  });
}
