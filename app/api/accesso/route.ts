import { NextResponse } from "next/server";
import { COOKIE_ACCESSO, GRATIS_AL_MESE, abbonamento, cookie, gratisUsate, leggiCookie, pagamentiAttivi, subDaCodice } from "../../../lib/accesso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stato dell'accesso del browser: prove gratuite rimaste o abbonamento attivo.
export async function GET(req: Request) {
  const pagamenti = pagamentiAttivi();
  const codice = leggiCookie(req, COOKIE_ACCESSO);
  const sub = pagamenti ? subDaCodice(codice) : null;
  let attivo = false;
  if (sub) attivo = await abbonamento(sub).then((a) => a.attivo).catch(() => true);
  return NextResponse.json({
    pagamenti,
    abbonato: attivo,
    codice: attivo ? codice : null,
    gratisAlMese: GRATIS_AL_MESE,
    gratisRimaste: Math.max(0, GRATIS_AL_MESE - gratisUsate(req)),
  });
}

// Attiva l'abbonamento su questo browser con il codice di accesso ricevuto dopo il pagamento.
export async function POST(req: Request) {
  const { codice } = (await req.json().catch(() => ({}))) as { codice?: string };
  const sub = subDaCodice(codice);
  if (!sub) return NextResponse.json({ errore: "Codice non valido. Copialo per intero dalla pagina dell'abbonamento." }, { status: 400 });
  const { attivo } = await abbonamento(sub).catch(() => ({ attivo: false }));
  if (!attivo) return NextResponse.json({ errore: "Questo abbonamento non è attivo." }, { status: 402 });
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", cookie(COOKIE_ACCESSO, codice!.trim()));
  return res;
}

// Esci dall'abbonamento su questo browser.
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.headers.append("Set-Cookie", cookie(COOKIE_ACCESSO, "", 0));
  return res;
}
