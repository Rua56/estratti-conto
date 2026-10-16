import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { elabora } from "../../../lib/elabora";
import { contaPagine } from "../../../lib/estrazione-regole";
import { HASH_ESEMPIO, LIMITI } from "../../../lib/limiti";

export const runtime = "nodejs";
export const maxDuration = 300;

// Limite d'uso per indirizzo IP. In memoria: vale per singola istanza, basta a frenare gli abusi
// finché non ci sono account e abbonamenti.
const usi = new Map<string, number[]>();
function troppeRichieste(ip: string): boolean {
  const ora = Date.now();
  const recenti = (usi.get(ip) ?? []).filter((t) => ora - t < 3_600_000);
  if (recenti.length >= LIMITI.conversioniOra) return true;
  recenti.push(ora);
  usi.set(ip, recenti);
  return false;
}

const errore = (msg: string, status = 400) => NextResponse.json({ errore: msg }, { status });

// I file vengono elaborati in memoria e non vengono salvati.
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return errore(`File troppo grandi: il totale deve restare sotto ${LIMITI.mbTotali} MB.`, 413);
  }
  const pdf = form.get("pdf");
  if (!(pdf instanceof File)) return errore("Carica un estratto conto in PDF.");
  if (pdf.size > LIMITI.mbTotali * 1024 * 1024) return errore(`Il PDF supera ${LIMITI.mbTotali} MB.`, 413);

  const bytes = new Uint8Array(await pdf.arrayBuffer());
  if (String.fromCharCode(...bytes.slice(0, 4)) !== "%PDF") return errore("Il file non è un PDF.");

  const esempio = createHash("sha256").update(bytes).digest("hex") === HASH_ESEMPIO;

  let pagine: number;
  try {
    pagine = await contaPagine(bytes);
  } catch {
    return errore("Il PDF è danneggiato o protetto da password.");
  }
  if (pagine > LIMITI.pagine) return errore(`L'estratto ha ${pagine} pagine: il massimo è ${LIMITI.pagine}. Dividilo in più file.`);

  if (!esempio) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "sconosciuto";
    if (troppeRichieste(ip)) return errore("Hai raggiunto il limite di conversioni per quest'ora. Riprova più tardi.", 429);
  }

  const fatture = await Promise.all(
    form
      .getAll("fatture")
      .filter((f): f is File => f instanceof File && f.size > 0)
      .slice(0, LIMITI.fatture)
      .map(async (f) => ({ nome: f.name, xml: await f.text() })),
  );

  try {
    const risultato = await elabora({
      pdf: bytes,
      fatture,
      pivaCliente: String(form.get("piva") ?? "").trim() || undefined,
      // L'esempio è un PDF digitale che le regole leggono perfettamente: niente costi AI.
      forzaRegole: esempio,
    });
    if (esempio) risultato.avvisi.unshift("Esempio con dati inventati: carica un tuo estratto conto per provarlo sul serio.");
    return NextResponse.json(risultato);
  } catch (e) {
    console.error(e);
    return errore("Non sono riuscito a leggere questo estratto conto. Riprova o scrivici se il problema continua.", 500);
  }
}
