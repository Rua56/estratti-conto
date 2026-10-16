// Limiti condivisi tra interfaccia e server.
export const LIMITI = {
  mbTotali: 4, // Vercel accetta richieste fino a 4,5 MB
  pagine: 40,
  fatture: 200,
  conversioniOra: 15,
};

/** SHA-256 di public/esempio/estratto-marzo-2026.pdf: l'esempio viene letto senza AI. */
export const HASH_ESEMPIO = "936bcc668da9c9c801dcaa5436379c26ffceb3946c2a1d2a4be54ccced096b47";

export const FILE_ESEMPIO = {
  pdf: "estratto-marzo-2026.pdf",
  fatture: ["IT01122330224_P0001.xml","IT01987650226_P0002.xml","IT02345670211_P0003.xml","IT03456780219_A0018.xml","IT03456780219_A0019.xml","IT03456780219_A0020.xml","IT03456780219_A0021.xml","IT03456780219_A0022.xml"],
  piva: "03456780219",
};
