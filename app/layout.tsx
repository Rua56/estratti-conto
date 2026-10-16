import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Estratti Conto: da PDF a contabilità",
  description: "Converti gli estratti conto PDF delle banche italiane in Excel e prima nota, con categorie e abbinamento alle fatture elettroniche.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
