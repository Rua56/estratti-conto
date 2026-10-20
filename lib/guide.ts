// Guide per commercialisti e studi contabili, una a settimana.
//
// Regole di scrittura:
// - Italiano semplice, per chi lavora in studio: lavoro manuale descritto in modo concreto, passo per passo.
// - 800-1300 parole, una parola chiave principale per articolo, nel titolo e nel primo paragrafo.
// - Niente statistiche inventate, testimonianze, promesse o integrazioni con gestionali specifici che non esistono.
// - Chiusura con un invito a provare il convertitore (link a /#converti).
// - Formato del testo: paragrafi separati da una riga vuota, "## " per i sottotitoli, "- " per gli elenchi.

export type Articolo = {
  slug: string;
  titolo: string;
  descrizione: string;
  parolaChiave: string;
  data: string; // AAAA-MM-GG
  testo: string;
};

export const ARTICOLI: Articolo[] = [
  {
    slug: "convertire-estratto-conto-pdf-in-excel",
    titolo: "Come convertire un estratto conto PDF in Excel senza ricopiare i movimenti",
    descrizione:
      "Perché copiare e incollare dal PDF della banca non funziona, cosa controllare in un foglio Excel di movimenti e come convertire un estratto conto PDF in Excel in un minuto, anche se è scansionato.",
    parolaChiave: "convertire estratto conto pdf in excel",
    data: "2026-10-20",
    testo: `Ogni mese, in quasi tutti gli studi, qualcuno apre l'estratto conto PDF di un cliente e lo trasforma a mano in qualcosa di utilizzabile: un foglio Excel, una prima nota, un elenco da confrontare con le fatture. Convertire un estratto conto PDF in Excel sembra un lavoro banale, ma chi lo fa sa quanto tempo porta via e quanti piccoli errori nasconde. In questa guida vediamo perché i metodi più comuni si inceppano, cosa deve avere un buon foglio di movimenti e come ottenerlo senza ribattere nulla.

## Perché il copia e incolla dal PDF non basta

Il primo tentativo è sempre lo stesso: si seleziona la tabella nel PDF, si copia e si incolla in Excel. Il risultato raramente è una tabella. Più spesso succede una di queste cose:

- tutto il testo finisce in una sola colonna, una riga dopo l'altra, e date, descrizioni e importi vanno separati a mano;
- le descrizioni su più righe (il bonifico con ordinante e causale, l'addebito SDD con il creditore e il riferimento del mandato) diventano righe separate che sembrano movimenti a sé;
- gli importi arrivano come testo, con il punto delle migliaia e la virgola dei decimali, e Excel non li somma o li interpreta come date;
- intestazioni, numeri di pagina, saldi riportati e note a piè di pagina si mescolano ai movimenti;
- con i PDF scansionati non c'è proprio nulla da copiare, perché la pagina è un'immagine.

Alla fine si passa più tempo a sistemare il foglio che a ricopiarlo da zero. Ed è qui che molti studi tornano alla soluzione più lenta: ribattere i movimenti uno per uno.

## Cosa fanno gli strumenti di conversione generici

Esistono convertitori da PDF a Excel generici, gratuiti o integrati nei programmi di lettura dei PDF. Funzionano bene con tabelle semplici, ma un estratto conto non è una tabella semplice. Ogni banca ha il suo impaginato: colonne Dare e Avere oppure Addebiti e Accrediti, data contabile e data valuta, saldo progressivo stampato su ogni riga oppure solo all'inizio e alla fine, riepiloghi affiancati, descrizioni che vanno a capo dentro la cella.

Un convertitore generico non sa che cosa sta leggendo. Ricostruisce le celle in base alla posizione del testo sulla pagina, e quando l'impaginato cambia anche di poco sposta un importo nella colonna sbagliata o spezza una riga a metà. Il problema è che il risultato sembra comunque un foglio ordinato, e l'errore si scopre solo quando i conti non tornano.

## Cosa deve avere un buon foglio di movimenti

Che il foglio Excel venga da un programma o da un collaboratore, prima di usarlo per la prima nota conviene verificare alcune cose:

- una riga per movimento, con la descrizione completa nella stessa cella anche quando nel PDF andava a capo;
- data contabile e, se serve, data valuta in due colonne distinte, in formato data vero e non come testo;
- importi come numeri, con il segno o con colonne separate per entrate e uscite, in modo da poterli sommare;
- saldo iniziale e saldo finale del periodo, per poter fare la quadratura;
- nessuna riga estranea: riporti, totali di pagina e intestazioni vanno esclusi.

Il controllo più importante è l'ultimo che si fa e il primo che si salta: saldo iniziale più entrate meno uscite deve dare esattamente il saldo finale stampato dalla banca. Se manca un centesimo, manca un movimento o un importo è stato letto male. Quando la banca stampa anche il saldo dopo ogni operazione, il controllo si può fare riga per riga e trovare subito il punto in cui qualcosa non torna.

## Convertire un estratto conto PDF in Excel con Estratti Conto

Estratti Conto nasce proprio per questo lavoro. Si carica il PDF dell'estratto conto, di qualsiasi banca italiana, e in circa un minuto si ottiene il file Excel con i movimenti già separati e controllati. Il funzionamento è questo:

- il PDF viene letto per com'è impaginato, senza modelli da configurare per ogni banca, e funziona anche con gli estratti scansionati;
- le descrizioni su più righe vengono riunite nel movimento a cui appartengono, mentre intestazioni, riporti e piè di pagina vengono scartati;
- ogni estratto viene ricontrollato dal saldo iniziale al saldo finale, e riga per riga quando la banca stampa il saldo progressivo; le righe da verificare sono evidenziate;
- i movimenti vengono assegnati a una categoria (F24, utenze, stipendi, fornitori, incassi da clienti, commissioni e altre), che si può correggere con un clic;
- se si caricano anche le fatture elettroniche XML del periodo, i bonifici vengono abbinati alle fatture, compresi acconti e pagamenti parziali.

Il file Excel contiene i movimenti con data, descrizione, importo, categoria e fattura abbinata, più un riepilogo con i totali per categoria. Se si caricano gli estratti di più conti o di più mesi insieme, si ottiene un unico file, con una colonna che indica il conto di ogni movimento e un foglio che riepiloga i singoli estratti.

## Dopo Excel: prima nota e gestionale

Spesso Excel è solo un passaggio intermedio. Per questo, oltre al foglio Excel, si possono scaricare un CSV di prima nota e un CSV configurabile per l'importazione nel programma di contabilità: si scelgono il separatore, il formato dei decimali e della data e i codici conto del proprio piano dei conti per ogni categoria. Le impostazioni restano salvate sul computer, così il mese dopo basta caricare il nuovo estratto e scaricare il file.

Il CSV non è un tracciato ufficiale di un gestionale specifico: è un file che si adatta alle regole di importazione del programma che usi. Se il tuo gestionale richiede un formato particolare, puoi scriverci e indicarci quale usi.

## E i dati dei clienti?

Gli estratti conto contengono dati delicati: IBAN, nomi, importi, causali. I file caricati restano in memoria solo il tempo dell'elaborazione e poi vengono scartati: non c'è un archivio, e non serve creare un account per provare. Per la lettura il PDF passa dal servizio di intelligenza artificiale di Anthropic, che tramite API non usa i dati per addestrare i modelli. I dettagli sono nella pagina privacy.

## Provalo su un estratto vero

Il modo più rapido per capire se fa al caso tuo è provarlo. Puoi convertire subito un estratto conto di esempio, senza caricare nulla, oppure usare uno dei tuoi: ogni mese hai tre conversioni gratuite, senza registrarti. Carica il PDF, controlla che i saldi tornino e scarica il file Excel.`,
  },
];

export const articolo = (slug: string) => ARTICOLI.find((a) => a.slug === slug);

export type Blocco = { tipo: "h2"; testo: string } | { tipo: "p"; testo: string } | { tipo: "ul"; voci: string[] };

export function blocchi(testo: string): Blocco[] {
  return testo
    .trim()
    .split(/\n\s*\n/)
    .map((parte): Blocco => {
      const righe = parte.trim().split("\n");
      if (righe[0].startsWith("## ")) return { tipo: "h2", testo: righe[0].slice(3).trim() };
      if (righe.every((r) => r.startsWith("- "))) return { tipo: "ul", voci: righe.map((r) => r.slice(2).trim()) };
      return { tipo: "p", testo: righe.join(" ") };
    });
}

export const dataEstesa = (data: string) =>
  new Date(`${data}T12:00:00Z`).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
