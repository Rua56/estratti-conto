import { NextResponse } from "next/server";
import { COOKIE_ACCESSO, cookie, creaCheckout, firmato, pagamentiAttivi, subDaSessione } from "../../../lib/accesso";

export const runtime = "nodejs";

const origine = (req: Request) => new URL(req.url).origin;

// Avvia il pagamento dell'abbonamento su Stripe Checkout.
export async function POST(req: Request) {
  if (!pagamentiAttivi()) return NextResponse.json({ errore: "Gli abbonamenti non sono ancora attivi." }, { status: 503 });
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  try {
    const url = await creaCheckout(origine(req), typeof email === "string" && /^\S+@\S+\.\S+$/.test(email) ? email : undefined);
    return NextResponse.json({ url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ errore: "Non riesco ad aprire il pagamento. Riprova tra poco." }, { status: 502 });
  }
}

// Ritorno da Stripe dopo il pagamento: salva il codice di accesso nel browser.
export async function GET(req: Request) {
  const sid = new URL(req.url).searchParams.get("sid") ?? "";
  try {
    const sub = await subDaSessione(sid);
    if (!sub) return NextResponse.redirect(`${origine(req)}/?abbonamento=errore#prezzi`, 303);
    const res = NextResponse.redirect(`${origine(req)}/?abbonamento=attivo`, 303);
    res.headers.append("Set-Cookie", cookie(COOKIE_ACCESSO, firmato(sub)));
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.redirect(`${origine(req)}/?abbonamento=errore#prezzi`, 303);
  }
}
