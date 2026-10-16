#!/bin/sh
cd "$(dirname "$0")"
F=""
for x in IT*.xml; do F="$F -F fatture=@$x;type=application/xml"; done
curl -sS -m 290 -o risposta.json -w 'HTTP %{http_code} in %{time_total}s\n' \
  -F "pdf=@estratto-marzo-2026.pdf;type=application/pdf" $F -F piva=03456780219 \
  https://estratti-conto.vercel.app/api/convert
