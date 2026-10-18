import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy · Estratti Conto",
  description: "Come vengono trattati gli estratti conto e le fatture caricate.",
};

export default function Privacy() {
  return (
    <>
      <header className="barra">
        <div className="contenuto">
          <a href="/" className="logo">
            <span aria-hidden>€</span> Estratti Conto
          </a>
        </div>
      </header>
      <main className="testo">
        <h1>Privacy</h1>
        <p className="sub">In breve: i tuoi file servono solo a produrre la conversione e non vengono conservati.</p>

        <h2>Quali dati trattiamo</h2>
        <ul>
          <li>L&apos;estratto conto PDF e le eventuali fatture elettroniche XML che carichi, con i dati che contengono (nomi, IBAN, importi, causali).</li>
          <li>La partita IVA che inserisci, usata solo per distinguere le fatture emesse da quelle ricevute.</li>
          <li>L&apos;indirizzo IP della richiesta, tenuto in memoria per un&apos;ora per limitare gli abusi.</li>
          <li>Se ci scrivi dal modulo contatti o invii una segnalazione: email, nome dello studio e testo del messaggio.</li>
          <li>Se ti abboni: i dati di pagamento e fatturazione, raccolti e conservati da Stripe. Noi riceviamo solo l&apos;identificativo dell&apos;abbonamento.</li>
        </ul>

        <h2>Come li trattiamo</h2>
        <ul>
          <li>I file vengono elaborati in memoria sui server di Vercel a Francoforte e cancellati al termine della richiesta. Non li salviamo in archivi o database.</li>
          <li>Il risultato resta nel tuo browser. Quando scarichi Excel o CSV, il risultato viene rimandato al server solo per generare il file.</li>
          <li>
            Per leggere l&apos;estratto conto il PDF viene inviato a Anthropic (Claude) tramite API. Secondo i termini commerciali di Anthropic,
            i dati inviati tramite API non vengono usati per addestrare i modelli. Anthropic ha sede negli Stati Uniti: il trasferimento avviene
            con le garanzie previste dal GDPR.
          </li>
          <li>
            Usiamo solo cookie tecnici: uno conta le conversioni gratuite del mese, l&apos;altro contiene il codice dell&apos;abbonamento. Non usiamo cookie
            di profilazione né strumenti di tracciamento pubblicitario.
          </li>
          <li>Contiamo le visite con Vercel Web Analytics, che non usa cookie e non identifica i singoli visitatori.</li>
          <li>
            I messaggi del modulo contatti e le segnalazioni sono conservati in un archivio privato su Vercel finché servono a risponderti e a
            migliorare il servizio; puoi chiederne la cancellazione in qualsiasi momento.
          </li>
        </ul>

        <h2>I tuoi diritti</h2>
        <p>
          Puoi chiedere informazioni sul trattamento, la cancellazione o la limitazione dei dati, e proporre reclamo al Garante per la protezione dei
          dati personali. Poiché i file non vengono conservati, di norma non c&apos;è nulla da cancellare dopo l&apos;elaborazione.
        </p>

        <h2>Titolare del trattamento</h2>
        <p>
          Riccardo Iuran, Gorizia. Per qualsiasi richiesta sui dati scrivi a{" "}
          <a href="mailto:iuran56@gmail.com">iuran56@gmail.com</a>.
        </p>

        <p className="hint">Ultimo aggiornamento: 18 ottobre 2026 (contatti, abbonamento e statistiche).</p>
        <p>
          <a href="/">← Torna alla conversione</a>
        </p>
      </main>
    </>
  );
}
