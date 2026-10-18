import { OPZIONI_GESTIONALE, csvGestionale, csvMovimenti, csvPrimaNota, excel, type OpzioniGestionale } from "../../../lib/esportazione";
import { unisci } from "../../../lib/unisci";
import type { Risultato } from "../../../lib/types";

export const runtime = "nodejs";

type Richiesta = {
  formato: "xlsx" | "csv" | "primanota" | "gestionale";
  risultato?: Risultato;
  risultati?: Risultato[];
  opzioni?: Partial<OpzioniGestionale>;
};

export async function POST(req: Request) {
  const { formato, risultato, risultati, opzioni } = (await req.json()) as Richiesta;
  const elenco = risultati?.length ? risultati : risultato ? [risultato] : [];
  if (!elenco.length) return Response.json({ errore: "Niente da esportare." }, { status: 400 });
  const r = unisci(elenco);
  const nome = elenco.length > 1 ? `estratti-${r.estratto.periodoDa ?? "conto"}` : `estratto-${r.estratto.periodoDa ?? "conto"}`;

  if (formato === "xlsx") {
    return new Response(new Uint8Array(await excel(r, elenco.length > 1 ? elenco.map((x) => x.estratto) : [])), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nome}.xlsx"`,
      },
    });
  }
  const csv =
    formato === "gestionale"
      ? csvGestionale(r, { ...OPZIONI_GESTIONALE, ...opzioni, conti: { ...(opzioni?.conti ?? {}) } })
      : formato === "primanota"
        ? csvPrimaNota(r)
        : csvMovimenti(r);
  const suffisso = { gestionale: "-gestionale", primanota: "-prima-nota", csv: "" }[formato];
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nome}${suffisso}.csv"`,
    },
  });
}
