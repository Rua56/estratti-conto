import { NextResponse } from "next/server";
import { portaleClienti, subDelBrowser } from "../../../lib/accesso";

export const runtime = "nodejs";

// Portale Stripe per fatture, carta e disdetta.
export async function POST(req: Request) {
  const sub = subDelBrowser(req);
  if (!sub) return NextResponse.json({ errore: "Nessun abbonamento su questo browser." }, { status: 401 });
  try {
    return NextResponse.json({ url: await portaleClienti(sub, `${new URL(req.url).origin}/`) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ errore: "Il portale non è disponibile. Scrivi a iuran56@gmail.com per fatture o disdetta." }, { status: 502 });
  }
}
