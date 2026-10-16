// Estrazione con Claude: legge il PDF (anche scansioni) e restituisce i movimenti
// già categorizzati sul piano dei conti.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { CATEGORIE } from "./categorie";
import { arrotonda } from "./numeri";
import type { Estratto } from "./types";

const MODELLO = process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5";

const SchemaEstratto = z.object({
  banca: z.string().nullable(),
  intestatario: z.string().nullable(),
  iban: z.string().nullable(),
  periodo_da: z.string().nullable().describe("YYYY-MM-DD"),
  periodo_a: z.string().nullable().describe("YYYY-MM-DD"),
  saldo_iniziale: z.number().nullable(),
  saldo_finale: z.number().nullable(),
  movimenti: z.array(
    z.object({
      data: z.string().describe("Data contabile YYYY-MM-DD"),
      data_valuta: z.string().nullable().describe("YYYY-MM-DD"),
      descrizione: z.string().describe("Descrizione completa, comprese le righe successive"),
      importo: z.number().describe("Positivo per entrate (avere), negativo per uscite (dare)"),
      saldo: z.number().nullable(),
      categoria: z.enum(CATEGORIE),
      affidabilita: z.number().describe("Da 0 a 1: quanto sei sicuro di data, importo e segno"),
    }),
  ),
});

const ISTRUZIONI = `Sei un assistente per studi di commercialisti italiani. Ricevi un estratto conto bancario in PDF.
Estrai tutti i movimenti nell'ordine in cui compaiono, senza saltarne nessuno e senza includere righe di riepilogo, totali o saldi.
Unisci in un'unica descrizione le righe che continuano lo stesso movimento.
Il segno dell'importo deve rispettare la colonna: Dare/Uscite/Addebiti = negativo, Avere/Entrate/Accrediti = positivo.
Assegna a ogni movimento la categoria più adatta tra quelle ammesse; usa "Altro" se nessuna è chiara.
Se il documento non è un estratto conto, restituisci un elenco di movimenti vuoto.`;

export function aiDisponibile(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export async function estraiConAi(pdf: Uint8Array): Promise<Omit<Estratto, "controlloSaldi">> {
  const client = new Anthropic();
  // In streaming: con max_tokens alto l'SDK rifiuta le richieste non in streaming.
  const stream = client.beta.messages.stream({
    model: MODELLO,
    max_tokens: 32000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(SchemaEstratto) },
    system: ISTRUZIONI,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: Buffer.from(pdf).toString("base64") },
          },
          { type: "text", text: "Estrai i dati di questo estratto conto." },
        ],
      },
    ],
  });
  const risposta = await stream.finalMessage();

  if (risposta.stop_reason === "refusal") throw new Error("Il modello ha rifiutato di elaborare il documento.");
  if (risposta.stop_reason === "max_tokens") throw new Error("Documento troppo lungo: dividilo in più file.");
  const out = risposta.parsed_output;
  if (!out) throw new Error("Risposta AI non valida.");

  return {
    banca: out.banca,
    intestatario: out.intestatario,
    iban: out.iban,
    periodoDa: out.periodo_da,
    periodoA: out.periodo_a,
    saldoIniziale: out.saldo_iniziale,
    saldoFinale: out.saldo_finale,
    movimenti: out.movimenti.map((m, i) => ({
      id: `m${i + 1}`,
      data: m.data,
      dataValuta: m.data_valuta,
      descrizione: m.descrizione,
      importo: arrotonda(m.importo),
      saldo: m.saldo,
      categoria: m.categoria,
      affidabilita: Math.max(0, Math.min(1, m.affidabilita)),
    })),
    metodo: "ai",
  };
}
