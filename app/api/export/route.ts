import { csvMovimenti, csvPrimaNota, excel } from "../../../lib/esportazione";
import type { Risultato } from "../../../lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { formato, risultato } = (await req.json()) as { formato: "xlsx" | "csv" | "primanota"; risultato: Risultato };
  const nome = `estratto-${risultato.estratto.periodoDa ?? "conto"}`;

  if (formato === "xlsx") {
    return new Response(new Uint8Array(await excel(risultato)), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nome}.xlsx"`,
      },
    });
  }
  const csv = formato === "primanota" ? csvPrimaNota(risultato) : csvMovimenti(risultato);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nome}${formato === "primanota" ? "-prima-nota" : ""}.csv"`,
    },
  });
}
