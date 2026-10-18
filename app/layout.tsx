import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";

const testo = Inter({ subsets: ["latin"], variable: "--font-testo", display: "swap" });
const titoli = Newsreader({ subsets: ["latin"], variable: "--font-titoli", display: "swap", axes: ["opsz"] });

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f0ea" },
    { media: "(prefers-color-scheme: dark)", color: "#101512" },
  ],
};

const titolo = "Estratti Conto: dall'estratto conto PDF alla prima nota";
const descrizione =
  "Converti gli estratti conto PDF di qualsiasi banca italiana, anche scansionati, in Excel e prima nota: saldi ricontrollati, categorie e abbinamento alle fatture elettroniche. Per studi commercialisti.";

export const metadata: Metadata = {
  metadataBase: new URL("https://estratti-conto.vercel.app"),
  title: titolo,
  description: descrizione,
  alternates: { canonical: "/" },
  openGraph: { title: titolo, description: descrizione, type: "website", locale: "it_IT", siteName: "Estratti Conto", url: "/" },
  twitter: { card: "summary_large_image", title: titolo, description: descrizione },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${testo.variable} ${titoli.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
