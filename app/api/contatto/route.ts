import { NextResponse } from "next/server";
import { pulisci, salva } from "../../../lib/contatti";

export const runtime = "nodejs";

const invii = new Map<string, number[]>();

export async function POST(req: Request) {
  const dati = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!dati) return NextResponse.json({ errore: "Richiesta non valida." }, { status: 400 });
  if (dati.sito) return NextResponse.json({ ok: true }); // campo trappola per i bot

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";
  const ora = Date.now();
  const recenti = (invii.get(ip) ?? []).filter((t) => ora - t < 3_600_000);
  if (recenti.length >= 10) return NextResponse.json({ errore: "Troppi invii, riprova più tardi." }, { status: 429 });
  invii.set(ip, [...recenti, ora]);

  const c = pulisci(dati);
  if (typeof c === "string") return NextResponse.json({ errore: c }, { status: 400 });
  try {
    await salva(c);
    console.log(JSON.stringify({ evento: "contatto", tipo: c.tipo }));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ errore: "Non sono riuscito a inviare. Scrivi a iuran56@gmail.com." }, { status: 500 });
  }
}
