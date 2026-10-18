import { ABBONAMENTO, GRATIS_AL_MESE } from "../lib/accesso";
import { LIMITI } from "../lib/limiti";
import Contatto from "./Contatto";
import Convertitore from "./Convertitore";
import Prezzi from "./Prezzi";

const FAQ = [
  {
    d: "Con quali banche funziona?",
    r: "Con gli estratti conto in PDF di qualsiasi banca italiana: grandi gruppi, banche popolari, casse rurali, banche online. Il formato non va configurato: lo strumento riconosce da solo colonne, date e importi.",
  },
  {
    d: "Funziona anche con gli estratti scansionati?",
    r: `Sì. Anche le scansioni e le foto leggermente storte vengono lette, fino a ${LIMITI.pagine} pagine e ${LIMITI.mbTotali} MB per estratto. Più la scansione è nitida, più la lettura è sicura.`,
  },
  {
    d: "Come faccio a fidarmi dei numeri?",
    r: "Ogni estratto viene ricontrollato: la somma dei movimenti deve portare dal saldo iniziale al saldo finale stampati dalla banca, e quando la banca stampa il saldo riga per riga il controllo si fa su ogni movimento. Se qualcosa non torna lo vedi evidenziato in giallo, con la riga da verificare.",
  },
  {
    d: "Dove finiscono i file dei miei clienti?",
    r: "Da nessuna parte: restano in memoria il tempo dell'elaborazione e poi vengono scartati, non li salviamo. Per la lettura il PDF passa dal servizio di intelligenza artificiale Anthropic (Claude), che via API non usa i dati per addestrare i modelli. I dettagli sono nella pagina privacy.",
  },
  {
    d: "Posso importare il risultato nel mio gestionale?",
    r: "Sì: oltre a Excel e al CSV di prima nota c'è un CSV configurabile con i codici conto del tuo piano dei conti, il separatore e il formato data che il tuo programma richiede. Se usi un gestionale in particolare scrivici: prepariamo i tracciati pronti partendo da quelli più richiesti.",
  },
  {
    d: "Come funziona l'abbinamento con le fatture?",
    r: "Carichi insieme all'estratto le fatture elettroniche XML del periodo (quelle dello SDI). Ogni bonifico viene abbinato alla fattura per importo, numero nella causale e controparte, compresi acconti e pagamenti parziali. Alla fine vedi quali fatture sono incassate, pagate in parte o ancora aperte.",
  },
  {
    d: "Posso disdire quando voglio?",
    r: "Sì, l'abbonamento è mensile e senza vincoli: lo disdici in autonomia dal portale di pagamento e resta attivo fino alla fine del mese pagato.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Estratti Conto",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "it",
      description: "Converte gli estratti conto PDF delle banche italiane in Excel e prima nota, con controllo dei saldi e abbinamento alle fatture elettroniche.",
      offers: { "@type": "Offer", price: String(ABBONAMENTO.centesimi / 100), priceCurrency: "EUR" },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.d, acceptedAnswer: { "@type": "Answer", text: f.r } })),
    },
  ],
};

export default function Home() {
  return (
    <>
      <header className="barra">
        <div className="contenuto">
          <a href="/" className="logo">
            <span aria-hidden>€</span> Estratti Conto
          </a>
          <nav className="menu" aria-label="Sezioni">
            <a href="#funzioni">Funzioni</a>
            <a href="#prezzi">Prezzi</a>
            <a href="#domande">Domande</a>
            <a href="#contatti">Contatti</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="eroe">
          <p className="occhiello">Per studi commercialisti, CED e uffici amministrativi</p>
          <h1>Dall&apos;estratto conto PDF alla prima nota, in un minuto</h1>
          <p className="sub">
            Basta ribattere i movimenti a mano. Carichi il PDF della banca, anche scansionato: i movimenti vengono letti e categorizzati, i saldi
            ricontrollati al centesimo e i bonifici abbinati alle fatture elettroniche. Poi scarichi Excel o il CSV per il gestionale.
          </p>
        </section>

        <Convertitore />

        <section className="passi" aria-label="Come funziona">
          <div>
            <b>1. Carica</b>
            <span>Uno o più estratti conto PDF di qualsiasi banca italiana, anche scansionati, e se vuoi le fatture XML del periodo.</span>
          </div>
          <div>
            <b>2. Controlla</b>
            <span>Saldi verificati, movimenti dubbi evidenziati, categorie modificabili con un clic.</span>
          </div>
          <div>
            <b>3. Esporta</b>
            <span>Excel con riepilogo e totali per categoria, CSV per la prima nota o per il tuo gestionale, stato delle fatture.</span>
          </div>
        </section>

        <section id="funzioni" className="sezione">
          <h2>Cosa fa per lo studio</h2>
          <div className="funzioni">
            <div>
              <h3>Legge qualsiasi banca</h3>
              <p>Niente modelli da configurare per ogni istituto. Funziona con i PDF digitali e con le scansioni.</p>
            </div>
            <div>
              <h3>Ricontrolla i saldi</h3>
              <p>Dal saldo iniziale al finale, e riga per riga quando la banca stampa il progressivo. Le righe dubbie sono evidenziate.</p>
            </div>
            <div>
              <h3>Categorizza i movimenti</h3>
              <p>F24, utenze, stipendi, fornitori, incassi, commissioni e altre categorie, assegnate per natura della spesa e correggibili.</p>
            </div>
            <div>
              <h3>Abbina le fatture SDI</h3>
              <p>Bonifici abbinati alle fatture elettroniche XML, compresi acconti e pagamenti parziali: vedi subito cosa è incassato e cosa no.</p>
            </div>
            <div>
              <h3>Più conti insieme</h3>
              <p>Carica gli estratti di più conti o di più mesi in una volta e scarica un unico Excel, con un foglio di riepilogo per conto.</p>
            </div>
            <div>
              <h3>Pronto per il gestionale</h3>
              <p>CSV di prima nota con i codici del tuo piano dei conti, separatori e formato data a scelta. Le impostazioni restano salvate.</p>
            </div>
          </div>
        </section>

        <section id="prezzi" className="sezione">
          <h2>Prezzi</h2>
          <p className="sub">Provalo gratis sui tuoi estratti. L&apos;abbonamento serve solo quando diventa uno strumento di lavoro quotidiano.</p>
          <Prezzi gratisAlMese={GRATIS_AL_MESE} euroAlMese={ABBONAMENTO.centesimi / 100} />
        </section>

        <section id="domande" className="sezione">
          <h2>Domande frequenti</h2>
          <div className="faq">
            {FAQ.map((f) => (
              <details key={f.d}>
                <summary>{f.d}</summary>
                <p>{f.r}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="contatti" className="sezione card">
          <h2>Parliamone</h2>
          <p className="sub">
            Vuoi un tracciato pronto per il tuo gestionale, provarlo con più estratti o hai trovato una banca che legge male? Lasciaci la tua email e
            ti rispondiamo noi.
          </p>
          <Contatto />
        </section>
      </main>

      <footer className="piede">
        <div className="contenuto">
          <span>Estratti Conto · fatto in Italia per gli studi professionali</span>
          <span className="azioni">
            <a href="#contatti">Contatti</a>
            <a href="/privacy">Privacy</a>
          </span>
        </div>
      </footer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
