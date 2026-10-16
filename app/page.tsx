"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIE } from "../lib/categorie";
import { FILE_ESEMPIO, LIMITI } from "../lib/limiti";
import { formatData, formatImporto } from "../lib/numeri";
import { statoFattura } from "../lib/riconciliazione";
import type { Risultato } from "../lib/types";

type Risposta = Risultato & { avvisi: string[] };

const pivaValida = (p: string) => !p.trim() || /^(IT)?\d{11}$/i.test(p.replace(/\s/g, ""));
const peso = (byte: number) =>
  byte < 1024 * 1024 ? `${Math.max(1, Math.round(byte / 1024))} KB` : `${(byte / 1024 / 1024).toLocaleString("it-IT", { maximumFractionDigits: 1 })} MB`;

export default function Home() {
  const [pdf, setPdf] = useState<File | null>(null);
  const [xml, setXml] = useState<File[]>([]);
  const [piva, setPiva] = useState("");
  const [trascina, setTrascina] = useState(false);
  const [inCorso, setInCorso] = useState(false);
  const [secondi, setSecondi] = useState(0);
  const [errore, setErrore] = useState<string | null>(null);
  const [ris, setRis] = useState<Risposta | null>(null);
  const [soloVerifica, setSoloVerifica] = useState(false);
  const inputFile = useRef<HTMLInputElement>(null);
  const risultati = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!inCorso) return;
    setSecondi(0);
    const t = setInterval(() => setSecondi((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [inCorso]);

  function aggiungiFile(files: FileList | File[]) {
    setErrore(null);
    for (const f of Array.from(files)) {
      const nome = f.name.toLowerCase();
      if (f.type === "application/pdf" || nome.endsWith(".pdf")) setPdf(f);
      else if (nome.endsWith(".xml") || f.type.includes("xml"))
        setXml((prec) => (prec.some((p) => p.name === f.name) ? prec : [...prec, f]));
      else setErrore(`${f.name}: carica solo PDF (estratto conto) o XML (fatture elettroniche).`);
    }
  }

  const pesoTotale = (pdf?.size ?? 0) + xml.reduce((s, f) => s + f.size, 0);
  const troppoGrande = pesoTotale > LIMITI.mbTotali * 1024 * 1024;

  async function converti(file = pdf, fatture = xml, partitaIva = piva) {
    if (!file) return;
    setInCorso(true);
    setErrore(null);
    setRis(null);
    setSoloVerifica(false);
    const fd = new FormData();
    fd.append("pdf", file);
    fatture.forEach((f) => fd.append("fatture", f));
    fd.append("piva", partitaIva.replace(/\s/g, ""));
    try {
      const res = await fetch("/api/convert", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({ errore: res.status === 413 ? "File troppo grandi." : "Il server non ha risposto correttamente." }));
      if (!res.ok) throw new Error(json.errore ?? "Errore");
      setRis(json);
      setTimeout(() => risultati.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (err) {
      setErrore((err as Error).message === "Failed to fetch" ? "Connessione interrotta. Riprova." : (err as Error).message);
    } finally {
      setInCorso(false);
    }
  }

  async function provaEsempio() {
    setErrore(null);
    try {
      const scarica = async (nome: string, tipo: string) => {
        const r = await fetch(`/esempio/${nome}`);
        if (!r.ok) throw new Error();
        return new File([await r.blob()], nome, { type: tipo });
      };
      const file = await scarica(FILE_ESEMPIO.pdf, "application/pdf");
      const fatture = await Promise.all(FILE_ESEMPIO.fatture.map((n) => scarica(n, "application/xml")));
      setPdf(file);
      setXml(fatture);
      setPiva(FILE_ESEMPIO.piva);
      await converti(file, fatture, FILE_ESEMPIO.piva);
    } catch {
      setErrore("Non riesco a caricare l'esempio. Riprova.");
    }
  }

  function ricomincia() {
    setRis(null);
    setPdf(null);
    setXml([]);
    setErrore(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function scarica(formato: "xlsx" | "csv" | "primanota") {
    if (!ris) return;
    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formato, risultato: ris }),
    });
    if (!res.ok) return setErrore("Non sono riuscito a generare il file. Riprova.");
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
      estratto: { ...ris.estratto, movimenti: ris.estratto.movimenti.map((m) => (m.id === id ? { ...m, categoria, affidabilita: 1 } : m)) },
    });
  }

  const sospette = useMemo(() => new Set(ris?.estratto.controlloSaldi.righeSospette ?? []), [ris]);
  const daVerificare = (m: Risultato["estratto"]["movimenti"][number]) => m.affidabilita < 0.8 || sospette.has(m.id);

  const totali = useMemo(() => {
    const m = ris?.estratto.movimenti ?? [];
    const stati = (ris?.fatture ?? []).map((f) => statoFattura(f, ris!.abbinamenti).stato);
    return {
      entrate: m.filter((x) => x.importo > 0).reduce((s, x) => s + x.importo, 0),
      uscite: m.filter((x) => x.importo < 0).reduce((s, x) => s + x.importo, 0),
      daVerificare: m.filter(daVerificare).length,
      pagate: stati.filter((s) => s === "pagata").length,
      parziali: stati.filter((s) => s === "parziale").length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ris, sospette]);

  const fatturaDi = (movId: string) => {
    const a = ris?.abbinamenti.find((x) => x.movimentoId === movId);
    const f = a && ris?.fatture.find((x) => x.id === a.fatturaId);
    return f && a ? { f, a } : null;
  };

  const movimenti = (ris?.estratto.movimenti ?? []).filter((m) => !soloVerifica || daVerificare(m));
  const fase = secondi < 4 ? "Leggo il PDF" : secondi < 70 ? "Estraggo e controllo i movimenti" : "Quasi finito, gli estratti lunghi richiedono più tempo";

  return (
    <>
      <header className="barra">
        <div className="contenuto">
          <a href="/" className="logo">
            <span aria-hidden>€</span> Estratti Conto
          </a>
          <span className="tag">Per studi e commercialisti</span>
        </div>
      </header>

      <main>
        <h1>Dall&apos;estratto conto PDF alla prima nota, in un minuto</h1>
        <p className="sub">
          Movimenti letti e categorizzati, saldi verificati al centesimo e abbinamento automatico con le fatture elettroniche dello SDI.
        </p>

        <form
          className="card"
          onSubmit={(e) => {
            e.preventDefault();
            converti();
          }}
        >
          <div
            className={`drop ${trascina ? "attivo" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setTrascina(true);
            }}
            onDragLeave={() => setTrascina(false)}
            onDrop={(e) => {
              e.preventDefault();
              setTrascina(false);
              aggiungiFile(e.dataTransfer.files);
            }}
            onClick={() => inputFile.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputFile.current?.click()}
          >
            <input
              ref={inputFile}
              type="file"
              accept=".pdf,application/pdf,.xml,text/xml,application/xml"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) aggiungiFile(e.target.files);
                e.target.value = "";
              }}
            />
            <b>Trascina qui l&apos;estratto conto PDF</b>
            <span>e, se vuoi, le fatture elettroniche XML del periodo. Oppure clicca per sceglierli.</span>
          </div>

          {(pdf || xml.length > 0) && (
            <ul className="file">
              {pdf && (
                <li>
                  <span className="tipo">PDF</span> {pdf.name} <span className="hint">{peso(pdf.size)}</span>
                  <button type="button" className="x" aria-label="Rimuovi" onClick={() => setPdf(null)}>
                    ×
                  </button>
                </li>
              )}
              {xml.length > 0 && (
                <li>
                  <span className="tipo">XML</span> {xml.length === 1 ? xml[0].name : `${xml.length} fatture elettroniche`}
                  <button type="button" className="x" aria-label="Rimuovi le fatture" onClick={() => setXml([])}>
                    ×
                  </button>
                </li>
              )}
            </ul>
          )}

          <div className="riga-form">
            <div>
              <label htmlFor="piva">
                Partita IVA del cliente <span className="hint">serve a distinguere fatture emesse e ricevute</span>
              </label>
              <input id="piva" type="text" inputMode="numeric" value={piva} onChange={(e) => setPiva(e.target.value)} placeholder="es. 01234567890" />
              {!pivaValida(piva) && <p className="campo-errore">La partita IVA ha 11 cifre.</p>}
            </div>
            <div className="azioni">
              <button type="submit" disabled={!pdf || inCorso || troppoGrande || !pivaValida(piva)}>
                {inCorso ? "Elaborazione..." : "Converti"}
              </button>
              <button type="button" className="secondario" disabled={inCorso} onClick={provaEsempio}>
                Prova con un esempio
              </button>
            </div>
          </div>

          {!pdf && xml.length > 0 && <p className="hint">Manca l&apos;estratto conto PDF.</p>}
          {troppoGrande && <p className="errore">I file superano {LIMITI.mbTotali} MB in totale: carica meno fatture o un estratto più corto.</p>}
          {errore && <p className="errore">{errore}</p>}
          {inCorso && (
            <div className="progresso" role="status">
              <div className="spinner" aria-hidden />
              <span>
                {fase}... <span className="hint">{secondi} s · di solito tra 20 e 60 secondi</span>
              </span>
            </div>
          )}
          <p className="privacy">
            I file restano in memoria il tempo dell&apos;elaborazione e non vengono salvati. <a href="/privacy">Privacy</a>
          </p>
        </form>

        {!ris && !inCorso && (
          <section className="passi">
            <div>
              <b>1. Carica</b>
              <span>L&apos;estratto conto PDF di qualsiasi banca italiana, anche scansionato, fino a {LIMITI.pagine} pagine.</span>
            </div>
            <div>
              <b>2. Controlla</b>
              <span>Saldi verificati, movimenti dubbi evidenziati, categorie modificabili con un clic.</span>
            </div>
            <div>
              <b>3. Esporta</b>
              <span>Excel con riepilogo e totali per categoria, CSV per la prima nota, stato di incasso delle fatture.</span>
            </div>
          </section>
        )}

        {ris && (
          <div ref={risultati} className="risultati">
            {ris.avvisi.map((a) => (
              <div key={a} className="avviso">
                {a}
              </div>
            ))}

            <section className="card">
              <div className="intesta">
                <div>
                  <h2>{ris.estratto.banca ?? "Estratto conto"}</h2>
                  <p className="hint">
                    {[ris.estratto.intestatario, ris.estratto.iban, ris.estratto.periodoDa && `${formatData(ris.estratto.periodoDa)} - ${formatData(ris.estratto.periodoA)}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <button type="button" className="secondario" onClick={ricomincia}>
                  Nuova conversione
                </button>
              </div>
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
                  <b className="neg">{formatImporto(-totali.uscite)} €</b>
                  <span>uscite</span>
                </div>
                <div>
                  <b className={!ris.estratto.controlloSaldi.eseguito ? "" : ris.estratto.controlloSaldi.quadra ? "ok" : "ko"}>
                    {!ris.estratto.controlloSaldi.eseguito ? "Non eseguito" : ris.estratto.controlloSaldi.quadra ? "Quadra" : "Non quadra"}
                  </b>
                  <span>
                    {ris.estratto.saldoIniziale !== null && ris.estratto.saldoFinale !== null
                      ? `${formatImporto(ris.estratto.saldoIniziale)} → ${formatImporto(ris.estratto.saldoFinale)} €`
                      : "controllo saldi"}
                  </span>
                </div>
                {ris.fatture.length > 0 && (
                  <div>
                    <b>
                      {totali.pagate}/{ris.fatture.length}
                    </b>
                    <span>fatture pagate{totali.parziali ? `, ${totali.parziali} in parte` : ""}</span>
                  </div>
                )}
              </div>
              <div className="azioni" style={{ marginTop: 16 }}>
                <button type="button" onClick={() => scarica("xlsx")}>
                  Scarica Excel
                </button>
                <button type="button" className="secondario" onClick={() => scarica("primanota")}>
                  CSV prima nota
                </button>
                <button type="button" className="secondario" onClick={() => scarica("csv")}>
                  CSV movimenti
                </button>
              </div>
              <p className="hint" style={{ marginTop: 8 }}>
                Le categorie che cambi in tabella finiscono anche nei file scaricati.
              </p>
            </section>

            <section className="card tabella mov">
              <div className="intesta">
                <h2>Movimenti</h2>
                {totali.daVerificare > 0 && (
                  <div className="filtri" role="group" aria-label="Filtro movimenti">
                    <button type="button" className={soloVerifica ? "chip" : "chip attivo"} onClick={() => setSoloVerifica(false)}>
                      Tutti
                    </button>
                    <button type="button" className={soloVerifica ? "chip attivo" : "chip"} onClick={() => setSoloVerifica(true)}>
                      Da verificare ({totali.daVerificare})
                    </button>
                  </div>
                )}
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrizione</th>
                    <th className="num">Importo €</th>
                    <th>Categoria</th>
                    <th>Fattura</th>
                  </tr>
                </thead>
                <tbody>
                  {movimenti.map((m) => {
                    const fa = fatturaDi(m.id);
                    return (
                      <tr key={m.id} className={daVerificare(m) ? "verifica" : ""}>
                        <td className="data c-data">
                          {formatData(m.data)}
                          {m.dataValuta && m.dataValuta !== m.data && <span className="hint">val. {formatData(m.dataValuta)}</span>}
                        </td>
                        <td className="c-desc">
                          {m.descrizione}
                          {sospette.has(m.id) && <span className="nota">Il saldo stampato dalla banca dopo questa riga non torna.</span>}
                        </td>
                        <td className={`num c-imp ${m.importo >= 0 ? "pos" : "neg"}`}>{formatImporto(m.importo)}</td>
                        <td className="c-cat">
                          <select aria-label="Categoria" value={m.categoria} onChange={(e) => cambiaCategoria(m.id, e.target.value)}>
                            {CATEGORIE.map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                        </td>
                        <td className="c-fat">
                          {fa && (
                            <span className="badge" title={fa.a.motivi.join(", ")}>
                              {fa.a.parziale ? "acconto " : ""}n. {fa.f.numero}
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
              <section className="card tabella fatt">
                <h2>Fatture</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Numero</th>
                      <th>Data</th>
                      <th>Tipo</th>
                      <th>Controparte</th>
                      <th className="num">Totale €</th>
                      <th>Stato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ris.fatture.map((f) => {
                      const s = statoFattura(f, ris.abbinamenti);
                      return (
                        <tr key={f.id}>
                          <td className="f-num">n. {f.numero}</td>
                          <td className="f-data">{formatData(f.data)}</td>
                          <td className="f-tipo">{f.tipo === "attiva" ? "Emessa" : f.tipo === "passiva" ? "Ricevuta" : "?"}</td>
                          <td className="f-cp">{f.tipo === "attiva" ? f.cessionario : f.tipo === "passiva" ? f.cedente : `${f.cedente} → ${f.cessionario}`}</td>
                          <td className="num f-tot">{formatImporto(f.totale)}</td>
                          <td className="f-stato">
                            {s.stato === "pagata" && <span className="ok">{f.tipo === "attiva" ? "Incassata" : "Pagata"}</span>}
                            {s.stato === "parziale" && (
                              <span className="parz">
                                In parte: mancano {formatImporto(s.residuo)} €
                              </span>
                            )}
                            {s.stato === "aperta" && <span className="ko">Aperta</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {ris.fatture.some((f) => f.tipo === "sconosciuta") && (
                  <p className="hint">Inserisci la partita IVA del cliente per sapere quali fatture sono emesse e quali ricevute.</p>
                )}
              </section>
            )}
          </div>
        )}
      </main>

      <footer className="piede">
        <div className="contenuto">
          <span>Estratti Conto · fatto in Italia per gli studi professionali</span>
          <a href="/privacy">Privacy</a>
        </div>
      </footer>
    </>
  );
}
