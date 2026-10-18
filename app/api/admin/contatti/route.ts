import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { elenco } from "../../../../lib/contatti";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function autorizzato(req: Request) {
  const atteso = process.env.ADMIN_KEY;
  const dato = req.headers.get("x-chiave") ?? "";
  return Boolean(atteso) && dato.length === atteso!.length && timingSafeEqual(Buffer.from(dato), Buffer.from(atteso!));
}

export async function GET(req: Request) {
  if (!autorizzato(req)) return NextResponse.json({ errore: "Chiave non valida." }, { status: 401 });
  return NextResponse.json({ contatti: await elenco() });
}
