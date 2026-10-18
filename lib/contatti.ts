import { randomUUID } from "node:crypto";
import { get, list, put } from "@vercel/blob";

// Contatti e segnalazioni dal sito, salvati come file JSON in un Blob store privato.

export type Contatto = {
  tipo: "interesse" | "segnalazione";
  data: string;
  email: string | null;
  studio: string | null;
  messaggio: string | null;
  banca: string | null;
  pagina: string | null;
};

const testo = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

export function pulisci(dati: Record<string, unknown>): Contatto | string {
  const tipo = dati.tipo === "segnalazione" ? "segnalazione" : "interesse";
  const email = testo(dati.email, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Controlla l'indirizzo email.";
  const messaggio = testo(dati.messaggio, 3000);
  if (tipo === "interesse" && !email) return "Scrivi la tua email.";
  if (tipo === "segnalazione" && !messaggio) return "Scrivi cosa non ha funzionato.";
  return {
    tipo,
    data: new Date().toISOString(),
    email,
    studio: testo(dati.studio, 200),
    messaggio,
    banca: testo(dati.banca, 120),
    pagina: testo(dati.pagina, 200),
  };
}

export async function salva(c: Contatto): Promise<void> {
  await put(`contatti/${c.data.replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}.json`, JSON.stringify(c), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

export async function elenco(limite = 500): Promise<Contatto[]> {
  const { blobs } = await list({ prefix: "contatti/", limit: limite });
  const tutti = await Promise.all(
    blobs.map(async (b) => {
      const r = await get(b.pathname, { access: "private" });
      return r ? (JSON.parse(await new Response(r.stream).text()) as Contatto) : null;
    }),
  );
  return tutti.filter((c): c is Contatto => Boolean(c)).sort((a, b) => b.data.localeCompare(a.data));
}
