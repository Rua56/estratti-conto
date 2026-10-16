# Estratti Conto: da PDF a contabilità

MVP per commercialisti e PMI italiane: carichi l'estratto conto PDF e ottieni i movimenti
categorizzati, il controllo dei saldi, l'abbinamento con le fatture elettroniche XML dello SDI
e gli export per Excel e prima nota.

## Avvio

```bash
npm install
npm run dev          # http://localhost:3000
npm run prova        # prova end-to-end sugli esempi in samples/
npm test             # controlli automatici (regole, saldi, acconti, export), senza costi AI
```

Per la lettura con AI (necessaria per scansioni e layout insoliti) imposta la chiave:

```bash
export ANTHROPIC_API_KEY=...
# facoltativo: ANTHROPIC_MODEL=claude-opus-5-5 (predefinito)
```

Senza chiave l'app usa il riconoscimento a regole, che funziona sui PDF digitali con
colonne Dare/Avere (o Uscite/Entrate, Addebiti/Accrediti).

## Come funziona

| File | Cosa fa |
| --- | --- |
| `lib/estrazione-ai.ts` | Invia il PDF a Claude e riceve i movimenti in JSON validato (structured outputs), già categorizzati. Fallback lato server attivo in caso di rifiuto. |
| `lib/estrazione-regole.ts` | Legge il testo con le coordinate e ricostruisce le righe usando le colonne dell'intestazione. |
| `lib/riconciliazione.ts` | Controllo saldi (iniziale + movimenti = finale) e abbinamento movimenti-fatture per importo, numero, nome e data. |
| `lib/fatturapa.ts` | Lettura delle fatture FatturaPA, attive o passive in base alla partita IVA del cliente. |
| `lib/esportazione.ts` | Excel (movimenti, riepilogo, totali per categoria, stato fatture), CSV movimenti e CSV prima nota con separatore `;` e virgola decimale. |
| `lib/categorie.ts` | Piano dei conti semplificato e regole per parole chiave. |

I file caricati vengono elaborati in memoria e non vengono salvati.

Limiti (in `lib/limiti.ts`): 4 MB per richiesta (tetto di Vercel), 40 pagine, 15 conversioni l'ora per IP.
Il pulsante "Prova con un esempio" usa `public/esempio/` e viene letto con le regole, senza costi AI.
Ogni lettura AI scrive nei log di Vercel i token usati, per stimare il costo per pagina.

## Prossimi passi

- Tracciati di importazione specifici per TeamSystem, Zucchetti, Fatture in Cloud (da verificare sulle specifiche ufficiali).
- Piano dei conti personalizzabile per studio e apprendimento dalle correzioni.
- Account, abbonamenti Stripe e limiti di pagine per piano.
- Test su estratti conto reali delle principali banche (Intesa, UniCredit, BPER, Banco BPM, Poste, Fineco).
