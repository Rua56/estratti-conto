// Esportazione per i gestionali: separatori, formato data, codici conto e colonne a scelta dello studio.
export type OpzioniGestionale = {
  tracciato: "primanota" | "movimenti"; // dare/avere oppure un importo con segno
  separatore: ";" | "," | "\t";
  decimale: "," | ".";
  formatoData: "gg/mm/aaaa" | "aaaa-mm-gg" | "gg-mm-aaaa" | "ggmmaaaa";
  intestazione: boolean;
  contoBanca: string;
  conti: Record<string, string>; // categoria -> codice del piano dei conti
};

export const OPZIONI_GESTIONALE: OpzioniGestionale = {
  tracciato: "primanota",
  separatore: ";",
  decimale: ",",
  formatoData: "gg/mm/aaaa",
  intestazione: true,
  contoBanca: "Banca c/c",
  conti: {},
};

