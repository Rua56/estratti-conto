"""Genera un estratto conto PDF di esempio e alcune fatture FatturaPA per i test."""
import os
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

OUT = os.path.join(os.path.dirname(__file__), "..", "samples")
os.makedirs(OUT, exist_ok=True)

PIVA_CLIENTE = "01234567890"

movimenti = [
    ("02/01/2026", "02/01/2026", ["BONIFICO A VOSTRO FAVORE DA ROSSI SRL", "SALDO FATTURA N. 12/2025"], None, 1830.00),
    ("03/01/2026", "03/01/2026", ["PAGAMENTO POS ESSO STAZIONE 1234", "CARTA ****5521"], 62.40, None),
    ("05/01/2026", "05/01/2026", ["ADDEBITO SDD ENEL ENERGIA SPA", "FATTURA LUCE DICEMBRE"], 148.90, None),
    ("08/01/2026", "07/01/2026", ["BONIFICO A FAVORE DI TIPOGRAFIA BIANCHI SNC", "PAGAMENTO FT 45 DEL 15/12/2025"], 976.00, None),
    ("10/01/2026", "10/01/2026", ["PAGAMENTO DELEGA F24", "AGENZIA DELLE ENTRATE"], 1204.55, None),
    ("12/01/2026", "12/01/2026", ["CANONE MENSILE CONTO BUSINESS"], 12.00, None),
    ("15/01/2026", "15/01/2026", ["BONIFICO A VOSTRO FAVORE DA VERDI E FIGLI SPA", "RIF. FT 13"], None, 2440.00),
    ("20/01/2026", "20/01/2026", ["ADDEBITO DIRETTO ARUBA SPA HOSTING"], 35.99, None),
    ("27/01/2026", "27/01/2026", ["BONIFICO STIPENDIO GENNAIO", "A FAVORE DI MARIO NERI"], 1650.00, None),
    ("29/01/2026", "29/01/2026", ["PRELIEVO BANCOMAT ATM 00321 MILANO"], 200.00, None),
    ("31/01/2026", "31/01/2026", ["COMPETENZE DI CHIUSURA", "IMPOSTA DI BOLLO"], 8.50, None),
]
saldo_iniziale = 5320.75


def it(n):
    return f"{n:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


c = canvas.Canvas(os.path.join(OUT, "estratto-esempio.pdf"), pagesize=A4)
W, H = A4
X = {"data": 40, "valuta": 105, "descr": 170, "dare": 420, "avere": 500}


def intestazione(pagina):
    c.setFont("Helvetica-Bold", 14)
    c.drawString(40, H - 50, "Banca Esempio S.p.A.")
    c.setFont("Helvetica", 10)
    c.drawString(40, H - 68, "Estratto conto corrente dal 01/01/2026 al 31/01/2026")
    c.drawString(40, H - 82, "Intestato a: STUDIO ALFA SRL")
    c.drawString(40, H - 96, "IBAN: IT60 X054 2811 1010 0000 0123 456")
    c.drawRightString(W - 40, H - 50, f"Pagina {pagina}")
    c.setFont("Helvetica-Bold", 9)
    y = H - 130
    c.drawString(X["data"], y, "DATA")
    c.drawString(X["valuta"], y, "VALUTA")
    c.drawString(X["descr"], y, "DESCRIZIONE OPERAZIONE")
    c.drawRightString(X["dare"] + 40, y, "DARE")
    c.drawRightString(X["avere"] + 50, y, "AVERE")
    c.line(40, y - 4, W - 40, y - 4)
    return y - 20


pagina = 1
y = intestazione(pagina)
c.setFont("Helvetica", 9)
c.drawString(X["descr"], y, "SALDO INIZIALE")
c.drawRightString(X["avere"] + 50, y, it(saldo_iniziale))
y -= 18
saldo = saldo_iniziale
for i, (d, v, righe, dare, avere) in enumerate(movimenti):
    if i == 7:  # salto pagina per provare la lettura multipagina
        c.drawString(40, 60, "SEGUE")
        c.showPage()
        pagina += 1
        y = intestazione(pagina)
        c.setFont("Helvetica", 9)
    c.drawString(X["data"], y, d)
    c.drawString(X["valuta"], y, v)
    c.drawString(X["descr"], y, righe[0])
    if dare:
        c.drawRightString(X["dare"] + 40, y, it(dare))
        saldo -= dare
    if avere:
        c.drawRightString(X["avere"] + 50, y, it(avere))
        saldo += avere
    for extra in righe[1:]:
        y -= 12
        c.drawString(X["descr"], y, extra)
    y -= 18
c.setFont("Helvetica-Bold", 9)
c.drawString(X["descr"], y, "SALDO FINALE")
c.drawRightString(X["avere"] + 50, y, it(saldo))
c.save()
print(f"saldo finale atteso: {saldo:.2f}")


def fattura(nome, numero, data, cedente, ced_piva, cessionario, ces_piva, totale, scadenza):
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="FPR12" xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2">
  <FatturaElettronicaHeader>
    <CedentePrestatore><DatiAnagrafici><IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>{ced_piva}</IdCodice></IdFiscaleIVA>
      <Anagrafica><Denominazione>{cedente}</Denominazione></Anagrafica></DatiAnagrafici></CedentePrestatore>
    <CessionarioCommittente><DatiAnagrafici><IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>{ces_piva}</IdCodice></IdFiscaleIVA>
      <Anagrafica><Denominazione>{cessionario}</Denominazione></Anagrafica></DatiAnagrafici></CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali><DatiGeneraliDocumento><TipoDocumento>TD01</TipoDocumento><Divisa>EUR</Divisa>
      <Data>{data}</Data><Numero>{numero}</Numero><ImportoTotaleDocumento>{totale:.2f}</ImportoTotaleDocumento>
    </DatiGeneraliDocumento></DatiGenerali>
    <DatiBeniServizi><DatiRiepilogo><AliquotaIVA>22.00</AliquotaIVA><ImponibileImporto>{totale/1.22:.2f}</ImponibileImporto><Imposta>{totale - totale/1.22:.2f}</Imposta></DatiRiepilogo></DatiBeniServizi>
    <DatiPagamento><CondizioniPagamento>TP02</CondizioniPagamento><DettaglioPagamento><ModalitaPagamento>MP05</ModalitaPagamento>
      <DataScadenzaPagamento>{scadenza}</DataScadenzaPagamento><ImportoPagamento>{totale:.2f}</ImportoPagamento></DettaglioPagamento></DatiPagamento>
  </FatturaElettronicaBody>
</p:FatturaElettronica>
"""
    with open(os.path.join(OUT, nome), "w") as f:
        f.write(xml)


fattura("IT01234567890_00012.xml", "12/2025", "2025-12-18", "STUDIO ALFA SRL", PIVA_CLIENTE, "ROSSI SRL", "09876543210", 1830.00, "2026-01-17")
fattura("IT01234567890_00013.xml", "13", "2026-01-05", "STUDIO ALFA SRL", PIVA_CLIENTE, "VERDI E FIGLI SPA", "05555555555", 2440.00, "2026-01-20")
fattura("IT01234567890_00014.xml", "14", "2026-01-22", "STUDIO ALFA SRL", PIVA_CLIENTE, "GIALLI SRL", "04444444444", 915.00, "2026-02-21")
fattura("IT07777777777_00045.xml", "45", "2025-12-15", "TIPOGRAFIA BIANCHI SNC", "07777777777", "STUDIO ALFA SRL", PIVA_CLIENTE, 976.00, "2026-01-14")
print("esempi generati in", os.path.abspath(OUT))
