export type Movimento = {
  id: string;
  data: string; // data contabile, YYYY-MM-DD
  dataValuta: string | null; // YYYY-MM-DD
  descrizione: string;
  importo: number; // positivo = entrata, negativo = uscita
  saldo: number | null;
  categoria: string;
  affidabilita: number; // 0-1
  conto?: string; // banca/IBAN di provenienza quando si uniscono più estratti
};

export type Estratto = {
  banca: string | null;
  intestatario: string | null;
  iban: string | null;
  periodoDa: string | null;
  periodoA: string | null;
  saldoIniziale: number | null;
  saldoFinale: number | null;
  movimenti: Movimento[];
  metodo: "ai" | "regole";
  controlloSaldi: ControlloSaldi;
};

export type ControlloSaldi = {
  eseguito: boolean;
  quadra: boolean;
  differenza: number | null;
  /** Movimenti dopo i quali il saldo progressivo stampato non torna. */
  righeSospette: string[];
};

export type Fattura = {
  id: string;
  file: string;
  numero: string;
  data: string; // YYYY-MM-DD
  tipo: "attiva" | "passiva" | "sconosciuta";
  cedente: string;
  cedentePiva: string | null;
  cessionario: string;
  cessionarioPiva: string | null;
  totale: number;
  scadenze: { data: string | null; importo: number }[];
};

export type Abbinamento = {
  movimentoId: string;
  fatturaId: string;
  punteggio: number; // 0-1
  motivi: string[];
  importo: number; // quota della fattura coperta da questo movimento
  parziale: boolean; // acconto o pagamento parziale
};

export type StatoFattura = { stato: "pagata" | "parziale" | "aperta"; pagato: number; residuo: number };

export type Risultato = {
  estratto: Estratto;
  fatture: Fattura[];
  abbinamenti: Abbinamento[];
};
