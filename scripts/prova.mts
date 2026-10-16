// Prova end-to-end sugli esempi: npm run prova
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { elabora } from "../lib/elabora";
import { csvPrimaNota, excel } from "../lib/esportazione";

const dir = join(import.meta.dirname, "..", "samples");
const forzaRegole = process.argv.includes("--regole");

const r = await elabora({
  pdf: new Uint8Array(readFileSync(join(dir, "estratto-esempio.pdf"))),
  fatture: readdirSync(dir)
    .filter((f) => f.endsWith(".xml"))
    .map((nome) => ({ nome, xml: readFileSync(join(dir, nome), "utf8") })),
  pivaCliente: "01234567890",
  forzaRegole,
});

console.log(`Metodo: ${r.estratto.metodo} | banca: ${r.estratto.banca} | IBAN: ${r.estratto.iban}`);
console.log(`Periodo: ${r.estratto.periodoDa} -> ${r.estratto.periodoA}`);
console.log(`Saldi: ${r.estratto.saldoIniziale} -> ${r.estratto.saldoFinale}`, r.estratto.controlloSaldi);
console.table(r.estratto.movimenti.map((m) => ({ data: m.data, importo: m.importo, categoria: m.categoria, descr: m.descrizione.slice(0, 55) })));
console.table(
  r.abbinamenti.map((a) => ({ mov: a.movimentoId, fattura: a.fatturaId, punteggio: a.punteggio, motivi: a.motivi.join(", ") })),
);
console.log("Avvisi:", r.avvisi);

writeFileSync(join(dir, "output-esempio.xlsx"), await excel(r));
writeFileSync(join(dir, "output-prima-nota.csv"), csvPrimaNota(r));
console.log("Scritti samples/output-esempio.xlsx e samples/output-prima-nota.csv");
