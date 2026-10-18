"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIE } from "../lib/categorie";
import { OPZIONI_GESTIONALE, type OpzioniGestionale } from "../lib/esportazione-opzioni";
import { FILE_ESEMPIO, LIMITI } from "../lib/limiti";
import { formatData, formatImporto } from "../lib/numeri";
import { statoFattura } from "../lib/riconciliazione";
import type { Risultato } from "../lib/types";
import { etichettaEstratto, unisci } from "../lib/unisci";
import { useAccesso } from "./accesso-client";

type Risposta = Risultato & { avvisi: string[] };
type Fatto = { nome: string; ris: Risposta };

const pivaValida = (p: string) => !p.trim() || /^(IT)?\d{11}$/i.test(p.replace(/\s/g, ""));
const peso = (byte: number) =>
  byte < 1024 * 1024 ? `${Math.max(1, Math.round(byte / 1024))} KB` : `${(byte / 1024 / 1024).toLocaleString("it-IT", { maximumFractionDigits: 1 })} MB`;

function leggiOpzioni(): OpzioniGestionale {
  try {
    return { ...OPZIONI_GESTIONALE, ...JSON.parse(localStorage.getItem("ec_gestionale") ?? "{}") };
  } catch {
    return OPZIONI_GESTIONALE;
  }
}

export default function Convertitore() {
  const [pdfs, setPdfs] = useState<File[]>([]);
  const [xml, setXml] = useState<File[]>([]);
  const [piva, setPiva] = useState("");
  const [trascina, setTrascina] = useState(false);
  const [avanzamento, setAvanzamento] = useState<{ n: number; di: number } | null>(null);
  const [secondi, setSecondi] = useState(0);
  const [errore, setErrore] = useState<string | null>(null);
  const [falliti, setFalliti] = useState<string[]>([]);
  const [serveAbbonamento, setServeAbbonamento] = useState(false);
  const [fatti, setFatti] = useState<Fatto[]>([]);
  const [vista, setVista] = useState<number | "tutti">(0);
  const [soloVerifica, setSoloVerifica] = useState(false);
  const [opzioni, setOpzioni] = useState<OpzioniGestionale>(OPZIONI_GESTIONALE);
  const [segnala, setSegnala] = useState<"chiuso" | "aperto" | "inviato">("chiuso");
  const [nota, setNota] = useState("");
  const [emailNota, setEmailNota] = useState("");
  const accesso = useAccesso();
  const inputFile = useRef<HTMLInputElement>(null);
  const risultati = useRef<HTMLDivElement>(null);
  const inCorso = avanzamento !== null;
  const inCorsoRef = useRef(inCorso);
  inCorsoRef.current = inCorso;

  useEffect(() => setOpzioni(leggiOpzioni()), []);
  useEffect(() => {
    try {
      localStorage.setItem("ec_gestionale", JSON.stringify(opzioni));
    } catch {}
  }, [opzioni]);

  useEffect(() => {
    if (!inCorso) return;
    setSecondi(0);
    const t = setInterval(() => setSecondi((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [inCorso, avanzamento?.n]);

  function aggiungiFile(files: FileList | File[]) {
    setErrore(null);
    const nuovi: File[] = [];
    for (const f of Array.from(files)) {
      const nome = f.name.toLowerCase();
      if (f.type === "application/pdf" || nome.endsWith(".pdf")) nuovi.push(f);
      else if (nome.endsWith(".xml") || f.type.includes("xml")) setXml((prec) => (prec.some((p) => p.name === f.name) ? prec : [...prec, f]));
      else setErrore(`${f.name}: carica solo PDF (estratti conto) o XML (fatture elettroniche).`);
    }
    if (nuovi.length)
      setPdfs((prec) => {
        const tutti = [...prec, ...nuovi.filter((n) => !prec.some((p) => p.name === n.name && p.size === n.size))];
        if (tutti.length > LIMITI.pdfInsieme) setErrore(`Puoi caricare fino a ${LIMITI.pdfInsieme} estratti alla volta.`);
        return tutti.slice(0, LIMITI.pdfInsieme);
      });
  }

  const pesoXml = xml.reduce((s, f) => s + f.size, 0);
  const troppoGrande = pdfs.find((p) => p.size + pesoXml > LIMITI.mbTotali * 1024 * 1024);

  async function convertiUno(file: File, fatture: File[], partitaIva: string): Promise<Risposta> {
    const fd = new FormData();
    fd.append("pdf", file);
    fatture.forEach((f) => fd.append("fatture", f));
    fd.append("piva", partitaIva.replace(/\s/g, ""));
    const res = await fetch("/api/convert", { method: "POST", body: fd });
    const json = await res.json().catch(() => ({ errore: res.status === 413 ? "File troppo grande." : "Il server non ha risposto correttamente." }));
    if (res.status === 402) setServeAbbonamento(true);
    if (!res.ok) throw Object.assign(new Error(json.errore ?? "Errore"), { stop: res.status === 402 || res.status === 429 });
    return json;
  }

  async function converti(file = pdfs, fatture = xml, partitaIva = piva) {
    if (!file.length) return;
    setErrore(null);
    setFalliti([]);
    setServeAbbonamento(false);
    setFatti([]);
    setVista(0);
    setSoloVerifica(false);
    setSegnala("chiuso");
    const ok: Fatto[] = [];
    const ko: string[] = [];
    for (let i = 0; i < file.length; i++) {
      setAvanzamento({ n: i + 1, di: file.length });
      try {
        ok.push({ nome: file[i].name, ris: await convertiUno(file[i], fatture, partitaIva) });
        setFatti([...ok]);
      } catch (err) {
        const msg = (err as Error).message === "Failed to fetch" ? "connessione interrotta" : (err as Error).message;
        if ((err as { stop?: boolean }).stop) {
          setErrore(msg);
          break;
        }
        ko.push(`${file[i].name}: ${msg}`);
      }
    }
    setAvanzamento(null);
    setFalliti(ko);
    if (ok.length > 1) setVista("tutti");
    accesso.aggiorna();
    if (ok.length) setTimeout(() => risultati.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
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
      setPdfs([file]);
      setXml(fatture);
      setPiva(FILE_ESEMPIO.piva);
      await converti([file], fatture, FILE_ESEMPIO.piva);
    } catch {
      setErrore("Non riesco a caricare l'esempio. Riprova.");
    }
  }

  // Il bottone "Prova con un esempio" in cima alla pagina avvia l'esempio qui.
  const esempio = useRef(provaEsempio);
  esempio.current = provaEsempio;
  useEffect(() => {
    const avvia = () => !inCorsoRef.current && esempio.current();
    window.addEventListener("ec-esempio", avvia);
    return () => window.removeEventListener("ec-esempio", avvia);
  }, []);

  function ricomincia() {
    setFatti([]);
    setPdfs([]);
    setXml([]);
    setErrore(null);
    setFalliti([]);
    document.getElementById("converti")?.scrollIntoView({ behavior: "smooth" });
  }

  const daEsportare = () => (vista === "tutti" ? fatti.map((f) => f.ris) : fatti[vista] ? [fatti[vista].ris] : []);

  async function scarica(formato: "xlsx" | "csv" | "primanota" | "gestionale") {
    const elenco = daEsportare();
    if (!elenco.length) return;
    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formato, risultati: elenco, opzioni: formato === "gestionale" ? opzioni : undefined }),
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
    const unito = /^e(\d+)-(.+)$/.exec(id);
    const indice = vista === "tutti" && unito ? Number(unito[1]) - 1 : (vista as number);
    const idVero = vista === "tutti" && unito ? unito[2] : id;
    setFatti((prec) =>
      prec.map((f, i) =>
        i !== indice
          ? f
          : {
              ...f,
              ris: {
                ...f.ris,
                estratto: { ...f.ris.estratto, movimenti: f.ris.estratto.movimenti.map((m) => (m.id === idVero ? { ...m, categoria, affidabilita: 1 } : m)) },
              },
            },
      ),
    );
  }

  const ris: Risposta | null = useMemo(() => {
    if (!fatti.length) return null;
    if (vista === "tutti") return { ...unisci(fatti.map((f) => f.ris)), avvisi: [] };
    return fatti[vista]?.ris ?? null;
  }, [fatti, vista]);

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

  const categorieUsate = useMemo(() => [...new Set(fatti.flatMap((f) => f.ris.estratto.movimenti.map((m) => m.categoria)))].sort(), [fatti]);

  const fatturaDi = (movId: string) => {
    const a = ris?.abbinamenti.find((x) => x.movimentoId === movId);
    const f = a && ris?.fatture.find((x) => x.id === a.fatturaId);
    return f && a ? { f, a } : null;
  };

  async function inviaSegnalazione() {
    const e = ris?.estratto;
    const res = await fetch("/api/contatto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "segnalazione",
        messaggio: `${nota}\n\n[${e?.banca ?? "?"} · ${e?.movimenti.length ?? 0} movimenti · lettura ${e?.metodo ?? "?"} · saldi ${e?.controlloSaldi.eseguito ? (e.controlloSaldi.quadra ? "ok" : "non quadrano") : "non controllati"}]`,
        email: emailNota,
        banca: e?.banca,
        pagina: "risultati",
      }),
    });
    if (res.ok) setSegnala("inviato");
    else setErrore((await res.json().catch(() => ({}))).errore ?? "Invio non riuscito.");
  }

  const movimenti = (ris?.estratto.movimenti ?? []).filter((m) => !soloVerifica || daVerificare(m));
  const fase = secondi < 4 ? "Leggo il PDF" : secondi < 70 ? "Estraggo e controllo i movimenti" : "Quasi finito, gli estratti lunghi richiedono più tempo";
  const multi = vista === "tutti";

  return (
    <>
      <form
        id="converti"
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
          <b>Trascina qui gli estratti conto PDF</b>
          <span>Anche più conti o più mesi insieme e, se vuoi, le fatture elettroniche XML del periodo. Oppure clicca per sceglierli.</span>
        </div>

        {(pdfs.length > 0 || xml.length > 0) && (
          <ul className="file">
            {pdfs.map((p) => (
              <li key={p.name + p.size}>
                <span className="tipo">PDF</span> {p.name} <span className="hint">{peso(p.size)}</span>
                <button type="button" className="x" aria-label={`Rimuovi ${p.name}`} onClick={() => setPdfs((prec) => prec.filter((x) => x !== p))}>
                  ×
                </button>
              </li>
            ))}
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
            <button type="submit" disabled={!pdfs.length || inCorso || Boolean(troppoGrande) || !pivaValida(piva)}>
              {inCorso ? "Elaborazione..." : pdfs.length > 1 ? `Converti ${pdfs.length} estratti` : "Converti"}
            </button>
            <button type="button" className="secondario" disabled={inCorso} onClick={provaEsempio}>
              Prova con un esempio
            </button>
          </div>
        </div>

        {accesso.stato?.pagamenti && (
          <p className="hint accesso">
            {accesso.stato.abbonato ? (
              <>Abbonamento Studio attivo: conversioni illimitate.</>
            ) : (
              <>
                Conversioni gratuite rimaste questo mese: <b>{accesso.stato.gratisRimaste}</b> di {accesso.stato.gratisAlMese}. L&apos;esempio non conta.{" "}
                <a href="#prezzi">Abbonamento</a>
              </>
            )}
          </p>
        )}
        {!pdfs.length && xml.length > 0 && <p className="hint">Manca l&apos;estratto conto PDF.</p>}
        {troppoGrande && (
          <p className="errore">
            {troppoGrande.name} con le fatture supera {LIMITI.mbTotali} MB: carica meno fatture o un estratto più corto.
          </p>
        )}
        {errore && <p className="errore">{errore}</p>}
        {serveAbbonamento && (
          <div className="avviso">
            <a href="#prezzi">Attiva l&apos;abbonamento Studio</a> per continuare. Se l&apos;hai già, inserisci il codice di accesso nella sezione prezzi.
          </div>
        )}
        {inCorso && avanzamento && (
          <div className="progresso" role="status">
            <div className="spinner" aria-hidden />
            <span>
              {avanzamento.di > 1 && <b>Estratto {avanzamento.n} di {avanzamento.di}. </b>}
              {fase}... <span className="hint">{secondi} s · di solito tra 20 e 60 secondi per estratto</span>
            </span>
          </div>
        )}
        <p className="privacy">
          I file restano in memoria il tempo dell&apos;elaborazione e non vengono salvati. <a href="/privacy">Privacy</a>
        </p>
      </form>

      {falliti.length > 0 && (
        <div className="avviso">
          Non sono riuscito a leggere: {falliti.join("; ")}
        </div>
      )}

      {ris && (
        <div ref={risultati} className="risultati">
          {fatti.length > 1 && (
            <div className="filtri estratti" role="tablist" aria-label="Estratti convertiti">
              <button type="button" role="tab" aria-selected={multi} className={multi ? "chip attivo" : "chip"} onClick={() => setVista("tutti")}>
                Tutti insieme ({fatti.length})
              </button>
              {fatti.map((f, i) => (
                <button key={f.nome + i} type="button" role="tab" aria-selected={vista === i} className={vista === i ? "chip attivo" : "chip"} onClick={() => setVista(i)}>
                  {etichettaEstratto(f.ris.estratto)}
                </button>
              ))}
            </div>
          )}

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
                  {multi
                    ? "saldi di tutti gli estratti"
                    : ris.estratto.saldoIniziale !== null && ris.estratto.saldoFinale !== null
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
                {multi ? "Excel con tutti gli estratti" : "Scarica Excel"}
              </button>
              <button type="button" className="secondario" onClick={() => scarica("primanota")}>
                CSV prima nota
              </button>
              <button type="button" className="secondario" onClick={() => scarica("csv")}>
                CSV movimenti
              </button>
            </div>

            <details className="gestionale">
              <summary>CSV per il tuo gestionale (codici conto, separatori, formato data)</summary>
              <p className="hint">
                Imposta il tracciato richiesto dall&apos;importazione del tuo programma di contabilità. Le scelte restano salvate su questo computer.
              </p>
              <div className="opzioni">
                <label>
                  Tracciato
                  <select value={opzioni.tracciato} onChange={(e) => setOpzioni({ ...opzioni, tracciato: e.target.value as OpzioniGestionale["tracciato"] })}>
                    <option value="primanota">Prima nota: conto dare e conto avere</option>
                    <option value="movimenti">Movimenti: importo con segno</option>
                  </select>
                </label>
                <label>
                  Separatore
                  <select value={opzioni.separatore} onChange={(e) => setOpzioni({ ...opzioni, separatore: e.target.value as OpzioniGestionale["separatore"] })}>
                    <option value=";">Punto e virgola (;)</option>
                    <option value=",">Virgola (,)</option>
                    <option value={"\t"}>Tabulazione</option>
                  </select>
                </label>
                <label>
                  Decimali
                  <select value={opzioni.decimale} onChange={(e) => setOpzioni({ ...opzioni, decimale: e.target.value as OpzioniGestionale["decimale"] })}>
                    <option value=",">1234,56</option>
                    <option value=".">1234.56</option>
                  </select>
                </label>
                <label>
                  Data
                  <select value={opzioni.formatoData} onChange={(e) => setOpzioni({ ...opzioni, formatoData: e.target.value as OpzioniGestionale["formatoData"] })}>
                    <option value="gg/mm/aaaa">31/12/2026</option>
                    <option value="gg-mm-aaaa">31-12-2026</option>
                    <option value="aaaa-mm-gg">2026-12-31</option>
                    <option value="ggmmaaaa">31122026</option>
                  </select>
                </label>
                <label>
                  Conto banca
                  <input type="text" value={opzioni.contoBanca} onChange={(e) => setOpzioni({ ...opzioni, contoBanca: e.target.value })} placeholder="es. 18.05.001" />
                </label>
                <label className="spunta">
                  <input type="checkbox" checked={opzioni.intestazione} onChange={(e) => setOpzioni({ ...opzioni, intestazione: e.target.checked })} /> Riga di intestazione
                </label>
              </div>
              <table className="conti">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Codice conto nel tuo piano dei conti</th>
                  </tr>
                </thead>
                <tbody>
                  {categorieUsate.map((c) => (
                    <tr key={c}>
                      <td>{c}</td>
                      <td>
                        <input
                          type="text"
                          aria-label={`Codice conto per ${c}`}
                          value={opzioni.conti[c] ?? ""}
                          placeholder="lascia vuoto per usare il nome"
                          onChange={(e) => setOpzioni({ ...opzioni, conti: { ...opzioni.conti, [c]: e.target.value } })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="azioni">
                <button type="button" onClick={() => scarica("gestionale")}>
                  Scarica CSV per il gestionale
                </button>
              </div>
              <p className="hint">
                Usi TeamSystem, Zucchetti, Profis o un altro gestionale e il file non entra al primo colpo?{" "}
                <a href="#contatti">Scrivici quale usi</a>: stiamo preparando i tracciati pronti.
              </p>
            </details>
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
                        {multi && m.conto && <span className="hint conto">{m.conto}</span>}
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
                          {s.stato === "parziale" && <span className="parz">In parte: mancano {formatImporto(s.residuo)} €</span>}
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

          <section className="card segnala">
            {segnala === "chiuso" && (
              <p>
                Qualcosa non torna in questa lettura?{" "}
                <button type="button" className="link" onClick={() => setSegnala("aperto")}>
                  Segnalacelo
                </button>{" "}
                e lo correggiamo.
              </p>
            )}
            {segnala === "aperto" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  inviaSegnalazione();
                }}
              >
                <label htmlFor="nota">Cosa non ha funzionato?</label>
                <textarea id="nota" rows={3} required value={nota} onChange={(e) => setNota(e.target.value)} placeholder="es. manca un movimento del 12/03, l'importo del bonifico è sbagliato..." />
                <label htmlFor="email-nota">
                  Email <span className="hint">facoltativa, per risponderti</span>
                </label>
                <input id="email-nota" type="email" value={emailNota} onChange={(e) => setEmailNota(e.target.value)} />
                <p className="hint">Inviamo solo il testo che scrivi e il nome della banca, mai il PDF o i movimenti.</p>
                <div className="azioni">
                  <button type="submit">Invia segnalazione</button>
                  <button type="button" className="secondario" onClick={() => setSegnala("chiuso")}>
                    Annulla
                  </button>
                </div>
              </form>
            )}
            {segnala === "inviato" && <p className="ok">Grazie, segnalazione ricevuta.</p>}
          </section>
        </div>
      )}
    </>
  );
}
