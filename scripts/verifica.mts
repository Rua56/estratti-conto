// Controlli automatici sugli esempi: npm test
// Usa il riconoscimento a regole, quindi non consuma credito AI.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { categoriaDaRegole } from "../lib/categorie";
import { elabora } from "../lib/elabora";
import { OPZIONI_GESTIONALE, csvGestionale, csvPrimaNota, excel } from "../lib/esportazione";
import { unisci } from "../lib/unisci";
import { controllaSaldi, statoFattura } from "../lib/riconciliazione";
import type { Movimento } from "../lib/types";

const radice = join(import.meta.dirname, "..", "samples");
let ok = 0;
async function prova(nome: string, fn: () => unknown) {
  try {
    await fn();
    ok++;
    console.log(`✓ ${nome}`);
  } catch (e) {
    console.error(`✗ ${nome}\n  ${(e as Error).message}`);
    process.exitCode = 1;
  }
}

async function carica(cartella: string, pdf: string, piva: string) {
  const dir = join(radice, cartella);
  return elabora({
    pdf: new Uint8Array(readFileSync(join(dir, pdf))),
    fatture: readdirSync(dir)
      .filter((f) => f.endsWith(".xml"))
      .map((nome) => ({ nome, xml: readFileSync(join(dir, nome), "utf8") })),
    pivaCliente: piva,
    forzaRegole: true,
  });
}

const base = await carica(".", "estratto-esempio.pdf", "01234567890");
await prova("esempio base: 11 movimenti e saldi che quadrano", () => {
  assert.equal(base.estratto.movimenti.length, 11);
  assert.equal(base.estratto.controlloSaldi.quadra, true);
  assert.equal(base.abbinamenti.length, 3);
});

const atteso = JSON.parse(readFileSync(join(radice, "realistico", "atteso.json"), "utf8"));
const real = await carica("realistico", "estratto-marzo-2026.pdf", "03456780219");
await prova("esempio realistico: movimenti, saldi e totali", () => {
  const e = real.estratto;
  assert.equal(e.movimenti.length, atteso.movimenti);
  assert.equal(e.saldoIniziale, atteso.saldoIniziale);
  assert.equal(e.saldoFinale, atteso.saldoFinale);
  assert.equal(e.controlloSaldi.quadra, true);
  assert.deepEqual(e.controlloSaldi.righeSospette, []);
  const entrate = e.movimenti.filter((m) => m.importo > 0).reduce((s, m) => s + m.importo, 0);
  assert.equal(Math.round(entrate * 100) / 100, atteso.totaleEntrate);
});
await prova("esempio realistico: fatture pagate, acconto e fattura aperta", () => {
  const stato = Object.fromEntries(real.fatture.map((f) => [f.numero, statoFattura(f, real.abbinamenti)]));
  for (const n of ["18/2026", "19/2026", "20/2026", "2026/0331", "112", "57/2026"]) assert.equal(stato[n].stato, "pagata", n);
  assert.deepEqual(stato["21/2026"], { stato: "parziale", pagato: 1464, residuo: 3416 });
  assert.equal(stato["22/2026"].stato, "aperta");
});
const attesoTi = JSON.parse(readFileSync(join(radice, "tipo-intesa", "atteso.json"), "utf8"));
const ti = await carica("tipo-intesa", "estratto-maggio-2026.pdf", "07654320963");
await prova("formato grande banca: riepilogo in testa, causali su più righe, filigrana", () => {
  const e = ti.estratto;
  assert.equal(e.movimenti.length, attesoTi.movimenti);
  assert.equal(e.saldoIniziale, attesoTi.saldoIniziale);
  assert.equal(e.saldoFinale, attesoTi.saldoFinale);
  assert.equal(e.controlloSaldi.quadra, true);
  assert.equal(e.periodoDa, "2026-05-01");
  assert.ok(e.movimenti.every((m) => !/FAC-SIMILE|Estratto conto$/.test(m.descrizione)), "testo di pagina finito nelle causali");
});
await prova("categorie per natura della spesa", () => {
  const cat = (s: string, i = -10) => categoriaDaRegole(s, i);
  assert.equal(cat("ADDEBITO SDD UNIPOLSAI ASSICURAZIONI POLIZZA RCA FURGONE"), "Assicurazioni");
  assert.equal(cat("PAGAMENTO POS AUTOGRILL BRENNERO"), "Viaggi, vitto e alloggio");
  assert.equal(cat("PAGAMENTO POS ENI STATION BRESSANONE"), "Carburante e trasporti");
  assert.equal(cat("BONIFICO SEPA A COMMERCIALISTA DR.SSA HOFER"), "Consulenze professionali");
  assert.equal(cat("BONIFICO SEPA DA HOTEL MIRAMONTI SRL SALDO FATT. N. 18/2026", 7930), "Incassi da clienti");
  assert.equal(cat("INTERESSI CREDITORI NETTI", 3.12), "Interessi");
});
await prova("saldo progressivo: segnala solo la riga sbagliata", () => {
  const mov = (id: string, importo: number, saldo: number | null): Movimento => ({
    id, importo, saldo, data: "2026-01-01", dataValuta: null, descrizione: "", categoria: "Altro", affidabilita: 1,
  });
  // m2 letto con 10 invece di 100: il saldo stampato dopo m2 non torna, m3 riparte corretto.
  const c = controllaSaldi({ saldoIniziale: 1000, saldoFinale: 1050, movimenti: [mov("m1", -50, 950), mov("m2", 10, 1050), mov("m3", 0, 1050)] });
  assert.deepEqual(c.righeSospette, ["m2"]);
  assert.equal(c.quadra, false);
  assert.equal(c.differenza, -90);
});
await prova("export: Excel valido e CSV con separatore italiano", async () => {
  const xlsx = await excel(real);
  assert.equal(xlsx.subarray(0, 2).toString(), "PK");
  const csv = csvPrimaNota(real);
  assert.match(csv, /^﻿Data;Conto dare;Conto avere;Importo/);
  assert.match(csv, /parziale 1\.464,00 su 4\.880,00/);
});

await prova("più estratti insieme: movimenti uniti e fatture riabbinate una volta sola", async () => {
  const u = unisci([real, ti]);
  assert.equal(u.estratto.movimenti.length, real.estratto.movimenti.length + ti.estratto.movimenti.length);
  assert.equal(new Set(u.estratto.movimenti.map((m) => m.id)).size, u.estratto.movimenti.length);
  assert.equal(u.estratto.controlloSaldi.quadra, true);
  assert.equal(u.abbinamenti.length, real.abbinamenti.length);
  const xlsx = await excel(u, [real.estratto, ti.estratto]);
  assert.equal(xlsx.subarray(0, 2).toString(), "PK");
});
await prova("CSV gestionale: codici conto, separatore e formato data", () => {
  const csv = csvGestionale(real, { ...OPZIONI_GESTIONALE, separatore: "\t", decimale: ".", formatoData: "ggmmaaaa", contoBanca: "18.05.001", conti: { "Incassi da clienti": "15.01.001" } });
  const righe = csv.replace(/^\ufeff/, "").split("\r\n");
  assert.equal(righe[0].split("\t")[2], "Conto dare");
  const incasso = righe.find((r) => r.includes("15.01.001"))!.split("\t");
  assert.match(incasso[0], /^\d{8}$/);
  assert.equal(incasso[2], "18.05.001");
  assert.equal(incasso[3], "15.01.001");
  assert.match(incasso[4], /^\d+\.\d{2}$/);
});
await prova("accesso: codice firmato valido solo se intatto", async () => {
  process.env.ACCESSO_SECRET = "prova";
  const { firmato, verificato } = await import("../lib/accesso");
  const c = firmato("sub_123");
  assert.equal(verificato(c), "sub_123");
  assert.equal(verificato(c.replace("sub_123", "sub_124")), null);
  assert.equal(verificato("sub_123"), null);
});

console.log(`\n${ok} controlli superati${process.exitCode ? ", alcuni falliti" : ""}.`);
