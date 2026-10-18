"use client";

import { useEffect, useState } from "react";
import { useAccesso } from "./accesso-client";

export default function Prezzi({ gratisAlMese, euroAlMese }: { gratisAlMese: number; euroAlMese: number }) {
  const { stato, aggiorna } = useAccesso();
  const [esito, setEsito] = useState<string | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [attesa, setAttesa] = useState(false);
  const [codice, setCodice] = useState("");
  const [copiato, setCopiato] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("abbonamento");
    if (p === "attivo") setEsito("Abbonamento attivo, grazie! Qui sotto trovi il codice di accesso per usarlo anche su altri computer dello studio.");
    if (p === "errore") setErrore("Non sono riuscito a confermare il pagamento. Se ti è stato addebitato, scrivi a iuran56@gmail.com.");
    if (p) document.getElementById("prezzi")?.scrollIntoView();
  }, []);

  async function chiama(url: string, init?: RequestInit) {
    setErrore(null);
    setAttesa(true);
    try {
      const res = await fetch(url, init);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.errore ?? "Operazione non riuscita.");
      return json;
    } catch (e) {
      setErrore((e as Error).message);
      return null;
    } finally {
      setAttesa(false);
    }
  }

  const abbonati = async () => {
    const j = await chiama("/api/abbonamento", { method: "POST" });
    if (j?.url) window.location.href = j.url;
  };
  const portale = async () => {
    const j = await chiama("/api/portale", { method: "POST" });
    if (j?.url) window.location.href = j.url;
  };
  const usaCodice = async () => {
    const j = await chiama("/api/accesso", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ codice }) });
    if (j) {
      setCodice("");
      setEsito("Abbonamento attivato su questo browser.");
      aggiorna();
    }
  };
  const esci = async () => {
    await chiama("/api/accesso", { method: "DELETE" });
    setEsito(null);
    aggiorna();
  };

  const pagamenti = stato?.pagamenti ?? false;

  return (
    <>
      <div className="piani">
        <div className="piano">
          <h3>Prova</h3>
          <p className="prezzo">Gratis</p>
          <ul>
            <li>{gratisAlMese} conversioni al mese</li>
            <li>Tutte le funzioni, anche le scansioni</li>
            <li>L&apos;esempio si può provare quante volte vuoi</li>
          </ul>
          <a className="bottone secondario" href="#converti">
            Prova ora
          </a>
        </div>
        <div className="piano evidenza">
          <h3>Studio</h3>
          <p className="prezzo">
            {euroAlMese} € <span>al mese</span>
          </p>
          <ul>
            <li>Conversioni illimitate (uso ragionevole)</li>
            <li>Più estratti e più conti insieme</li>
            <li>CSV con i codici conto del tuo gestionale</li>
            <li>Su tutti i computer dello studio con un codice</li>
            <li>Disdici quando vuoi, senza vincoli</li>
          </ul>
          {stato?.abbonato ? (
            <p className="ok">Il tuo abbonamento è attivo.</p>
          ) : pagamenti ? (
            <button type="button" onClick={abbonati} disabled={attesa}>
              {attesa ? "Apro il pagamento..." : "Attiva l'abbonamento"}
            </button>
          ) : (
            <a className="bottone" href="#contatti">
              Avvisami quando apre
            </a>
          )}
          <p className="hint">{pagamenti ? "Pagamento sicuro con carta tramite Stripe." : "Gli abbonamenti aprono a breve: intanto la prova è gratuita."}</p>
        </div>
        <div className="piano">
          <h3>Studi grandi</h3>
          <p className="prezzo">Su misura</p>
          <ul>
            <li>Molti clienti e molti conti ogni mese</li>
            <li>Tracciato pronto per il vostro gestionale</li>
            <li>Supporto diretto</li>
          </ul>
          <a className="bottone secondario" href="#contatti">
            Scrivici
          </a>
        </div>
      </div>

      {esito && <div className="avviso ok-box">{esito}</div>}
      {errore && <p className="errore">{errore}</p>}

      {stato?.abbonato && stato.codice && (
        <div className="card codice">
          <label htmlFor="codice-mio">Il tuo codice di accesso</label>
          <p className="hint">Incollalo nella sezione prezzi di un altro computer per usare lo stesso abbonamento. Non condividerlo fuori dallo studio.</p>
          <div className="riga-codice">
            <input id="codice-mio" type="text" readOnly value={stato.codice} onFocus={(e) => e.target.select()} />
            <button
              type="button"
              className="secondario"
              onClick={() => navigator.clipboard?.writeText(stato.codice!).then(() => setCopiato(true))}
            >
              {copiato ? "Copiato" : "Copia"}
            </button>
          </div>
          <div className="azioni" style={{ marginTop: 12 }}>
            <button type="button" className="secondario" onClick={portale} disabled={attesa}>
              Fatture, carta e disdetta
            </button>
            <button type="button" className="secondario" onClick={esci} disabled={attesa}>
              Esci da questo browser
            </button>
          </div>
        </div>
      )}

      {pagamenti && !stato?.abbonato && (
        <form
          className="codice-form"
          onSubmit={(e) => {
            e.preventDefault();
            usaCodice();
          }}
        >
          <label htmlFor="codice">Hai già l&apos;abbonamento su un altro computer?</label>
          <div className="riga-codice">
            <input id="codice" type="text" value={codice} onChange={(e) => setCodice(e.target.value)} placeholder="Incolla il codice di accesso" />
            <button type="submit" className="secondario" disabled={!codice.trim() || attesa}>
              Usa il codice
            </button>
          </div>
        </form>
      )}
    </>
  );
}
