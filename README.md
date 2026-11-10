# Nyhetsoppsummering

Nettleserutvidelse for Vivaldi (Chromium, Manifest V3) som oppsummerer en nyhetsartikkel til én setning som forklarer det faktiske poenget. Pek på en artikkellenke, høyreklikk «Oppsummer artikkel» eller trykk `Alt+S`, og oppsummeringen vises i en liten popup ved lenken.

Se [PLAN.md](PLAN.md) for full plan og [CLAUDE.md](CLAUDE.md) for arkitektur og fastsatte valg.

## Utvikling

```bash
npm install
npm run gen:icons   # genererer plassholder-ikoner (engangsoppgave)
npm run dev         # bygg + hot reload til dist/
npm run build       # produksjonsbygg til dist/
npm run typecheck   # tsc --noEmit
npm run test        # vitest
npm run lint        # eslint + prettier --check
```

## Last inn i Vivaldi

1. Kjør `npm run build` (eller `npm run dev`).
2. Åpne `vivaldi://extensions`, slå på «Developer mode».
3. «Load unpacked» og pek på `dist/`-mappa.
4. Åpne utvidelsens innstillinger, velg leverandør (Anthropic eller OpenAI), lim inn API-nøkkel og velg modell. Modellisten hentes fra leverandøren hver gang innstillingssiden åpnes.

Hurtigtasten `Alt+S` kan endres under `vivaldi://extensions/shortcuts`.

## Oppsett

- **Stack:** TypeScript + Vite + `@crxjs/vite-plugin`.
- **LLM:** Anthropic eller OpenAI bak et pluggbart provider-lag (`src/providers/`). Standardmodeller: `claude-haiku-5-5` og `gpt-6-luna`. Nøkkel og modell lagres per leverandør.
- **Ekstraksjon:** offscreen-dokument med Readability (A), fallback til inaktiv bakgrunnsfane (B) for JS-tunge sider og paywall du har tilgang til.
- **API-nøkkel:** lagres lokalt i `chrome.storage.local`, aldri i koden.
