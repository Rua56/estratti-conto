"use client";

import { useMemo, useState } from "react";
import { CATEGORIE } from "../lib/categorie";
import { formatData, formatImporto } from "../lib/numeri";
import type { Risultato } from "../lib/types";

type Risposta = Risultato & { avvisi: string[] };

export default function Home() {
  const [pdf, setPdf] = useState<File | null>(null);
  const [xml, setXml] = useState<File[]>([]);
  const [piva, setPiva] = useState("");
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [ris, setRis] = useState<Risposta | null>(null);

  async function converti(e: React.FormEvent) {
    e.preventDefault();
    if (!pdf) return;
    setCaricamento(true);
    setErrore(null);
    setRis(null);
    const fd = new FormData();
    fd.append("pdf", pdf);
    xml.forEach((f) => fd.append("fatture", f));
    fd.append("piva", piva);
    try {
      const res = await fetch("/api/convert", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.errore ?? "Errore");
      setRis(json);
    } catch (err) {
      setErrore((err as Error).message);
    } finally {
      setCaricamento(false);
    }
  }

  async function scarica(formato: "xlsx" | "csv" | "primanota") {
    if (!ris) return;
    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formato, risultato: ris }),
    });
    const blob = await res.blob();
    const nome = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ?? "estratto";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nome;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function cambiaCategoria(id: string, categoria: string) {
    if (!ris) return;
    setRis({
      ...ris,
      estratto: { ...ris.estratto, movimenti: ris.estratto.movimenti.map((m) => (m.id === id ? { ...m, categoria } : m)) },
    });
  }

  const totali = useMemo(() => {
    const m = ris?.estratto.movimenti ?? [];
    return {
      entrate: m.filter((x) => x.importo > 0).reduce((s, x) => s + x.importo, 0),
      uscite: m.filter((x) => x.importo < 0).reduce((s, x) => s + x.importo, 0),
      daVerificare: m.filter((x) => x.affidabilita < 0.8).length,
    };
  }, [ris]);

  const fatturaDi = (movId: string) => {
    const a = ris?.abbinamenti.find((x) => x.movimentoId === movId);
    const f = a && ris?.fatture.find((x) => x.id === a.fatturaId);
    return f ? { f, a } : null;
  };

  return (
    <main>
      <h1>Estratti conto in contabilità</h1>
      <p className="sub">Carica l&apos;estratto conto PDF: ricevi i movimenti categorizzati, il controllo dei saldi e l&apos;abbinamento con le fatture elettroniche.</p>

      <form className="card" onSubmit={converti}>
        <div className="grid">
          <div>
            <label>
              Estratto conto (PDF) <span className="hint">tutte le principali banche italiane</span>
            </label>
            <input type="file" accept="application/pdf" onChange={(e) => setPdf(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <label>
              Fatture elettroniche (XML) <span className="hint">facoltative, per l&apos;abbinamento</span>
            </label>
            <input type="file" accept=".xml,text/xml" multiple onChange={(e) => setXml([...(e.target.files ?? [])])} />
          </div>
          <div>
            <label>
              Partita IVA del cliente <span className="hint">per distinguere fatture attive e passive</span>
            </label>
            <input type="text" value={piva} onChange={(e) => setPiva(e.target.value)} placeholder="01234567890" />
          </div>
        </div>
        <div className="azioni" style={{ marginTop: 16 }}>
          <button type="submit" disabled={!pdf || caricamento}>
            {caricamento ? "Elaborazione in corso..." : "Converti"}
          </button>
        </div>
        {errore && <p className="errore">{errore}</p>}
        <p className="privacy">I file vengono elaborati e non vengono conservati.</p>
      </form>

      {ris && (
        <>
          {ris.avvisi.map((a) => (
            <div key={a} className="avviso">
              {a}
            </div>
          ))}

          <section className="card">
            <h2>
              {ris.estratto.banca ?? "Estratto conto"}
              {ris.estratto.periodoDa && ` · ${formatData(ris.estratto.periodoDa)} - ${formatData(ris.estratto.periodoA)}`}
            </h2>
            <div className="kpi">
              <div>
                <b>{ris.estratto.movimenti.length}</b>
                <span>movimenti</span>
              </div>
              <div>
                <b className="pos">{formatImporto(totali.entrate)} €</b>
                <span>entrate</span>
              </div>
              <div>
                <b className="neg">{formatImporto(totali.uscite)} €</b>
                <span>uscite</span>
              </div>
              <div>
                <b className={ris.estratto.controlloSaldi.quadra ? "ok" : "ko"}>
                  {!ris.estratto.controlloSaldi.eseguito ? "n.d." : ris.estratto.controlloSaldi.quadra ? "Quadra" : "Non quadra"}
                </b>
                <span>controllo saldi</span>
              </div>
              <div>
                <b>
                  {ris.abbinamenti.length}/{ris.fatture.length}
                </b>
                <span>fatture abbinate</span>
              </div>
            </div>
            <div className="azioni" style={{ marginTop: 16 }}>
              <button onClick={() => scarica("xlsx")}>Scarica Excel</button>
              <button className="secondario" onClick={() => scarica("primanota")}>
                CSV prima nota
              </button>
              <button className="secondario" onClick={() => scarica("csv")}>
                CSV movimenti
              </button>
            </div>
          </section>

          <section className="card tabella">
            <h2>Movimenti</h2>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrizione</th>
                  <th style={{ textAlign: "right" }}>Importo €</th>
                  <th>Categoria</th>
                  <th>Fattura</th>
                </tr>
              </thead>
              <tbody>
                {ris.estratto.movimenti.map((m) => {
                  const fa = fatturaDi(m.id);
                  return (
                    <tr key={m.id} className={m.affidabilita < 0.8 ? "verifica" : ""}>
                      <td>{formatData(m.data)}</td>
                      <td>{m.descrizione}</td>
                      <td className={`num ${m.importo >= 0 ? "pos" : "neg"}`}>{formatImporto(m.importo)}</td>
                      <td>
                        <select value={m.categoria} onChange={(e) => cambiaCategoria(m.id, e.target.value)}>
                          {CATEGORIE.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {fa && (
                          <span className="badge" title={fa.a.motivi.join(", ")}>
                            n. {fa.f.numero} · {Math.round(fa.a.punteggio * 100)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {ris.fatture.length > 0 && (
            <section className="card tabella">
              <h2>Fatture</h2>
              <table>
                <thead>
                  <tr>
                    <th>Numero</th>
                    <th>Data</th>
                    <th>Controparte</th>
                    <th style={{ textAlign: "right" }}>Totale €</th>
                    <th>Stato</th>
                  </tr>
                </thead>
                <tbody>
                  {ris.fatture.map((f) => {
                    const a = ris.abbinamenti.find((x) => x.fatturaId === f.id);
                    return (
                      <tr key={f.id}>
                        <td>{f.numero}</td>
                        <td>{formatData(f.data)}</td>
                        <td>{f.tipo === "attiva" ? f.cessionario : f.cedente}</td>
                        <td className="num">{formatImporto(f.totale)}</td>
                        <td>{a ? <span className="ok">{f.tipo === "attiva" ? "Incassata" : "Pagata"}</span> : <span className="ko">Aperta</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </main>
  );
}
