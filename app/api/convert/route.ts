import { NextResponse } from "next/server";
import { elabora } from "../../../lib/elabora";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_MB = 20;

// I file vengono elaborati in memoria e non vengono salvati.
export async function POST(req: Request) {
  const form = await req.formData();
  const pdf = form.get("pdf");
  if (!(pdf instanceof File)) return NextResponse.json({ errore: "Carica un estratto conto in PDF." }, { status: 400 });
  if (pdf.size > MAX_MB * 1024 * 1024) return NextResponse.json({ errore: `Il PDF supera ${MAX_MB} MB.` }, { status: 400 });

  const bytes = new Uint8Array(await pdf.arrayBuffer());
  if (String.fromCharCode(...bytes.slice(0, 4)) !== "%PDF") return NextResponse.json({ errore: "Il file non è un PDF." }, { status: 400 });

  const fatture = await Promise.all(
    form
      .getAll("fatture")
      .filter((f): f is File => f instanceof File && f.size > 0)
      .map(async (f) => ({ nome: f.name, xml: await f.text() })),
  );

  try {
    const risultato = await elabora({
      pdf: bytes,
      fatture,
      pivaCliente: String(form.get("piva") ?? "").trim() || undefined,
    });
    return NextResponse.json(risultato);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ errore: (e as Error).message || "Errore durante l'elaborazione." }, { status: 500 });
  }
}
