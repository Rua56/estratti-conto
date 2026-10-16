"""Estratto conto di prova con l'impaginazione tipica delle grandi banche italiane:
riepilogo saldi in testa, colonne Addebiti e Accrediti prima della descrizione, causali su più righe.
Genera anche una versione "scansionata" (solo immagini) per provare la lettura AI.

Dati, banca e persone sono inventati e ogni pagina porta la scritta FAC-SIMILE DI PROVA.
"""
import io
import json
import os
import random
import subprocess
import tempfile

from PIL import Image, ImageFilter
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

OUT = os.path.join(os.path.dirname(__file__), "..", "samples", "tipo-intesa")
os.makedirs(OUT, exist_ok=True)

INTESTATARIO = "BIANCHI ELENA - STUDIO GRAFICO"
PIVA = "07654320963"

# (data contabile, data valuta, addebito, accredito, righe descrizione)
mov = [
    ("02.05.2026", "02.05.2026", 89.90, None, ["Addebito diretto SDD", "Creditore: FASTWEB SPA", "Rif. mandato FW-0021987 fattura aprile"]),
    ("04.05.2026", "30.04.2026", None, 2440.00, ["Bonifico a Vostro favore", "Ordinante: AGENZIA VIAGGI ORIZZONTI SRL", "Causale: saldo fattura 31/2026 brochure"]),
    ("05.05.2026", "05.05.2026", 38.50, None, ["Pagamento POS carta 4321", "Ristorante Da Gino Milano"]),
    ("06.05.2026", "06.05.2026", 600.00, None, ["Bonifico disposto a favore di", "IMMOBILIARE NAVIGLI SRL", "Affitto studio maggio 2026"]),
    ("07.05.2026", "07.05.2026", 59.99, None, ["Addebito carta 4321", "ADOBE SYSTEMS SOFTWARE IRELAND", "Abbonamento Creative Cloud"]),
    ("08.05.2026", "08.05.2026", 1.00, None, ["Commissione bonifico disposto"]),
    ("11.05.2026", "08.05.2026", None, 1830.00, ["Bonifico a Vostro favore", "Ordinante: PASTICCERIA DOLCE VITA SNC", "Causale: fattura 33/2026 logo e packaging"]),
    ("12.05.2026", "12.05.2026", 72.40, None, ["Pagamento POS carta 4321", "TAMOIL STAZIONE 0451 SESTO SG"]),
    ("13.05.2026", "13.05.2026", 150.00, None, ["Prelievo Bancomat ATM", "Sportello 03069 Milano Porta Romana"]),
    ("14.05.2026", "14.05.2026", 412.00, None, ["Bonifico disposto a favore di", "TIPOGRAFIA ARTIGRAFICHE SAS", "Pagamento fattura 214 stampa cataloghi"]),
    ("15.05.2026", "15.05.2026", 24.60, None, ["Addebito diretto SDD", "Creditore: TELEPASS SPA", "Estratto conto pedaggi aprile"]),
    ("18.05.2026", "18.05.2026", 2186.43, None, ["Pagamento delega F24", "Agenzia delle Entrate", "Saldo e acconto imposte e contributi INPS"]),
    ("19.05.2026", "19.05.2026", 145.00, None, ["Addebito diretto SDD", "Creditore: ALLIANZ SPA", "Polizza RC professionale rata"]),
    ("20.05.2026", "19.05.2026", None, 976.00, ["Bonifico a Vostro favore", "Ordinante: COOPERATIVA SOCIALE IL GIRASOLE", "Causale: acconto 40% FT 35/2026"]),
    ("21.05.2026", "21.05.2026", 18.90, None, ["Pagamento POS carta 4321", "BAR CENTRALE MILANO"]),
    ("22.05.2026", "22.05.2026", 350.00, None, ["Bonifico disposto a favore di", "STUDIO ROSSI COMMERCIALISTI ASSOCIATI", "Onorario consulenza contabile I trimestre"]),
    ("25.05.2026", "25.05.2026", 47.30, None, ["Addebito diretto SDD", "Creditore: A2A ENERGIA SPA", "Bolletta luce studio"]),
    ("26.05.2026", "26.05.2026", None, 500.00, ["Giroconto da c/c 1000/00045678", "Stesso intestatario"]),
    ("27.05.2026", "27.05.2026", 129.00, None, ["Pagamento POS carta 4321", "TRENITALIA SPA biglietti online"]),
    ("28.05.2026", "28.05.2026", None, 3172.00, ["Bonifico a Vostro favore", "Ordinante: COMUNE DI SESTO SAN GIOVANNI", "Causale: mandato 1288 fattura 34/2026"]),
    ("29.05.2026", "29.05.2026", 9.00, None, ["Canone mensile conto Business"]),
    ("31.05.2026", "31.05.2026", 8.40, None, ["Imposta di bollo", "Periodo 01.04.2026 - 31.05.2026"]),
    ("31.05.2026", "31.05.2026", None, 0.42, ["Interessi creditori", "al netto della ritenuta fiscale"]),
]
saldo_iniziale = 4218.65
uscite = round(sum(m[2] or 0 for m in mov), 2)
entrate = round(sum(m[3] or 0 for m in mov), 2)
saldo_finale = round(saldo_iniziale - uscite + entrate, 2)


def it(n):
    return f"{n:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


W, H = A4
pdf_path = os.path.join(OUT, "estratto-maggio-2026.pdf")
c = canvas.Canvas(pdf_path, pagesize=A4)
X = {"dc": 34, "dv": 92, "add": 212, "acc": 282, "descr": 296}


def filigrana():
    c.saveState()
    c.setFillGray(0.88)
    c.setFont("Helvetica-Bold", 46)
    c.translate(W / 2, H / 2)
    c.rotate(35)
    c.drawCentredString(0, 0, "FAC-SIMILE DI PROVA")
    c.restoreState()


def intestazione(pagina, totale):
    filigrana()
    c.setFont("Helvetica-Bold", 15)
    c.drawString(34, H - 48, "Banca di Prova")
    c.setFont("Helvetica", 7.5)
    c.drawString(34, H - 60, "Istituto inventato - documento generato per test software")
    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(W - 34, H - 48, "Estratto conto")
    c.setFont("Helvetica", 8)
    c.drawRightString(W - 34, H - 60, f"Pagina {pagina} di {totale}")
    c.setFont("Helvetica", 8.5)
    c.drawString(34, H - 86, f"Intestato a  {INTESTATARIO}")
    c.drawString(34, H - 98, f"Partita IVA  {PIVA}")
    c.drawString(34, H - 110, "Conto corrente n. 1000/00012345  -  Filiale 03069 Milano Porta Romana")
    c.drawString(34, H - 122, "IBAN  IT07 Z030 6909 6061 0000 0012 345")
    c.drawString(34, H - 134, "Periodo dal 01.05.2026 al 31.05.2026")


def testata_colonne(y):
    c.setLineWidth(0.6)
    c.line(30, y + 11, W - 30, y + 11)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(X["dc"], y, "Data contabile")
    c.drawString(X["dv"], y, "Data valuta")
    c.drawRightString(X["add"], y, "Addebiti")
    c.drawRightString(X["acc"], y, "Accrediti")
    c.drawString(X["descr"], y, "Descrizione delle operazioni")
    c.line(30, y - 5, W - 30, y - 5)
    return y - 18


PAGINE = [mov[:13], mov[13:]]
for p, gruppo in enumerate(PAGINE, 1):
    intestazione(p, len(PAGINE))
    y = H - 160
    if p == 1:
        # Riepilogo in testa, come fanno molte banche
        c.setFillGray(0.94)
        c.rect(30, y - 46, W - 60, 52, fill=1, stroke=0)
        c.setFillGray(0)
        c.setFont("Helvetica-Bold", 8.5)
        c.drawString(40, y - 8, "Riepilogo del periodo")
        c.setFont("Helvetica", 8.5)
        righe_riep = [("Saldo contabile iniziale al 30.04.2026", saldo_iniziale), ("Totale addebiti", uscite), ("Totale accrediti", entrate)]
        for i, (k, v) in enumerate(righe_riep):
            c.drawString(40, y - 22 - i * 11, k)
            c.drawRightString(260, y - 22 - i * 11, it(v))
        c.setFont("Helvetica-Bold", 8.5)
        c.drawString(310, y - 22, "Saldo contabile finale al 31.05.2026")
        c.drawRightString(W - 40, y - 22, it(saldo_finale))
        y -= 72
    y = testata_colonne(y)
    for dc, dv, add, acc, righe in gruppo:
        c.setFont("Helvetica", 8)
        c.drawString(X["dc"], y, dc)
        c.drawString(X["dv"], y, dv)
        if add:
            c.drawRightString(X["add"], y, it(add))
        if acc:
            c.drawRightString(X["acc"], y, it(acc))
        c.drawString(X["descr"], y, righe[0])
        c.setFont("Helvetica", 7.5)
        for extra in righe[1:]:
            y -= 10
            c.drawString(X["descr"], y, extra)
        y -= 15
    if p == len(PAGINE):
        c.line(30, y + 6, W - 30, y + 6)
        c.setFont("Helvetica-Bold", 8)
        c.drawRightString(X["add"], y - 8, it(uscite))
        c.drawRightString(X["acc"], y - 8, it(entrate))
        c.drawString(X["descr"], y - 8, "Totale movimenti del periodo")
        c.drawString(X["descr"], y - 24, "Saldo contabile finale")
        c.drawRightString(W - 40, y - 24, it(saldo_finale))
    c.setFont("Helvetica", 6.5)
    c.drawString(34, 30, "FAC-SIMILE DI PROVA - banca, persone e importi inventati. Non è un documento bancario.")
    c.showPage()
c.save()

# Versione "scansionata": pagine trasformate in immagini leggermente storte e sgranate.
with tempfile.TemporaryDirectory() as tmp:
    subprocess.run(["pdftoppm", "-r", "130", "-gray", "-png", pdf_path, os.path.join(tmp, "p")], check=True)
    random.seed(7)
    pagine = []
    for nome in sorted(os.listdir(tmp)):
        im = Image.open(os.path.join(tmp, nome)).convert("L")
        im = im.rotate(random.uniform(-0.8, 0.8), expand=True, fillcolor=255).filter(ImageFilter.GaussianBlur(0.45))
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=58)
        pagine.append(Image.open(io.BytesIO(buf.getvalue())).convert("RGB"))
    pagine[0].save(os.path.join(OUT, "estratto-maggio-2026-scansione.pdf"), save_all=True, append_images=pagine[1:], resolution=130)

atteso = {"movimenti": len(mov), "saldoIniziale": saldo_iniziale, "saldoFinale": saldo_finale, "totaleAddebiti": uscite, "totaleAccrediti": entrate}
with open(os.path.join(OUT, "atteso.json"), "w") as f:
    json.dump(atteso, f, indent=2)
print(json.dumps(atteso, indent=2))
