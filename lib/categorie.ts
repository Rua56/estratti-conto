// Piano dei conti semplificato. Lo studio potrà sostituirlo con il proprio.
export const CATEGORIE = [
  "Incassi da clienti",
  "Pagamenti a fornitori",
  "Stipendi e compensi",
  "F24 imposte e contributi",
  "Consulenze professionali",
  "Utenze",
  "Affitti e locazioni",
  "Assicurazioni",
  "Carburante e trasporti",
  "Viaggi, vitto e alloggio",
  "Abbonamenti e software",
  "Commissioni e spese bancarie",
  "Interessi",
  "Finanziamenti e mutui",
  "Carte di pagamento",
  "Prelievi contanti",
  "Versamenti",
  "Giroconti",
  "Altro",
] as const;

export type Categoria = (typeof CATEGORIE)[number];

/** Indicazioni per l'AI, una riga per categoria dove serve chiarire il confine. */
export const GUIDA_CATEGORIE = `- Incassi da clienti: bonifici ricevuti per vendite o prestazioni.
- Pagamenti a fornitori: acquisti di merci, materiali e servizi non elencati sotto.
- Consulenze professionali: commercialista, notaio, avvocato, consulente del lavoro.
- Assicurazioni: premi di polizze (RCA, incendio, RC professionale), anche se riferite a veicoli.
- Carburante e trasporti: carburante, pedaggi, Telepass, parcheggi, treni, noleggio veicoli.
- Viaggi, vitto e alloggio: ristoranti, bar, autogrill, hotel e trasferte.
- Abbonamenti e software: hosting, domini, PEC, licenze e servizi in abbonamento.
- Commissioni e spese bancarie: commissioni, canoni del conto, imposta di bollo.
- Carte di pagamento: addebito riepilogativo della carta di credito, o pagamenti POS di natura non riconoscibile.
- Giroconti: trasferimenti tra conti dello stesso intestatario.`;

const PAROLE_USCITA: [RegExp, Categoria][] = [
  [/\bF24\b|DELEGA UNIFICATA|AGENZIA (DELLE )?ENTRATE|\bINPS\b|\bINAIL\b/i, "F24 imposte e contributi"],
  [/STIPEND|EMOLUMENT|CEDOLINO|TREDICESIMA|\bTFR\b/i, "Stipendi e compensi"],
  [/COMMERCIALIST|NOTAI|AVVOCAT|STUDIO LEGALE|CONSULEN|PARCELLA|COMPETENZE PROFESSION/i, "Consulenze professionali"],
  [/ASSICURAZ|POLIZZA|UNIPOL|GENERALI|ALLIANZ|\bAXA\b|REALE MUTUA|ZURICH|CATTOLICA ASS|VITTORIA ASS|GROUPAMA/i, "Assicurazioni"],
  [/AFFITTO|CANONE LOCAZ|LOCAZIONE|PIGIONE/i, "Affitti e locazioni"],
  [/\bENEL\b|PLENITUDE|\bA2A\b|\bHERA\b|\bIREN\b|\bACEA\b|EDISON|SORGENIA|\bTIM\b|VODAFONE|WINDTRE|\bWIND\b|FASTWEB|ILIAD|\bGAS\b|\bLUCE\b|ACQUEDOTTO|SERVIZIO IDRICO/i, "Utenze"],
  [/RATA (MUTUO|FINANZ|PRESTITO)|MUTUO|FINANZIAMENTO|LEASING/i, "Finanziamenti e mutui"],
  [/COMMISSION|SPESE (TENUTA|CONTO|BONIFICO|INCASSO)|CANONE (CONTO|MENSILE)|IMPOSTA DI BOLLO|\bBOLLO\b|COMPETENZE DI CHIUSURA/i, "Commissioni e spese bancarie"],
  [/CARBURANT|\bQ8\b|TAMOIL|\bESSO\b|\bENI\b|AGIP|\bIP\b|\bAPI\b|SHELL|TOTALERG|AUTOSTRAD|TELEPASS|PEDAGGI|PARCHEGG|TRENITALIA|\bITALO\b|NOLEGGIO AUTO/i, "Carburante e trasporti"],
  [/AUTOGRILL|RISTORANT|PIZZERI|TRATTORIA|\bBAR\b|CAFFE|HOTEL|ALBERGO|B&B|BOOKING\.COM|AIRBNB|RYANAIR|EASYJET|ITA AIRWAYS|ALITALIA/i, "Viaggi, vitto e alloggio"],
  [/GOOGLE|MICROSOFT|ADOBE|AMAZON WEB|\bAWS\b|ARUBA|REGISTER\.IT|SHOPIFY|APPLE\.COM|DROPBOX|ZOOM|ABBONAMENTO|\bPEC\b/i, "Abbonamenti e software"],
  [/PRELIEVO|PRELEV|BANCOMAT ATM|\bATM\b/i, "Prelievi contanti"],
  [/GIROCONTO|GIRO CONTO|GIROFONDI/i, "Giroconti"],
  [/ESTRATTO CONTO CARTA|SALDO CARTA|ADDEBITO CARTA DI CREDITO|NEXI|AMERICAN EXPRESS|AMEX/i, "Carte di pagamento"],
];

const PAROLE_ENTRATA: [RegExp, Categoria][] = [
  [/INTERESS/i, "Interessi"],
  [/VERSAMENTO|VERS\.|VERS CONTANTI/i, "Versamenti"],
  [/GIROCONTO|GIRO CONTO|GIROFONDI/i, "Giroconti"],
  [/EROGAZIONE (MUTUO|FINANZ|PRESTITO)/i, "Finanziamenti e mutui"],
  [/RIMBORSO (IVA|IMPOSTE)|AGENZIA (DELLE )?ENTRATE/i, "F24 imposte e contributi"],
];

export function categoriaDaRegole(descrizione: string, importo: number): Categoria {
  if (importo >= 0) {
    for (const [re, cat] of PAROLE_ENTRATA) if (re.test(descrizione)) return cat;
    return /BONIFICO|BON\.|SEPA|ACCREDITO|INCASSO|RIBA|\bSDD\b/i.test(descrizione) ? "Incassi da clienti" : "Altro";
  }
  if (/INTERESSI DEBITORI|INTERESSI PASSIVI/i.test(descrizione)) return "Interessi";
  for (const [re, cat] of PAROLE_USCITA) if (re.test(descrizione)) return cat;
  if (/BONIFICO|BON\.|SEPA|\bSDD\b|\bRID\b|ADDEBITO DIRETTO/i.test(descrizione)) return "Pagamenti a fornitori";
  if (/\bPOS\b|CARTA|APPLE PAY|GOOGLE PAY/i.test(descrizione)) return "Carte di pagamento";
  return "Altro";
}
