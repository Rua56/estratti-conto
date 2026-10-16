// Piano dei conti semplificato. Lo studio potrà sostituirlo con il proprio.
export const CATEGORIE = [
  "Incassi da clienti",
  "Pagamenti a fornitori",
  "Stipendi e compensi",
  "F24 imposte e contributi",
  "Utenze",
  "Affitti e locazioni",
  "Carburante e trasporti",
  "Commissioni e spese bancarie",
  "Interessi",
  "Finanziamenti e mutui",
  "Carte di pagamento",
  "Prelievi contanti",
  "Versamenti",
  "Giroconti",
  "Abbonamenti e software",
  "Altro",
] as const;

export type Categoria = (typeof CATEGORIE)[number];

const REGOLE: [RegExp, Categoria][] = [
  [/\bF24\b|DELEGA UNIFICATA|AGENZIA (DELLE )?ENTRATE|INPS|INAIL/i, "F24 imposte e contributi"],
  [/STIPEND|EMOLUMENT|CEDOLINO|COMPENSI/i, "Stipendi e compensi"],
  [/ENEL|ENI PLENITUDE|A2A|HERA|IREN|ACEA|EDISON|SORGENIA|TIM\b|VODAFONE|WIND|FASTWEB|ILIAD|GAS|LUCE|ACQUA/i, "Utenze"],
  [/AFFITTO|CANONE LOCAZ|LOCAZIONE/i, "Affitti e locazioni"],
  [/CARBURANT|Q8|TAMOIL|ESSO|IP\s|AUTOSTRAD|TELEPASS|TRENITALIA|ITALO/i, "Carburante e trasporti"],
  [/COMMISSION|SPESE (TENUTA|CONTO|BONIFICO)|CANONE (CONTO|MENSILE)|IMPOSTA DI BOLLO|BOLLO/i, "Commissioni e spese bancarie"],
  [/INTERESS/i, "Interessi"],
  [/RATA (MUTUO|FINANZ|PRESTITO)|MUTUO|FINANZIAMENTO|LEASING/i, "Finanziamenti e mutui"],
  [/PRELIEVO|PRELEV|BANCOMAT ATM|\bATM\b/i, "Prelievi contanti"],
  [/VERSAMENTO|VERS\./i, "Versamenti"],
  [/GIROCONTO|GIRO CONTO/i, "Giroconti"],
  [/GOOGLE|MICROSOFT|ADOBE|AMAZON WEB|AWS|ARUBA|REGISTER\.IT|SHOPIFY|APPLE\.COM|ABBONAMENTO/i, "Abbonamenti e software"],
  [/CARTA|POS\b|PAGAMENTO POS|PAG\. POS|APPLE PAY|GOOGLE PAY/i, "Carte di pagamento"],
];

export function categoriaDaRegole(descrizione: string, importo: number): Categoria {
  for (const [re, cat] of REGOLE) if (re.test(descrizione)) return cat;
  if (/BONIFICO|BON\.|SEPA|SDD|RID|ADDEBITO DIRETTO/i.test(descrizione)) {
    return importo >= 0 ? "Incassi da clienti" : "Pagamenti a fornitori";
  }
  return "Altro";
}
