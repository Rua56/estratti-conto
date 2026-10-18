import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="it">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
