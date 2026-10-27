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
  {
    slug: "importare-estratto-conto-in-prima-nota",
    titolo: "Importare l'estratto conto in prima nota: dal PDF della banca alle registrazioni",
    descrizione:
      "Come passare dall'estratto conto PDF alla prima nota senza ribattere i movimenti: quali controlli fare prima, come impostare conto banca e contropartite, e come importare l'estratto conto in prima nota con un file CSV.",
    parolaChiave: "importare estratto conto in prima nota",
    data: "2026-10-27",
    testo: `Per chi tiene la contabilità dei clienti, la prima nota banca è uno dei lavori più ripetitivi del mese. L'estratto conto arriva in PDF, ogni movimento va letto, capito e registrato con la sua contropartita. Importare l'estratto conto in prima nota invece di ribatterlo riga per riga è possibile, ma solo se il file di partenza è pulito e controllato. In questa guida vediamo come si fa il lavoro a mano, dove nascono gli errori e come preparare un file da importare nel programma di contabilità.

## Come si registra a mano un estratto conto

Il procedimento manuale lo conosce chiunque lavori in studio. Si apre il PDF della banca accanto al gestionale e, per ogni movimento:

- si legge la data contabile (e a volte la data valuta);
- si interpreta la descrizione per capire di che operazione si tratta: un incasso da cliente, un pagamento a fornitore, un F24, una commissione, un giroconto;
- si sceglie il conto di contropartita del piano dei conti;
- si decide il verso: un'entrata va in dare sul conto banca, un'uscita in avere;
- si scrive l'importo, con attenzione a virgole e punti delle migliaia;
- quando c'è, si collega la fattura che il movimento paga o incassa.

Per un conto con poche decine di movimenti al mese il lavoro è sopportabile. Con più clienti, più conti e qualche estratto scansionato diventa una parte importante della giornata, e soprattutto è il punto in cui si infilano gli errori più difficili da trovare: un importo invertito, un movimento saltato tra una pagina e l'altra, una commissione registrata due volte.

## Prima di importare: i controlli che non vanno saltati

Che il file venga da un programma, da un collaboratore o dal sito della banca, prima di importarlo in prima nota conviene fare sempre gli stessi controlli. Una volta importati, i movimenti sbagliati si correggono uno per uno, quindi è meglio fermarli prima.

- Il periodo è quello giusto: la prima e l'ultima data corrispondono all'estratto, senza movimenti del mese precedente già registrati.
- Il numero di movimenti torna con il PDF.
- Saldo iniziale più entrate meno uscite dà esattamente il saldo finale stampato dalla banca. Se manca anche un centesimo, c'è un movimento letto male o mancante.
- Nessuna riga estranea: riporti, totali di pagina, saldi intermedi e intestazioni non devono finire tra i movimenti.
- Le descrizioni sono complete, anche quando nel PDF andavano a capo su più righe. È la descrizione che permette di scegliere la contropartita giusta.

Il controllo dei saldi è il più utile perché è oggettivo: o torna o non torna. Quando la banca stampa anche il saldo dopo ogni operazione, il controllo si può ripetere riga per riga e trovare subito il punto in cui qualcosa si è rotto.

## Conto banca e contropartite

Importare l'estratto conto in prima nota vuol dire, in pratica, trasformare ogni movimento in una registrazione a partita doppia con due conti. Uno dei due è sempre lo stesso: il conto della banca nel piano dei conti dello studio. L'altro dipende dal tipo di movimento.

Qui sta il lavoro vero. Un bonifico ricevuto da un cliente va sul conto clienti o sul cliente specifico, un addebito SDD della luce su utenze, un F24 sui conti di imposte e contributi, il canone del conto e l'imposta di bollo su spese bancarie, uno spostamento tra due conti dello stesso intestatario su un conto transitorio o di giroconto. Ogni studio ha il proprio piano dei conti e le proprie abitudini, quindi non esiste una tabella valida per tutti.

Per questo ha senso lavorare in due passaggi: prima si assegna a ogni movimento una categoria leggibile (stipendi, F24, utenze, fornitori, incassi da clienti), poi si associa una volta per tutte a ogni categoria il codice conto del proprio piano dei conti. Il mese successivo l'associazione è già pronta e resta solo da controllare i movimenti dubbi.

## Il file da importare: cosa deve contenere

La maggior parte dei programmi di contabilità permette di importare movimenti da un file di testo, spesso un CSV. Le regole cambiano da programma a programma, ma le informazioni richieste sono quasi sempre le stesse:

- data di registrazione, e a volte data valuta;
- conto dare e conto avere, oppure un solo conto e un importo con segno;
- importo, con il separatore dei decimali che il programma si aspetta;
- descrizione;
- eventuale riferimento al documento, cioè la fattura pagata o incassata.

Prima del primo import vale la pena controllare nel manuale del proprio gestionale tre dettagli che causano la maggior parte degli scarti: il separatore dei campi (punto e virgola, virgola o tabulazione), il formato della data e se la prima riga deve contenere le intestazioni delle colonne. Conviene anche fare una prova su un mese già registrato a mano, per confrontare il risultato prima di usarlo sul serio.

## Come lo fa Estratti Conto

Estratti Conto serve a preparare proprio questo file partendo dal PDF della banca, senza ribattere nulla:

- si carica l'estratto conto PDF di qualsiasi banca italiana, anche scansionato, e i movimenti vengono separati con data, data valuta, descrizione completa e importo;
- ogni estratto viene ricontrollato dal saldo iniziale al saldo finale, e riga per riga quando la banca stampa il saldo progressivo; i movimenti da verificare sono evidenziati;
- a ogni movimento viene assegnata una categoria, che si può correggere con un clic prima di scaricare;
- se si caricano anche le fatture elettroniche XML del periodo, i bonifici vengono abbinati alle fatture e il numero del documento finisce nel file.

Per la prima nota si può scaricare un CSV con data, conto dare, conto avere, importo, descrizione e documento: le entrate vanno in dare sul conto banca e le uscite in avere. C'è poi un CSV configurabile per il gestionale, in cui si scelgono il tracciato (dare e avere oppure importo con segno), il separatore, il formato dei decimali e della data, la riga di intestazione, il nome del conto banca e il codice conto per ogni categoria. Le impostazioni restano salvate nel browser, così il mese dopo basta caricare il nuovo estratto.

Il CSV non è il tracciato ufficiale di un gestionale specifico: è un file che si adatta alle regole di importazione del programma che usi. Se il tuo gestionale ha un formato particolare, puoi scriverci e indicarci quale usi.

## Prova con il prossimo estratto

Il modo più semplice per capire se fa per il tuo studio è provarlo su un estratto che devi comunque registrare. Puoi partire dall'estratto di esempio, senza caricare nulla, oppure usare un tuo PDF: ogni mese hai tre conversioni gratuite, senza registrarti. Controlla che i saldi tornino, imposta i codici conto una volta e scarica il file per la prima nota.`,
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
