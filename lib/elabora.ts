import { aiDisponibile, estraiConAi } from "./estrazione-ai";
import { estraiConRegole } from "./estrazione-regole";
import { leggiFatturaPA } from "./fatturapa";
import { formatImporto } from "./numeri";
import { controllaSaldi, riconcilia } from "./riconciliazione";
import type { Estratto, Fattura, Risultato } from "./types";

export type Input = {
  pdf: Uint8Array;
  fatture: { nome: string; xml: string }[];
  pivaCliente?: string;
  forzaRegole?: boolean;
};

export async function elabora(input: Input): Promise<Risultato & { avvisi: string[] }> {
  const avvisi: string[] = [];
  let base: Omit<Estratto, "controlloSaldi">;

  if (aiDisponibile() && !input.forzaRegole) {
    try {
      base = await estraiConAi(input.pdf);
    } catch (e) {
      console.error("Lettura AI fallita, passo alle regole:", e);
      base = await estraiConRegole(input.pdf);
      avvisi.push("Lettura AI non riuscita: risultato ottenuto con il riconoscimento a regole.");
    }
  } else {
    base = await estraiConRegole(input.pdf);
    if (!aiDisponibile() && !input.forzaRegole) avvisi.push("Lettura AI non configurata: uso il riconoscimento a regole (solo PDF digitali, non scansioni).");
  }
  if (!base.movimenti.length) avvisi.push("Nessun movimento trovato. Il PDF potrebbe essere una scansione o un formato non ancora supportato.");

  const estratto: Estratto = { ...base, controlloSaldi: controllaSaldi(base) };
  const { eseguito, quadra, differenza, righeSospette } = estratto.controlloSaldi;
  if (eseguito && !quadra)
    avvisi.push(`I saldi non quadrano (differenza ${formatImporto(differenza ?? 0)} €): controlla i movimenti evidenziati.`);
  if (righeSospette.length)
    avvisi.push(`Su ${righeSospette.length === 1 ? "un movimento" : `${righeSospette.length} movimenti`} il saldo progressivo stampato dalla banca non torna: sono evidenziati in tabella.`);
  if (!eseguito && base.movimenti.length) avvisi.push("Saldo iniziale o finale non trovato: controllo dei saldi non eseguito.");

  const fatture: Fattura[] = [];
  for (const f of input.fatture) {
    try {
      fatture.push(...leggiFatturaPA(f.xml, f.nome, input.pivaCliente));
    } catch (e) {
      avvisi.push((e as Error).message);
    }
  }

  return { estratto, fatture, abbinamenti: riconcilia(estratto.movimenti, fatture), avvisi };
}
