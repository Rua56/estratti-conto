export type Movimento = {
  id: string;
  data: string; // data contabile, YYYY-MM-DD
  dataValuta: string | null; // YYYY-MM-DD
  descrizione: string;
  importo: number; // positivo = entrata, negativo = uscita
  saldo: number | null;
  categoria: string;
  affidabilita: number; // 0-1
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
};

export type Risultato = {
  estratto: Estratto;
  fatture: Fattura[];
  abbinamenti: Abbinamento[];
};
