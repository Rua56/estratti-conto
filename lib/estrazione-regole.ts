// Estrazione senza AI: legge il testo del PDF con le coordinate e ricostruisce
// le righe dei movimenti usando le colonne Dare/Avere dell'intestazione.
import { getDocumentProxy } from "unpdf";
import { categoriaDaRegole } from "./categorie";
import { arrotonda, parseData, parseImporto } from "./numeri";
import type { Estratto, Movimento } from "./types";

type Pezzo = { x: number; y: number; testo: string };
type Riga = { y: number; pezzi: Pezzo[] };

const RE_IMPORTO = /^[-+]?\d{1,3}(\.\d{3})*,\d{2}$|^[-+]?\d+,\d{2}$/;
const RE_IBAN = /IT\d{2}[A-Z]\d{10}[0-9A-Z]{12}/;

export async function contaPagine(pdf: Uint8Array): Promise<number> {
  const doc = await getDocumentProxy(pdf.slice());
  return doc.numPages;
}

async function righePdf(pdf: Uint8Array): Promise<Riga[][]> {
  const doc = await getDocumentProxy(pdf);
  const pagine: Riga[][] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const pezzi: Pezzo[] = [];
    for (const item of content.items as { str?: string; transform?: number[] }[]) {
      if (!item.str?.trim() || !item.transform) continue;
      pezzi.push({ x: item.transform[4], y: item.transform[5], testo: item.str.trim() });
    }
    // Raggruppa per riga (stessa y con tolleranza), dall'alto in basso.
    pezzi.sort((a, b) => b.y - a.y || a.x - b.x);
    const righe: Riga[] = [];
    for (const pz of pezzi) {
      const r = righe.find((r) => Math.abs(r.y - pz.y) < 3);
      if (r) r.pezzi.push(pz);
      else righe.push({ y: pz.y, pezzi: [pz] });
    }
    for (const r of righe) r.pezzi.sort((a, b) => a.x - b.x);
    pagine.push(righe);
  }
  return pagine;
}

const testoRiga = (r: Riga) => r.pezzi.map((p) => p.testo).join(" ");

/** Testo semplice del PDF, usato anche per capire se il PDF è una scansione. */
export async function testoPdf(pdf: Uint8Array): Promise<string> {
  const pagine = await righePdf(pdf);
  return pagine.map((righe) => righe.map(testoRiga).join("\n")).join("\n\n");
}

export async function estraiConRegole(pdf: Uint8Array): Promise<Omit<Estratto, "controlloSaldi">> {
  const pagine = await righePdf(pdf);
  const tutto = pagine.flat();
  const testo = tutto.map(testoRiga).join("\n");

  let colUscite: number | null = null;
  let colEntrate: number | null = null;
  let colSaldo: number | null = null;
  let saldoIniziale: number | null = null;
  let saldoFinale: number | null = null;
  const movimenti: Movimento[] = [];
  let ultimo: Movimento | null = null;

  for (const riga of tutto) {
    const t = testoRiga(riga);

    // Intestazione colonne
    const uscite = riga.pezzi.find((p) => /^(DARE|USCITE|ADDEBITI)$/i.test(p.testo));
    const entrate = riga.pezzi.find((p) => /^(AVERE|ENTRATE|ACCREDITI)$/i.test(p.testo));
    if (uscite && entrate) {
      colUscite = uscite.x;
      colEntrate = entrate.x;
      colSaldo = riga.pezzi.find((p) => /^SALDO$/i.test(p.testo))?.x ?? null;
      ultimo = null;
      continue;
    }

    const importiRiga = riga.pezzi.filter((p) => RE_IMPORTO.test(p.testo));
    if (/SALDO (INIZIALE|INIZIO|PRECEDENTE|AL \d)/i.test(t) && importiRiga.length) {
      if (saldoIniziale === null) saldoIniziale = parseImporto(importiRiga.at(-1)!.testo);
      ultimo = null;
      continue;
    }
    if (/SALDO (FINALE|CONTABILE FINALE|AL TERMINE)/i.test(t) && importiRiga.length) {
      saldoFinale = parseImporto(importiRiga.at(-1)!.testo);
      ultimo = null;
      continue;
    }

    const date = riga.pezzi.filter((p) => parseData(p.testo));
    const inizia = date.length > 0 && riga.pezzi[0] === date[0];
    if (inizia && importiRiga.length) {
      const dataContabile = parseData(date[0].testo)!;
      const dataValuta = date[1] ? parseData(date[1].testo) : null;
      const descr = riga.pezzi
        .filter((p) => !date.slice(0, 2).includes(p) && !importiRiga.includes(p))
        .map((p) => p.testo)
        .join(" ");

      let importo: number | null = null;
      let saldo: number | null = null;
      let affidabilita = 0.6;
      for (const pz of importiRiga) {
        const v = parseImporto(pz.testo)!;
        const vicino = (col: number | null) => (col === null ? Infinity : Math.abs(pz.x - col));
        const dist = [
          { tipo: "uscita", d: vicino(colUscite) },
          { tipo: "entrata", d: vicino(colEntrate) },
          { tipo: "saldo", d: vicino(colSaldo) },
        ].sort((a, b) => a.d - b.d)[0];
        if (dist.d === Infinity) {
          importo ??= v;
        } else if (dist.tipo === "saldo") saldo = v;
        else if (importo === null) {
          importo = dist.tipo === "uscita" ? -Math.abs(v) : Math.abs(v);
          affidabilita = 0.9;
        }
      }
      if (importo === null) continue;
      if (colUscite === null && importo > 0) {
        // Senza colonne: segno dedotto dalla descrizione.
        const entrata = /A VOSTRO FAVORE|ACCREDITO|VERSAMENTO|BONIFICO (IN ENTRATA|RICEVUTO)|INCASSO|STORNO/i.test(descr);
        if (!entrata) importo = -importo;
      }
      ultimo = {
        id: `m${movimenti.length + 1}`,
        data: dataContabile,
        dataValuta,
        descrizione: descr,
        importo: arrotonda(importo),
        saldo,
        categoria: "",
        affidabilita,
      };
      movimenti.push(ultimo);
      continue;
    }

    // Riga di continuazione della descrizione
    if (ultimo && !importiRiga.length && !date.length && t.length < 120 && !/PAGINA|PAG\.\s*\d|SEGUE|TOTALE/i.test(t)) {
      ultimo.descrizione = `${ultimo.descrizione} ${t}`.trim();
    } else if (!inizia) {
      ultimo = null;
    }
  }

  for (const m of movimenti) m.categoria = categoriaDaRegole(m.descrizione, m.importo);

  const banca =
    testo.match(/\b(?:Intesa Sanpaolo|UniCredit|BPER|Banco BPM|Poste Italiane|BancoPosta|Fineco|Mediolanum|Crédit Agricole|BNL|Monte dei Paschi|Credem|ING Bank|N26|Revolut|Banca Sella)\b/i)?.[0] ??
    testo.match(/(?:Cassa Rurale|Cassa di Risparmio|Banca Popolare|Credito Cooperativo|Banca)(?:[ \t]+[^\s\d-][^\s]*){0,2}/i)?.[0]?.trim() ??
    null;
  const periodo = testo.match(/dal\s+(\d{2}\/\d{2}\/\d{4})\s+al\s+(\d{2}\/\d{2}\/\d{4})/i);

  return {
    banca,
    intestatario:
      testo
        .match(/Intestat(?:ario|aria|o|a)(?:\s+a)?\s*:?\s*([^\n]+)/i)?.[1]
        ?.split(/\s+-\s+|\s{2,}|\s+P\.?\s?IVA|\s+C\.?F\./i)[0]
        ?.trim() || null,
    iban: testo.replace(/\s/g, "").match(RE_IBAN)?.[0] ?? null,
    periodoDa: periodo ? parseData(periodo[1]) : (movimenti[0]?.data ?? null),
    periodoA: periodo ? parseData(periodo[2]) : (movimenti.at(-1)?.data ?? null),
    saldoIniziale,
    saldoFinale,
    movimenti,
    metodo: "regole",
  };
}
