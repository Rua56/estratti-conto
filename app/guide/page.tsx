import type { Metadata } from "next";
import { ARTICOLI, dataEstesa } from "../../lib/guide";
import Barra from "./Barra";

export const metadata: Metadata = {
  title: "Guide per lo studio · Estratti Conto",
  description: "Guide pratiche per commercialisti e studi contabili su estratti conto, prima nota, riconciliazione bancaria e fatture elettroniche.",
  alternates: { canonical: "/guide" },
};

export default function Guide() {
  const elenco = [...ARTICOLI].sort((a, b) => b.data.localeCompare(a.data));
  return (
    <>
      <Barra />
      <main className="guide">
        <h1>Guide per lo studio</h1>
        <p className="guide-sub">Estratti conto, prima nota e riconciliazione bancaria, spiegati passo per passo per chi ci lavora ogni giorno.</p>
        <ul className="guide-elenco">
          {elenco.map((a) => (
            <li key={a.slug}>
              <a href={`/guide/${a.slug}`}>
                <h2>{a.titolo}</h2>
                <p>{a.descrizione}</p>
                <time dateTime={a.data}>{dataEstesa(a.data)}</time>
              </a>
            </li>
          ))}
        </ul>
      </main>
      <footer className="piede">
        <div className="piede-riga">
          <span>Estratti Conto · fatto in Italia per gli studi professionali.</span>
          <span className="azioni">
            <a href="/#converti">Converti</a>
            <a href="/privacy">Privacy</a>
          </span>
        </div>
      </footer>
    </>
  );
}
