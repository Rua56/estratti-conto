// Esportazione in Excel e CSV (formato italiano: separatore ";" e virgola decimale).
import ExcelJS from "exceljs";
import { formatData, formatImporto } from "./numeri";
import { statoFattura } from "./riconciliazione";
import type { OpzioniGestionale } from "./esportazione-opzioni";
import { etichettaEstratto } from "./unisci";
import type { Estratto, Risultato } from "./types";

const csvCampo = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const csvNumero = (n: number | null) => (n === null ? "" : n.toFixed(2).replace(".", ","));

function fatturaPer(r: Risultato, movimentoId: string) {
  const a = r.abbinamenti.find((x) => x.movimentoId === movimentoId);
  const f = a && r.fatture.find((x) => x.id === a.fatturaId);
  if (!f || !a) return "";
  return `${f.numero} del ${formatData(f.data)}${a.parziale ? ` (parziale ${formatImporto(a.importo)} su ${formatImporto(f.totale)})` : ""}`;
}

export function daVerificare(r: Risultato, id: string, affidabilita: number): boolean {
  return affidabilita < 0.8 || r.estratto.controlloSaldi.righeSospette?.includes(id);
}

/** CSV movimenti: data;valuta;descrizione;entrate;uscite;saldo;categoria;fattura */
export function csvMovimenti(r: Risultato): string {
  const righe = [["Data", "Valuta", "Descrizione", "Entrate", "Uscite", "Saldo", "Categoria", "Fattura abbinata"].join(";")];
  for (const m of r.estratto.movimenti) {
    righe.push(
      [
        formatData(m.data),
        formatData(m.dataValuta),
        csvCampo(m.descrizione),
        m.importo > 0 ? csvNumero(m.importo) : "",
        m.importo < 0 ? csvNumero(-m.importo) : "",
        csvNumero(m.saldo),
        csvCampo(m.categoria),
        csvCampo(fatturaPer(r, m.id)),
      ].join(";"),
    );
  }
  return "﻿" + righe.join("\r\n");
}

/** CSV prima nota banca: una riga per movimento con conto dare e conto avere. */
export function csvPrimaNota(r: Risultato, contoBanca = "Banca c/c"): string {
  const righe = [["Data", "Conto dare", "Conto avere", "Importo", "Descrizione", "Documento"].join(";")];
  for (const m of r.estratto.movimenti) {
    const dare = m.importo > 0 ? contoBanca : m.categoria;
    const avere = m.importo > 0 ? m.categoria : contoBanca;
    righe.push(
      [formatData(m.data), csvCampo(dare), csvCampo(avere), csvNumero(Math.abs(m.importo)), csvCampo(m.descrizione), csvCampo(fatturaPer(r, m.id))].join(";"),
    );
  }
  return "﻿" + righe.join("\r\n");
}

/** Excel completo. Con più estratti, `estratti` aggiunge il foglio di riepilogo per conto. */
export async function excel(r: Risultato, estratti: Estratto[] = []): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Estratti Conto";
  const euro = '#,##0.00 "€";[Red]-#,##0.00 "€"';

  const ws = wb.addWorksheet("Movimenti", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "Data", key: "data", width: 12, style: { numFmt: "dd/mm/yyyy" } },
    { header: "Valuta", key: "valuta", width: 12, style: { numFmt: "dd/mm/yyyy" } },
    { header: "Descrizione", key: "descrizione", width: 60 },
    { header: "Importo", key: "importo", width: 14, style: { numFmt: euro } },
    { header: "Saldo", key: "saldo", width: 14, style: { numFmt: euro } },
    { header: "Categoria", key: "categoria", width: 28 },
    { header: "Fattura abbinata", key: "fattura", width: 24 },
    { header: "Da verificare", key: "verifica", width: 13 },
    ...(estratti.length > 1 ? [{ header: "Conto", key: "conto", width: 34 }] : []),
  ];
  ws.getRow(1).font = { bold: true };
  const d = (iso: string | null) => (iso ? new Date(`${iso}T00:00:00Z`) : null);
  for (const m of r.estratto.movimenti) {
    ws.addRow({
      data: d(m.data),
      valuta: d(m.dataValuta),
      descrizione: m.descrizione,
      importo: m.importo,
      saldo: m.saldo,
      categoria: m.categoria,
      fattura: fatturaPer(r, m.id),
      verifica: daVerificare(r, m.id, m.affidabilita) ? "Sì" : "",
      conto: m.conto ?? "",
    });
  }
  ws.autoFilter = { from: "A1", to: estratti.length > 1 ? "I1" : "H1" };

  const riep = wb.addWorksheet("Riepilogo");
  const e = r.estratto;
  const entrate = e.movimenti.filter((m) => m.importo > 0).reduce((s, m) => s + m.importo, 0);
  const uscite = e.movimenti.filter((m) => m.importo < 0).reduce((s, m) => s + m.importo, 0);
  riep.addRows([
    ["Banca", e.banca ?? ""],
    ["Intestatario", e.intestatario ?? ""],
    ["IBAN", e.iban ?? ""],
    ["Periodo", `${formatData(e.periodoDa)} - ${formatData(e.periodoA)}`],
    ["Saldo iniziale", e.saldoIniziale],
    ["Totale entrate", entrate],
    ["Totale uscite", uscite],
    ["Saldo finale", e.saldoFinale],
    ["Controllo saldi", e.controlloSaldi.eseguito ? (e.controlloSaldi.quadra ? "OK" : `Differenza ${csvNumero(e.controlloSaldi.differenza)}`) : "Non eseguito"],
    ["Movimenti", e.movimenti.length],
    ["Fatture pagate", `${r.fatture.filter((f) => statoFattura(f, r.abbinamenti).stato === "pagata").length} su ${r.fatture.length}`],
  ]);
  riep.getColumn(1).font = { bold: true };
  riep.getColumn(1).width = 20;
  riep.getColumn(2).width = 40;
  for (const i of [5, 6, 7, 8]) riep.getCell(`B${i}`).numFmt = euro;

  if (estratti.length > 1) {
    const es = wb.addWorksheet("Estratti");
    es.columns = [
      { header: "Estratto", key: "nome", width: 40 },
      { header: "Intestatario", key: "int", width: 30 },
      { header: "IBAN", key: "iban", width: 30 },
      { header: "Saldo iniziale", key: "si", width: 15, style: { numFmt: euro } },
      { header: "Saldo finale", key: "sf", width: 15, style: { numFmt: euro } },
      { header: "Movimenti", key: "n", width: 11 },
      { header: "Controllo saldi", key: "ok", width: 18 },
    ];
    es.getRow(1).font = { bold: true };
    for (const x of estratti)
      es.addRow({
        nome: etichettaEstratto(x),
        int: x.intestatario ?? "",
        iban: x.iban ?? "",
        si: x.saldoIniziale,
        sf: x.saldoFinale,
        n: x.movimenti.length,
        ok: x.controlloSaldi.eseguito ? (x.controlloSaldi.quadra ? "OK" : `Differenza ${csvNumero(x.controlloSaldi.differenza)}`) : "Non eseguito",
      });
  }

  const per = new Map<string, number>();
  for (const m of e.movimenti) per.set(m.categoria, (per.get(m.categoria) ?? 0) + m.importo);
  const cat = wb.addWorksheet("Per categoria");
  cat.columns = [
    { header: "Categoria", key: "c", width: 30 },
    { header: "Totale", key: "t", width: 16, style: { numFmt: euro } },
  ];
  cat.getRow(1).font = { bold: true };
  [...per.entries()].sort((a, b) => a[1] - b[1]).forEach(([c, t]) => cat.addRow({ c, t }));

  if (r.fatture.length) {
    const fw = wb.addWorksheet("Fatture");
    fw.columns = [
      { header: "Numero", key: "numero", width: 14 },
      { header: "Data", key: "data", width: 12, style: { numFmt: "dd/mm/yyyy" } },
      { header: "Tipo", key: "tipo", width: 12 },
      { header: "Controparte", key: "controparte", width: 36 },
      { header: "Totale", key: "totale", width: 14, style: { numFmt: euro } },
      { header: "Stato", key: "stato", width: 16 },
      { header: "Pagato", key: "pagato", width: 14, style: { numFmt: euro } },
      { header: "Residuo", key: "residuo", width: 14, style: { numFmt: euro } },
      { header: "Movimenti", key: "mov", width: 60 },
    ];
    fw.getRow(1).font = { bold: true };
    const etichetta = { pagata: "Pagata", parziale: "Pagata in parte", aperta: "Da incassare/pagare" };
    for (const f of r.fatture) {
      const s = statoFattura(f, r.abbinamenti);
      const movs = r.abbinamenti
        .filter((x) => x.fatturaId === f.id)
        .map((a) => e.movimenti.find((x) => x.id === a.movimentoId))
        .filter((m): m is NonNullable<typeof m> => Boolean(m));
      fw.addRow({
        numero: f.numero,
        data: d(f.data),
        tipo: f.tipo,
        controparte: f.tipo === "attiva" ? f.cessionario : f.cedente,
        totale: f.totale,
        stato: etichetta[s.stato],
        pagato: s.pagato,
        residuo: s.residuo,
        mov: movs.map((m) => `${formatData(m.data)} ${m.descrizione}`).join(" | "),
      });
    }
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}

export { OPZIONI_GESTIONALE, type OpzioniGestionale } from "./esportazione-opzioni";

function dataIn(iso: string | null, formato: OpzioniGestionale["formatoData"]) {
  if (!iso) return "";
  const [a, m, g] = iso.split("-");
  return { "gg/mm/aaaa": `${g}/${m}/${a}`, "aaaa-mm-gg": iso, "gg-mm-aaaa": `${g}-${m}-${a}`, ggmmaaaa: `${g}${m}${a}` }[formato];
}

export function csvGestionale(r: Risultato, o: OpzioniGestionale): string {
  const sep = o.separatore;
  const campo = (v: string) => (v.includes(sep) || /["\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const num = (n: number | null) => (n === null ? "" : n.toFixed(2).replace(".", o.decimale));
  const conto = (categoria: string) => o.conti[categoria]?.trim() || categoria;
  const righe: string[][] = [];
  if (o.tracciato === "primanota") {
    if (o.intestazione) righe.push(["Data", "Data valuta", "Conto dare", "Conto avere", "Importo", "Descrizione", "Documento"]);
    for (const m of r.estratto.movimenti) {
      const entrata = m.importo > 0;
      righe.push([
        dataIn(m.data, o.formatoData),
        dataIn(m.dataValuta, o.formatoData),
        entrata ? o.contoBanca : conto(m.categoria),
        entrata ? conto(m.categoria) : o.contoBanca,
        num(Math.abs(m.importo)),
        m.descrizione,
        fatturaPer(r, m.id),
      ]);
    }
  } else {
    if (o.intestazione) righe.push(["Data", "Data valuta", "Descrizione", "Importo", "Conto", "Categoria", "Documento"]);
    for (const m of r.estratto.movimenti)
      righe.push([dataIn(m.data, o.formatoData), dataIn(m.dataValuta, o.formatoData), m.descrizione, num(m.importo), conto(m.categoria), m.categoria, fatturaPer(r, m.id)]);
  }
  return "\ufeff" + righe.map((x) => x.map(campo).join(sep)).join("\r\n");
}
