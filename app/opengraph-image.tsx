import { ImageResponse } from "next/og";

export const alt = "Estratti Conto: dall'estratto conto PDF alla prima nota";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const righe = [
  ["02/05", "Bonifico da Agenzia Orizzonti · fatt. 31/2026", "+2.440,00", "Incassi da clienti"],
  ["06/05", "Affitto studio maggio", "−600,00", "Affitti e locazioni"],
  ["18/05", "Delega F24 Agenzia delle Entrate", "−2.186,43", "F24 imposte e contributi"],
  ["25/05", "A2A Energia bolletta luce", "−47,30", "Utenze"],
];

export default function Immagine() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#f7f7f5", padding: "56px 64px", fontFamily: "sans-serif", color: "#1c1c1a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34, fontWeight: 700 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "#1f5f4a", color: "#f7f7f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 }}>€</div>
          Estratti Conto
        </div>
        <div style={{ fontSize: 58, fontWeight: 700, lineHeight: 1.1, marginTop: 36, maxWidth: 1000 }}>Dall&apos;estratto conto PDF alla prima nota, in un minuto</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 36, background: "#ffffff", border: "1px solid #e3e3df", borderRadius: 16, padding: "12px 24px" }}>
          {righe.map(([d, desc, imp, cat]) => (
            <div key={d + desc} style={{ display: "flex", alignItems: "center", fontSize: 24, padding: "10px 0", borderBottom: "1px solid #eeeeea" }}>
              <div style={{ width: 90, color: "#6b6b66" }}>{d}</div>
              <div style={{ flex: 1 }}>{desc}</div>
              <div style={{ width: 170, textAlign: "right", justifyContent: "flex-end", display: "flex", color: imp.startsWith("+") ? "#1f7a4d" : "#b3261e", fontWeight: 600 }}>{imp}</div>
              <div style={{ width: 300, marginLeft: 24, display: "flex", color: "#1f5f4a", background: "#e6f0ec", borderRadius: 999, padding: "4px 14px", fontSize: 20 }}>{cat}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24, fontSize: 24, color: "#6b6b66" }}>Saldi ricontrollati · fatture SDI abbinate · Excel e CSV per il gestionale</div>
      </div>
    ),
    size,
  );
}
