// Esportazione in Excel e CSV (formato italiano: separatore ";" e virgola decimale).
import ExcelJS from "exceljs";
import { formatData } from "./numeri";
import type { Risultato } from "./types";

const csvCampo = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const csvNumero = (n: number | null) => (n === null ? "" : n.toFixed(2).replace(".", ","));

function fatturaPer(r: Risultato, movimentoId: string) {
  const a = r.abbinamenti.find((x) => x.movimentoId === movimentoId);
  const f = a && r.fatture.find((x) => x.id === a.fatturaId);
  return f ? `${f.numero} del ${formatData(f.data)}` : "";
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

export async function excel(r: Risultato): Promise<Buffer> {
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
      verifica: m.affidabilita < 0.8 ? "Sì" : "",
    });
  }
  ws.autoFilter = { from: "A1", to: "H1" };

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
    ["Fatture abbinate", `${r.abbinamenti.length} su ${r.fatture.length}`],
  ]);
  riep.getColumn(1).font = { bold: true };
  riep.getColumn(1).width = 20;
  riep.getColumn(2).width = 40;
  for (const i of [5, 6, 7, 8]) riep.getCell(`B${i}`).numFmt = euro;

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
      { header: "Stato", key: "stato", width: 14 },
      { header: "Movimento", key: "mov", width: 60 },
    ];
    fw.getRow(1).font = { bold: true };
    for (const f of r.fatture) {
      const a = r.abbinamenti.find((x) => x.fatturaId === f.id);
      const m = a && e.movimenti.find((x) => x.id === a.movimentoId);
      fw.addRow({
        numero: f.numero,
        data: d(f.data),
        tipo: f.tipo,
        controparte: f.tipo === "attiva" ? f.cessionario : f.cedente,
        totale: f.totale,
        stato: m ? "Pagata" : "Da incassare/pagare",
        mov: m ? `${formatData(m.data)} ${m.descrizione}` : "",
      });
    }
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}
