import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARTICOLI, articolo, blocchi, dataEstesa } from "../../../lib/guide";
import Barra from "../Barra";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => ARTICOLI.map((a) => ({ slug: a.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = articolo((await params).slug);
  if (!a) return {};
  return {
    title: `${a.titolo} · Estratti Conto`,
    description: a.descrizione,
    alternates: { canonical: `/guide/${a.slug}` },
    openGraph: { title: a.titolo, description: a.descrizione, type: "article", locale: "it_IT", publishedTime: a.data, url: `/guide/${a.slug}` },
  };
}

export default async function PaginaArticolo({ params }: Props) {
  const a = articolo((await params).slug);
  if (!a) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.titolo,
    description: a.descrizione,
    datePublished: a.data,
    inLanguage: "it",
    mainEntityOfPage: `https://estratti-conto.vercel.app/guide/${a.slug}`,
    author: { "@type": "Organization", name: "Estratti Conto" },
    publisher: { "@type": "Organization", name: "Estratti Conto" },
  };
  return (
    <>
      <Barra />
      <main className="articolo">
        <p className="articolo-indietro">
          <a href="/guide">Tutte le guide</a>
        </p>
        <h1>{a.titolo}</h1>
        <p className="articolo-data">
          <time dateTime={a.data}>{dataEstesa(a.data)}</time>
        </p>
        <div className="articolo-testo">
          {blocchi(a.testo).map((b, i) =>
            b.tipo === "h2" ? (
              <h2 key={i}>{b.testo}</h2>
            ) : b.tipo === "ul" ? (
              <ul key={i}>
                {b.voci.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
            ) : (
              <p key={i}>{b.testo}</p>
            ),
          )}
        </div>
        <aside className="articolo-invito">
          <h2>Prova sul tuo prossimo estratto</h2>
          <p>Tre conversioni gratuite al mese, senza registrarti. Oppure prova subito con l&apos;estratto di esempio.</p>
          <a className="bottone grande chiaro" href="/#converti">
            Converti un estratto conto
          </a>
        </aside>
      </main>
      <footer className="piede">
        <div className="piede-riga">
          <span>Estratti Conto · fatto in Italia per gli studi professionali.</span>
          <span className="azioni">
            <a href="/guide">Guide</a>
            <a href="/#converti">Converti</a>
            <a href="/privacy">Privacy</a>
          </span>
        </div>
      </footer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
