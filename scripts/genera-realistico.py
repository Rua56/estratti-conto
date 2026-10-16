"""Genera un estratto conto realistico (3 pagine, layout con colonna saldo) e le fatture XML collegate.

Serve a provare il sito online con un documento diverso da quello di esempio.
Banca e aziende sono inventate.
"""
import json
import os
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

OUT = os.path.join(os.path.dirname(__file__), "..", "samples", "realistico")
os.makedirs(OUT, exist_ok=True)

PIVA = "03456780219"  # FALEGNAMERIA DOLOMITI SRL
CLIENTE = "FALEGNAMERIA DOLOMITI SRL"

# (data, valuta, righe descrizione, uscita, entrata)
movimenti = [
    ("01/03/2026", "01/03/2026", ["ADDEBITO SDD A2A ENERGIA SPA", "MANDATO 88123 FT GAS FEBBRAIO"], 412.37, None),
    ("02/03/2026", "28/02/2026", ["BONIFICO SEPA DA HOTEL MIRAMONTI SRL", "SALDO FATT. N. 18/2026 ARREDO CAMERE"], None, 7930.00),
    ("03/03/2026", "03/03/2026", ["PAGAMENTO POS Q8 ORTISEI", "CARTA DEBITO ****8810"], 85.20, None),
    ("04/03/2026", "04/03/2026", ["BONIFICO SEPA A LEGNAMI TRENTINI SPA", "PAG. FT 2026/0331 TAVOLE LARICE"], 3477.00, None),
    ("05/03/2026", "05/03/2026", ["COMMISSIONI BONIFICO SEPA"], 1.50, None),
    ("06/03/2026", "06/03/2026", ["PAGAMENTO POS FERRAMENTA PICHLER SNC"], 143.68, None),
    ("09/03/2026", "09/03/2026", ["ADDEBITO SDD TIM SPA", "FATTURA 4/26 LINEA FISSA E FIBRA"], 54.90, None),
    ("10/03/2026", "10/03/2026", ["BONIFICO SEPA DA STUDIO DENTISTICO DR. GRUBER", "ACCONTO 30% FT 21/2026"], None, 1464.00),
    ("11/03/2026", "11/03/2026", ["ADDEBITO RATA FINANZIAMENTO", "N. 77801234 RATA 14/60"], 1287.45, None),
    ("12/03/2026", "12/03/2026", ["PAGAMENTO POS AUTOGRILL BRENNERO"], 23.40, None),
    ("13/03/2026", "13/03/2026", ["ADDEBITO SDD AMAZON EU SARL", "ORDINE 402-7719 UTENSILI"], 219.99, None),
    ("16/03/2026", "16/03/2026", ["PAGAMENTO DELEGA F24 ONLINE", "PROT. 26031612345 IVA E RITENUTE"], 4318.62, None),
    ("16/03/2026", "16/03/2026", ["BONIFICO SEPA A VERNICI ALPINE SRL", "FT 112 DEL 10/02/2026"], 1098.00, None),
    ("17/03/2026", "17/03/2026", ["BONIFICO SEPA DA COMUNE DI SELVA", "MANDATO 455 FT 19/2026 PANCHINE"], None, 5185.00),
    ("18/03/2026", "18/03/2026", ["PRELIEVO CONTANTI ATM 03421 BOLZANO"], 250.00, None),
    ("19/03/2026", "19/03/2026", ["ADDEBITO SDD UNIPOLSAI ASSICURAZIONI", "POLIZZA RCA FURGONE"], 687.00, None),
    ("20/03/2026", "20/03/2026", ["PAGAMENTO POS ENI STATION BRESSANONE"], 92.15, None),
    ("23/03/2026", "23/03/2026", ["BONIFICO SEPA DA BAITA ROSSA DI KOSTNER M.", "FT 20/2026"], None, 2318.00),
    ("24/03/2026", "24/03/2026", ["ADDEBITO SDD ARUBA SPA", "RINNOVO DOMINIO E PEC"], 48.68, None),
    ("25/03/2026", "25/03/2026", ["BONIFICO SEPA A COMMERCIALISTA DR.SSA HOFER", "COMPETENZE I TRIMESTRE"], 915.00, None),
    ("26/03/2026", "26/03/2026", ["BONIFICO STIPENDIO MARZO", "A FAVORE DI PLONER ANDREAS"], 1890.00, None),
    ("26/03/2026", "26/03/2026", ["BONIFICO STIPENDIO MARZO", "A FAVORE DI DEMETZ LUKAS"], 1720.00, None),
    ("27/03/2026", "27/03/2026", ["VERSAMENTO CONTANTI SPORTELLO", "FIL. 0381 ORTISEI"], None, 600.00),
    ("30/03/2026", "30/03/2026", ["PAGAMENTO POS IKEA BOLZANO"], 76.50, None),
    ("31/03/2026", "31/03/2026", ["CANONE CONTO IMPRESA PLUS MARZO"], 18.00, None),
    ("31/03/2026", "31/03/2026", ["IMPOSTA DI BOLLO E/C", "PERIODO 01/01-31/03/2026"], 25.00, None),
    ("31/03/2026", "31/03/2026", ["INTERESSI CREDITORI NETTI"], None, 3.12),
]
saldo_iniziale = 9874.31


def it(n):
    return f"{n:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


c = canvas.Canvas(os.path.join(OUT, "estratto-marzo-2026.pdf"), pagesize=A4)
W, H = A4
COL = {"data": 36, "valuta": 92, "descr": 148, "uscite": 438, "entrate": 495, "saldo": 560}
PER_PAGINA = 11


def intestazione(pagina, totale_pagine):
    c.setFillGray(0.15)
    c.rect(0, H - 34, W, 34, fill=1, stroke=0)
    c.setFillGray(1)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(36, H - 23, "CASSA RURALE VAL GARDENA")
    c.setFont("Helvetica", 8)
    c.drawRightString(W - 36, H - 23, "Credito Cooperativo - Gruppo Fittizio")
    c.setFillGray(0)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(36, H - 58, "ESTRATTO CONTO CORRENTE - LISTA MOVIMENTI")
    c.setFont("Helvetica", 8.5)
    c.drawString(36, H - 74, f"Intestatario: {CLIENTE}  -  P.IVA {PIVA}")
    c.drawString(36, H - 86, "Via Rezia 112, 39046 Ortisei (BZ)")
    c.drawString(36, H - 98, "Conto n. 000004417823  -  IBAN IT 42 K 08187 58710 000004417823")
    c.drawString(36, H - 110, "Periodo: dal 01/03/2026 al 31/03/2026      Divisa: EUR")
    c.drawRightString(W - 36, H - 58, f"Pag. {pagina} di {totale_pagine}")
    y = H - 136
    c.setFillGray(0.9)
    c.rect(30, y - 5, W - 60, 15, fill=1, stroke=0)
    c.setFillGray(0)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(COL["data"], y, "DATA CONT.")
    c.drawString(COL["valuta"], y, "DATA VAL.")
    c.drawString(COL["descr"], y, "DESCRIZIONE")
    c.drawRightString(COL["uscite"], y, "USCITE")
    c.drawRightString(COL["entrate"], y, "ENTRATE")
    c.drawRightString(COL["saldo"], y, "SALDO")
    return y - 20


totale_pagine = -(-len(movimenti) // PER_PAGINA)
pagina = 1
y = intestazione(pagina, totale_pagine)
c.setFont("Helvetica-Bold", 8)
c.drawString(COL["descr"], y, "SALDO INIZIALE AL 28/02/2026")
c.drawRightString(COL["saldo"], y, it(saldo_iniziale))
y -= 18
saldo = saldo_iniziale
tot_u = tot_e = 0.0
for i, (d, v, righe, u, e) in enumerate(movimenti):
    if i and i % PER_PAGINA == 0:
        c.setFont("Helvetica-Oblique", 7.5)
        c.drawString(36, 50, f"Saldo riportato a pagina successiva: {it(saldo)}")
        c.showPage()
        pagina += 1
        y = intestazione(pagina, totale_pagine)
    c.setFont("Helvetica", 8)
    c.drawString(COL["data"], y, d)
    c.drawString(COL["valuta"], y, v)
    c.drawString(COL["descr"], y, righe[0])
    if u:
        saldo -= u
        tot_u += u
        c.drawRightString(COL["uscite"], y, it(u))
    if e:
        saldo += e
        tot_e += e
        c.drawRightString(COL["entrate"], y, it(e))
    c.drawRightString(COL["saldo"], y, it(saldo))
    for extra in righe[1:]:
        y -= 10
        c.setFont("Helvetica", 7)
        c.drawString(COL["descr"] + 8, y, extra)
    y -= 16
c.line(30, y + 6, W - 30, y + 6)
c.setFont("Helvetica-Bold", 8)
c.drawString(COL["descr"], y - 6, "TOTALE MOVIMENTI")
c.drawRightString(COL["uscite"], y - 6, it(tot_u))
c.drawRightString(COL["entrate"], y - 6, it(tot_e))
c.drawString(COL["descr"], y - 22, "SALDO FINALE AL 31/03/2026")
c.drawRightString(COL["saldo"], y - 22, it(saldo))
c.setFont("Helvetica", 6.5)
c.drawString(36, 40, "Documento generato per prova. Banca, aziende e importi sono inventati.")
c.save()


def fattura(nome, numero, data, ced, ced_piva, ces, ces_piva, totale, scadenza):
    imponibile = round(totale / 1.22, 2)
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="FPR12" xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2">
  <FatturaElettronicaHeader>
    <CedentePrestatore><DatiAnagrafici><IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>{ced_piva}</IdCodice></IdFiscaleIVA>
      <Anagrafica><Denominazione>{ced}</Denominazione></Anagrafica></DatiAnagrafici></CedentePrestatore>
    <CessionarioCommittente><DatiAnagrafici><IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>{ces_piva}</IdCodice></IdFiscaleIVA>
      <Anagrafica><Denominazione>{ces}</Denominazione></Anagrafica></DatiAnagrafici></CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali><DatiGeneraliDocumento><TipoDocumento>TD01</TipoDocumento><Divisa>EUR</Divisa>
      <Data>{data}</Data><Numero>{numero}</Numero><ImportoTotaleDocumento>{totale:.2f}</ImportoTotaleDocumento>
    </DatiGeneraliDocumento></DatiGenerali>
    <DatiBeniServizi><DatiRiepilogo><AliquotaIVA>22.00</AliquotaIVA><ImponibileImporto>{imponibile:.2f}</ImponibileImporto><Imposta>{totale - imponibile:.2f}</Imposta></DatiRiepilogo></DatiBeniServizi>
    <DatiPagamento><CondizioniPagamento>TP02</CondizioniPagamento><DettaglioPagamento><ModalitaPagamento>MP05</ModalitaPagamento>
      <DataScadenzaPagamento>{scadenza}</DataScadenzaPagamento><ImportoPagamento>{totale:.2f}</ImportoPagamento></DettaglioPagamento></DatiPagamento>
  </FatturaElettronicaBody>
</p:FatturaElettronica>
"""
    with open(os.path.join(OUT, nome), "w") as f:
        f.write(xml)


attive = [
    ("18/2026", "2026-02-12", "HOTEL MIRAMONTI SRL", "02211330214", 7930.00, "2026-03-14"),
    ("19/2026", "2026-02-20", "COMUNE DI SELVA DI VAL GARDENA", "00390090215", 5185.00, "2026-03-22"),
    ("20/2026", "2026-03-02", "BAITA ROSSA DI KOSTNER MARIA", "02987650213", 2318.00, "2026-04-01"),
    ("21/2026", "2026-03-05", "STUDIO DENTISTICO DR. GRUBER", "02876540218", 4880.00, "2026-04-04"),  # pagato solo l'acconto
    ("22/2026", "2026-03-20", "RIFUGIO SASSOLUNGO SNC", "02765430217", 3416.00, "2026-04-19"),  # non ancora pagata
]
for n, (num, data, ces, ces_piva, tot, scad) in enumerate(attive, 18):
    fattura(f"IT{PIVA}_A{n:04d}.xml", num, data, CLIENTE, PIVA, ces, ces_piva, tot, scad)
passive = [
    ("2026/0331", "2026-02-25", "LEGNAMI TRENTINI SPA", "01122330224", 3477.00, "2026-03-27"),
    ("112", "2026-02-10", "VERNICI ALPINE SRL", "01987650226", 1098.00, "2026-03-12"),
    ("57/2026", "2026-03-24", "DR.SSA ELISABETH HOFER COMMERCIALISTA", "02345670211", 915.00, "2026-03-31"),
]
for n, (num, data, ced, ced_piva, tot, scad) in enumerate(passive, 1):
    fattura(f"IT{ced_piva}_P{n:04d}.xml", num, data, ced, ced_piva, CLIENTE, PIVA, tot, scad)

atteso = {"movimenti": len(movimenti), "saldoIniziale": saldo_iniziale, "saldoFinale": round(saldo, 2),
          "totaleUscite": round(tot_u, 2), "totaleEntrate": round(tot_e, 2),
          "fattureAbbinabili": 6, "fattureAperte": ["21/2026 (solo acconto 1464)", "22/2026"]}
with open(os.path.join(OUT, "atteso.json"), "w") as f:
    json.dump(atteso, f, indent=2)
print(json.dumps(atteso, indent=2))
