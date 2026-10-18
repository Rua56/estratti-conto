import { createHmac, timingSafeEqual } from "node:crypto";

// Prove gratuite e abbonamento Stripe, senza database.
// - Le prove gratuite si contano in un cookie firmato che si azzera ogni mese.
// - Dopo il pagamento il browser riceve un cookie firmato con l'id dell'abbonamento Stripe. Lo stesso valore è il
//   "codice di accesso" che lo studio può incollare su un altro computer. Lo stato dell'abbonamento si chiede a Stripe.

export const ABBONAMENTO = { nome: "Studio", centesimi: 2900, descrizione: "Conversioni illimitate (uso ragionevole), tutte le esportazioni, più estratti insieme." };
export const GRATIS_AL_MESE = 3;
export const COOKIE_ACCESSO = "ec_accesso";
export const COOKIE_GRATIS = "ec_gratis";
const ANNO = 365 * 86_400;

export const pagamentiAttivi = () => Boolean(process.env.STRIPE_SECRET_KEY);

function segreto(): string {
  const base = process.env.ACCESSO_SECRET || process.env.STRIPE_SECRET_KEY;
  if (!base) throw new Error("Manca ACCESSO_SECRET");
  return createHmac("sha256", "estratti-conto").update(base).digest("hex");
}

const firma = (dato: string) => createHmac("sha256", segreto()).update(dato).digest("base64url").slice(0, 32);

export const firmato = (dato: string) => `${dato}.${firma(dato)}`;

export function verificato(valore: string | undefined | null): string | null {
  if (!valore) return null;
  const i = valore.lastIndexOf(".");
  if (i < 0) return null;
  const dato = valore.slice(0, i);
  const a = Buffer.from(valore.slice(i + 1));
  const b = Buffer.from(firma(dato));
  return a.length === b.length && timingSafeEqual(a, b) ? dato : null;
}

export function leggiCookie(req: Request, nome: string): string | undefined {
  for (const parte of (req.headers.get("cookie") ?? "").split(";")) {
    const [k, ...v] = parte.trim().split("=");
    if (k === nome) return decodeURIComponent(v.join("="));
  }
}

export const cookie = (nome: string, valore: string, secondi = ANNO) =>
  `${nome}=${encodeURIComponent(valore)}; Path=/; Max-Age=${secondi}; HttpOnly; Secure; SameSite=Lax`;

const meseCorrente = () => new Date().toISOString().slice(0, 7);

export function gratisUsate(req: Request): number {
  const [mese, n] = (verificato(leggiCookie(req, COOKIE_GRATIS)) ?? "").split(":");
  return mese === meseCorrente() ? Number(n) || 0 : 0;
}

export const cookieGratis = (usate: number) => cookie(COOKIE_GRATIS, firmato(`${meseCorrente()}:${usate}`), 40 * 86_400);

async function stripe(percorso: string, corpo?: URLSearchParams) {
  const res = await fetch(`https://api.stripe.com/v1/${percorso}`, {
    method: corpo ? "POST" : "GET",
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
    body: corpo,
  });
  const dati = await res.json();
  if (!res.ok) throw new Error(dati?.error?.message ?? `Stripe ${res.status}`);
  return dati;
}

// Stato degli abbonamenti già chiesti a Stripe, per non interrogarlo a ogni conversione.
const cache = new Map<string, { attivo: boolean; cliente: string | null; scade: number }>();

export async function abbonamento(subId: string): Promise<{ attivo: boolean; cliente: string | null }> {
  if (!/^sub_[A-Za-z0-9]+$/.test(subId) || !pagamentiAttivi()) return { attivo: false, cliente: null };
  const c = cache.get(subId);
  if (c && c.scade > Date.now()) return c;
  const s = await stripe(`subscriptions/${subId}`);
  const stato = { attivo: ["active", "trialing", "past_due"].includes(s.status), cliente: typeof s.customer === "string" ? s.customer : null };
  cache.set(subId, { ...stato, scade: Date.now() + 10 * 60_000 });
  return stato;
}

/** Id dell'abbonamento del browser, se il cookie (o un codice incollato) è valido. Non controlla Stripe. */
export const subDaCodice = (codice: string | undefined | null) => verificato(codice?.trim());
export const subDelBrowser = (req: Request) => subDaCodice(leggiCookie(req, COOKIE_ACCESSO));

export async function abbonato(req: Request): Promise<boolean> {
  const sub = subDelBrowser(req);
  if (!sub) return false;
  try {
    return (await abbonamento(sub)).attivo;
  } catch (e) {
    console.error("Verifica abbonamento non riuscita", e);
    return true; // Stripe non risponde: non blocchiamo chi ha un codice firmato valido
  }
}

export async function creaCheckout(origine: string, email?: string): Promise<string> {
  const corpo = new URLSearchParams({
    mode: "subscription",
    locale: "it",
    success_url: `${origine}/api/abbonamento?sid={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origine}/?abbonamento=annullato#prezzi`,
    allow_promotion_codes: "true",
    billing_address_collection: "required",
    "tax_id_collection[enabled]": "true",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][unit_amount]": String(ABBONAMENTO.centesimi),
    "line_items[0][price_data][recurring][interval]": "month",
    "line_items[0][price_data][product_data][name]": `Estratti Conto · ${ABBONAMENTO.nome}`,
    "line_items[0][price_data][product_data][description]": ABBONAMENTO.descrizione,
    "metadata[app]": "estratti-conto",
    "subscription_data[metadata][app]": "estratti-conto",
  });
  if (email) corpo.set("customer_email", email);
  return (await stripe("checkout/sessions", corpo)).url;
}

/** Id dell'abbonamento creato da una sessione di checkout completata. */
export async function subDaSessione(sid: string): Promise<string | null> {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sid)) return null;
  const s = await stripe(`checkout/sessions/${sid}`);
  if (s.status !== "complete" || s.metadata?.app !== "estratti-conto" || typeof s.subscription !== "string") return null;
  return s.subscription;
}

export async function portaleClienti(subId: string, ritorno: string): Promise<string> {
  const { cliente } = await abbonamento(subId);
  if (!cliente) throw new Error("Abbonamento non trovato");
  const corpo = new URLSearchParams({ customer: cliente, return_url: ritorno, locale: "it" });
  return (await stripe("billing_portal/sessions", corpo)).url;
}
