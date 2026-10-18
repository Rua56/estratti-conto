"use client";

import { useEffect, useState } from "react";

type Contatto = { tipo: string; data: string; email: string | null; studio: string | null; messaggio: string | null; banca: string | null };

// Elenco dei contatti e delle segnalazioni arrivati dal sito. La chiave resta solo in questo browser.
export default function Admin() {
  const [chiave, setChiave] = useState("");
  const [contatti, setContatti] = useState<Contatto[] | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  async function carica(k = chiave) {
    setErrore(null);
    const res = await fetch("/api/admin/contatti", { headers: { "x-chiave": k }, cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return setErrore(j.errore ?? "Errore");
    try {
      localStorage.setItem("ec_admin", k);
    } catch {}
    setContatti(j.contatti);
  }

  useEffect(() => {
    try {
      const k = localStorage.getItem("ec_admin");
      if (k) {
        setChiave(k);
        carica(k);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="admin">
      <h1>Contatti e segnalazioni</h1>
      <meta name="robots" content="noindex" />
      {!contatti && (
        <form
          className="card"
          onSubmit={(e) => {
            e.preventDefault();
            carica();
          }}
        >
          <label htmlFor="k">Chiave</label>
          <input id="k" type="password" value={chiave} onChange={(e) => setChiave(e.target.value)} />
          <div className="azioni" style={{ marginTop: 12 }}>
            <button type="submit">Apri</button>
          </div>
          {errore && <p className="errore">{errore}</p>}
        </form>
      )}
      {contatti && (
        <section className="card tabella">
          <p className="hint">{contatti.length} in totale</p>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Email</th>
                <th>Studio</th>
                <th>Messaggio</th>
              </tr>
            </thead>
            <tbody>
              {contatti.map((c) => (
                <tr key={c.data + c.email}>
                  <td className="data">{new Date(c.data).toLocaleString("it-IT")}</td>
                  <td>{c.tipo}</td>
                  <td>{c.email && <a href={`mailto:${c.email}`}>{c.email}</a>}</td>
                  <td>{c.studio}</td>
                  <td style={{ whiteSpace: "pre-wrap" }}>{c.messaggio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
