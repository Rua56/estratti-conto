"use client";

import { useState } from "react";

export default function Contatto() {
  const [email, setEmail] = useState("");
  const [studio, setStudio] = useState("");
  const [messaggio, setMessaggio] = useState("");
  const [sito, setSito] = useState("");
  const [stato, setStato] = useState<"pronto" | "invio" | "fatto">("pronto");
  const [errore, setErrore] = useState<string | null>(null);

  async function invia() {
    setStato("invio");
    setErrore(null);
    const res = await fetch("/api/contatto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "interesse", email, studio, messaggio, sito, pagina: "home" }),
    }).catch(() => null);
    if (res?.ok) return setStato("fatto");
    setErrore((await res?.json().catch(() => ({})))?.errore ?? "Invio non riuscito. Riprova.");
    setStato("pronto");
  }

  if (stato === "fatto") return <p className="ok">Grazie! Ti scriviamo noi a breve.</p>;

  return (
    <form
      className="contatto"
      onSubmit={(e) => {
        e.preventDefault();
        invia();
      }}
    >
      <div className="grid">
        <div>
          <label htmlFor="c-email">Email</label>
          <input id="c-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@studio.it" />
        </div>
        <div>
          <label htmlFor="c-studio">
            Studio <span className="hint">facoltativo</span>
          </label>
          <input id="c-studio" type="text" value={studio} onChange={(e) => setStudio(e.target.value)} placeholder="es. Studio Rossi, Udine" />
        </div>
      </div>
      <label htmlFor="c-msg" style={{ marginTop: 12 }}>
        Messaggio <span className="hint">facoltativo: che gestionale usate, quanti estratti al mese, cosa vi servirebbe</span>
      </label>
      <textarea id="c-msg" rows={3} value={messaggio} onChange={(e) => setMessaggio(e.target.value)} />
      <input className="trappola" tabIndex={-1} autoComplete="off" aria-hidden value={sito} onChange={(e) => setSito(e.target.value)} name="sito" />
      {errore && <p className="errore">{errore}</p>}
      <div className="azioni" style={{ marginTop: 12 }}>
        <button type="submit" disabled={stato === "invio"}>
          {stato === "invio" ? "Invio..." : "Invia"}
        </button>
      </div>
      <p className="hint">
        Usiamo l&apos;email solo per risponderti e avvisarti delle novità del servizio. Niente newsletter. <a href="/privacy">Privacy</a>
      </p>
    </form>
  );
}
