// Utilità per numeri e date nel formato italiano.

/** "1.234,56" | "-1.234,56" | "1234.56" -> numero */
export function parseImporto(s: string): number | null {
  const t = s.replace(/[€\s]/g, "").replace(/EUR/i, "");
  if (!t) return null;
  let n: number;
  if (/^[-+]?\d{1,3}(\.\d{3})*(,\d+)?$/.test(t) || /^[-+]?\d+,\d+$/.test(t)) {
    n = Number(t.replace(/\./g, "").replace(",", "."));
  } else if (/^[-+]?\d+(\.\d+)?$/.test(t)) {
    n = Number(t);
  } else return null;
  return Number.isFinite(n) ? n : null;
}

/** "31/01/2026" | "31.01.26" | "31-01-2026" -> "2026-01-31" */
export function parseData(s: string): string | null {
  const m = s.trim().match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/);
  if (!m) return null;
  const [, g, mm, a] = m;
  const anno = a.length === 2 ? `20${a}` : a;
  const d = `${anno}-${mm.padStart(2, "0")}-${g.padStart(2, "0")}`;
  return Number.isNaN(Date.parse(d)) ? null : d;
}

export const arrotonda = (n: number) => Math.round(n * 100) / 100;

export function formatImporto(n: number): string {
  // useGrouping "always": in it-IT le cifre da 4 non avrebbero il punto (1464,00 invece di 1.464,00).
  return n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" } as Intl.NumberFormatOptions);
}

export function formatData(iso: string | null): string {
  if (!iso) return "";
  const [a, m, g] = iso.split("-");
  return `${g}/${m}/${a}`;
}

export function giorniTra(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}
