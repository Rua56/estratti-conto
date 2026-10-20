import { ABBONAMENTO, GRATIS_AL_MESE, pagamentiAttivi } from "../lib/accesso";
import { LIMITI } from "../lib/limiti";
import Contatto from "./Contatto";
import Convertitore from "./Convertitore";
import Prezzi from "./Prezzi";
import ProvaEsempio from "./ProvaEsempio";
import Rivela from "./Rivela";

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

const FUNZIONI = [
  { t: "Qualsiasi banca", d: "Niente modelli da configurare per ogni istituto: grandi gruppi, popolari, casse rurali, banche online. PDF digitali e scansioni." },
  { t: "Categorie da commercialista", d: "F24, utenze, stipendi, fornitori, incassi, commissioni, finanziamenti: assegnate per natura della spesa e correggibili con un clic." },
  { t: "Fatture SDI abbinate", d: "Carichi le fatture XML del periodo e ogni bonifico trova la sua, anche con acconti e pagamenti parziali. Vedi cosa è incassato e cosa è ancora aperto." },
  { t: "Più conti in una volta", d: "Estratti di conti diversi o di mesi diversi nello stesso caricamento, un unico Excel con un foglio di riepilogo per conto." },
  { t: "CSV per il tuo gestionale", d: "Prima nota con i codici del tuo piano dei conti, separatore, decimali e formato data come li vuole il programma. Le impostazioni restano salvate." },
  { t: "I file non restano qui", d: "Gli estratti dei clienti vengono letti in memoria e scartati a fine elaborazione. Nessun archivio, nessun account da creare." },
];

const euro = (n: number) => n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" });

export default function Home() {
  return (
    <>
      <Rivela />
      <header className="barra">
        <a href="/" className="marchio">
          Estratti Conto
        </a>
        <nav className="menu" aria-label="Sezioni">
          <a href="#controllo">Come funziona</a>
          <a href="#prezzi">Prezzi</a>
          <a href="#domande">Domande</a>
          <a href="/guide">Guide</a>
          <a href="#converti" className="menu-azione">
            Converti
          </a>
        </nav>
      </header>

      <main>
        <section className="eroe">
          <div className="eroe-testo">
            <h1 data-rivela>Dal PDF alla prima nota</h1>
            <p className="eroe-sub" data-rivela style={{ "--d": "80ms" } as React.CSSProperties}>
              Carichi l&apos;estratto conto della banca, anche scansionato. I movimenti vengono letti e categorizzati, i saldi ricontrollati al centesimo, i bonifici
              abbinati alle fatture elettroniche. Poi scarichi Excel o il CSV per il gestionale.
            </p>
            <div className="eroe-azioni" data-rivela style={{ "--d": "160ms" } as React.CSSProperties}>
              <ProvaEsempio className="grande">Prova con un esempio</ProvaEsempio>
              <a className="bottone grande secondario" href="#converti">
                Carica un estratto
              </a>
            </div>
            <p className="eroe-nota" data-rivela style={{ "--d": "220ms" } as React.CSSProperties}>
              {GRATIS_AL_MESE} conversioni gratis ogni mese, senza registrarti. Poi {ABBONAMENTO.centesimi / 100} € al mese per lo studio.
            </p>
          </div>
          <figure className="eroe-figura">
            <div className="foglio">
              <img
                src="/img/estratto-banca-di-prova.webp"
                width={1406}
                height={1155}
                alt="Prima pagina di un estratto conto di prova: riepilogo dei saldi e tabella dei movimenti con date, addebiti, accrediti e descrizioni"
                fetchPriority="high"
              />
            </div>
            <div className="cedola" data-ui data-rivela style={{ "--d": "380ms" } as React.CSSProperties}>
              <span>Banca di Prova, maggio 2026</span>
              <b>23 movimenti</b>
              <span>
                Saldo iniziale {euro(4218.65)} · finale {euro(8794.65)}
              </span>
              <span className="cedola-ok">I saldi tornano al centesimo</span>
            </div>
            <figcaption>Un estratto di prova, con banca e importi inventati.</figcaption>
          </figure>
        </section>

        <section className="prova" aria-labelledby="titolo-prova">
          <div className="prova-intesta" data-rivela>
            <h2 id="titolo-prova">Prova adesso sui tuoi estratti</h2>
            <p>Trascina uno o più PDF, aggiungi se vuoi le fatture XML del periodo e premi Converti. Il risultato compare qui sotto.</p>
          </div>
          <Convertitore />
        </section>

        <section id="controllo" className="campo saldo" aria-labelledby="titolo-saldo">
          <div className="interno">
            <h2 id="titolo-saldo" data-rivela>
              Il saldo deve tornare
            </h2>
            <p className="saldo-sub" data-rivela>
              Ogni estratto viene rifatto all&apos;indietro: dal saldo iniziale, movimento per movimento, fino al saldo finale stampato dalla banca. Se un
              centesimo non torna, la riga da verificare è evidenziata in giallo.
            </p>
            <div className="equazione" role="img" aria-label="4.218,65 più 8.918,42 meno 4.342,42 uguale 8.794,65">
              <div data-rivela style={{ "--d": "0ms" } as React.CSSProperties}>
                <span>Saldo iniziale</span>
                <b>{euro(4218.65)}</b>
              </div>
              <div data-rivela style={{ "--d": "90ms" } as React.CSSProperties}>
                <span>+ accrediti</span>
                <b>{euro(8918.42)}</b>
              </div>
              <div data-rivela style={{ "--d": "180ms" } as React.CSSProperties}>
                <span>− addebiti</span>
                <b>{euro(4342.42)}</b>
              </div>
              <div className="risultato" data-rivela style={{ "--d": "270ms" } as React.CSSProperties}>
                <span>= saldo finale della banca</span>
                <b>{euro(8794.65)}</b>
              </div>
            </div>
            <p className="saldo-nota" data-rivela>
              Quando la banca stampa il saldo riga per riga, il controllo si fa su ogni singolo movimento.
            </p>
          </div>
        </section>

        <section className="scansioni" aria-labelledby="titolo-scansioni">
          <figure className="scansioni-figura" data-rivela>
            <img
              src="/img/estratto-scansionato.webp"
              width={1240}
              height={1137}
              loading="lazy"
              alt="Lo stesso estratto stampato e passato allo scanner: leggermente storto, grigio, con la filigrana fac-simile"
            />
          </figure>
          <div className="scansioni-testo">
            <h2 id="titolo-scansioni" data-rivela>
              Anche quello passato allo scanner
            </h2>
            <p data-rivela>
              Il cliente porta la carta, qualcuno la scansiona storta. Va bene lo stesso: lo strumento legge le colonne anche da una scansione grigia e
              inclinata, e su quella di prova ritrova gli stessi 23 movimenti del PDF originale.
            </p>
            <p data-rivela>
              Fino a {LIMITI.pagine} pagine e {LIMITI.mbTotali} MB per estratto. Più la scansione è nitida, più la lettura è sicura, e quello che non è
              sicuro viene segnalato invece di essere indovinato.
            </p>
          </div>
        </section>

        <section className="risultato-sezione" aria-labelledby="titolo-risultato">
          <div className="risultato-testo">
            <h2 id="titolo-risultato" data-rivela>
              Ogni bonifico trova la sua fattura
            </h2>
            <p data-rivela>
              Insieme all&apos;estratto carichi le fatture elettroniche dello SDI. L&apos;abbinamento guarda importo, numero nella causale e controparte,
              e riconosce acconti e saldi. Alla fine sai quali fatture sono incassate, pagate in parte o ancora aperte.
            </p>
          </div>
          <figure className="schermate">
            <img
              data-rivela
              src="/img/movimenti.webp"
              width={2024}
              height={1240}
              loading="lazy"
              alt="Tabella dei movimenti convertiti con data, descrizione, categoria e fattura abbinata"
            />
            <img
              data-rivela
              style={{ "--d": "120ms" } as React.CSSProperties}
              src="/img/fatture.webp"
              width={2024}
              height={1096}
              loading="lazy"
              alt="Elenco delle fatture con lo stato: incassata, pagata in parte, aperta"
            />
            <figcaption>Il risultato dell&apos;esempio: movimenti categorizzati e stato delle fatture.</figcaption>
          </figure>
        </section>

        <section id="funzioni" className="funzioni-sezione" aria-labelledby="titolo-funzioni">
          <h2 id="titolo-funzioni" data-rivela>
            Fatto per come lavora lo studio
          </h2>
          <dl className="funzioni">
            {FUNZIONI.map((f, i) => (
              <div key={f.t} data-rivela style={{ "--d": `${(i % 2) * 80}ms` } as React.CSSProperties}>
                <dt>{f.t}</dt>
                <dd>{f.d}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="prezzi" className="campo prezzi-sezione" aria-labelledby="titolo-prezzi">
          <div className="interno">
            <h2 id="titolo-prezzi" data-rivela>
              Un prezzo, disdici quando vuoi
            </h2>
            <Prezzi gratisAlMese={GRATIS_AL_MESE} euroAlMese={ABBONAMENTO.centesimi / 100} pagamentiAttivi={pagamentiAttivi()} />
          </div>
        </section>

        <section id="domande" className="domande" aria-labelledby="titolo-domande">
          <h2 id="titolo-domande" data-rivela>
            Le domande che ci fanno gli studi
          </h2>
          <div className="faq">
            {FAQ.map((f) => (
              <details key={f.d}>
                <summary>{f.d}</summary>
                <p>{f.r}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="contatti" className="contatti" aria-labelledby="titolo-contatti">
          <div className="contatti-testo">
            <h2 id="titolo-contatti" data-rivela>
              Parliamone
            </h2>
            <p data-rivela>
              Un tracciato pronto per il tuo gestionale, tanti estratti ogni mese, una banca che legge male: scrivici e ti rispondiamo noi, di persona.
            </p>
            <p data-rivela>
              Oppure direttamente a <a href="mailto:iuran56@gmail.com?subject=Estratti%20Conto">iuran56@gmail.com</a>.
            </p>
          </div>
          <Contatto />
        </section>
      </main>

      <footer className="piede">
        <p className="piede-marchio" aria-hidden>
          Estratti Conto
        </p>
        <div className="piede-riga">
          <span>Fatto in Italia per gli studi professionali.</span>
          <span className="azioni">
            <a href="#converti">Converti</a>
            <a href="#prezzi">Prezzi</a>
            <a href="#contatti">Contatti</a>
            <a href="/guide">Guide</a>
            <a href="/privacy">Privacy</a>
          </span>
        </div>
      </footer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
