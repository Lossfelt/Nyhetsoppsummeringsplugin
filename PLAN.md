# Plan: Nyhetsoppsummeringsplugin

## Mål

En nettleserutvidelse for Vivaldi (Chromium, Manifest V3) som oppsummerer nyhetsartikler. Brukeren er på en nyhetsside (f.eks. `www.nrk.no`), peker på en artikkellenke, og utvidelsen åpner artikkelen i bakgrunnen, henter ut innholdet, bruker en LLM til å oppsummere saken i én setning, og viser oppsummeringen i en popup nær lenken.

## Produktidé

Oppsummeringen skal forklare det faktiske poenget i artikkelen, ikke gjengi tittelen. Mange nyhetstitler er clickbait; målet er å vite hva saken egentlig handler om før man klikker.

## Valgte løsninger

### Interaksjon

- **Trigger:** høyreklikk-meny «Oppsummer artikkel» på en lenke, **og** hurtigtast `Alt+S` (endbar i Vivaldi).
- Hurtigtasten oppsummerer lenken musepekeren står over (sporet av content scriptet). Står ingen lenke under pekeren, skjer ingenting (ingen melding).

### LLM

- **Leverandør:** Anthropic først, modell **Haiku**, bak en pluggbar provider-abstraksjon (`summarize(tekst)`) slik at OpenRouter (OpenAI-kompatibelt, mange modeller) kan kobles på senere uten å endre kallstedene.
- **Input:** hele den ekstraherte artikkelteksten sendes (ingen trunkering i første versjon).
- **Output:** én setning på artikkelens språk som forklarer poenget. Hvis innholdet ikke er en lesbar artikkel, returneres den faste strengen «fant ingen artikkel» (UI-nivå, ikke modelloversatt).
- **Prompt:** holdes som én sentral konstant i provider-laget; kan eksponeres i innstillinger senere.

### API-nøkkel

- Limes inn i utvidelsens innstillinger (options-side) og lagres lokalt i `chrome.storage.local`. Ingen nøkler bakes inn i koden.
- Artikkelinnhold sendes til ekstern LLM (Anthropic). Akseptert for personlig bruk, også for paywall-stoff brukeren har abonnement på.

### Artikkelekstraksjon

- **A (standard):** Service worker fetcher artikkel-HTML; et offscreen-dokument parser med Mozilla Readability.js. Ingen synlig fane, raskt. Svakhet: får ikke med JS-lastet innhold, og fetch bærer ikke nødvendigvis session-cookies.
- **B (fallback):** Åpne artikkelen i en inaktiv bakgrunnsfane som arver Vivaldi-sessionen (løser paywall/innlogging), kjør Readability på fullt rendret side, hent tekst, lukk fanen.
- Utløs B automatisk når A gir for lite tekst. Ingen domeneliste i første versjon; legges til kun hvis A viser seg å feile ofte.

### Popup (resultatvisning)

- Minimal in-page tooltip nær lenken, isolert i **Shadow DOM** så sidens CSS ikke lekker inn.
- Tilstander: spinner mens den jobber → setningen. Lukkes ved klikk utenfor eller Esc.
- Ingen ekstra handlinger (åpne/kopier) i første versjon.

### Feilhåndtering

Fire feiltilstander, ingen auto-retry, ~20 s total timeout:

1. **Manglende API-nøkkel** — klikkbar melding som åpner options-siden.
2. **Klarte ikke hente artikkelen** — henting/ekstraksjon feilet (også etter fallback B).
3. **Fant ingen artikkel** — hentet, men ikke en lesbar sak.
4. **Oppsummering feilet** — API-feil, med kort årsak hvis tilgjengelig.

### Cache

- Lett LRU-cache i `chrome.storage.local`, nøklet på normalisert artikkel-URL (stripp sporingsparametre som `utm_*`).
- Tak på ~200 oppføringer, ingen tidsbasert utløp i første versjon.

### Tilganger (`manifest.json`)

- `host_permissions`: `<all_urls>` (personlig utvidelse lastet «unpacked»; bred fetch + content script uten domenevedlikehold).
- Øvrige permissions: `contextMenus`, `storage`, `scripting`, `commands`, `offscreen`.

## Arkitektur (Manifest V3)

Komponenter:

1. **`manifest.json`** — permissions over.
2. **Background service worker** — registrerer kontekstmeny, lytter på `Alt+S`, henter artikkel (A→B), kaller provider, sender resultat til content scriptet, håndterer cache.
3. **Content script** — sporer lenke under musepeker (mål for hurtigtast), viser Shadow-DOM-tooltip med lasting/resultat/feil.
4. **Offscreen-dokument** — DOM-parsing med Readability for tilnærming A.
5. **Options-side** — provider, modell, API-nøkkel; lagres i `chrome.storage.local`.
6. **LLM-provider-lag** — `summarize(tekst)`-grensesnitt. `AnthropicProvider` nå; `OpenRouterProvider` senere.

## Teknisk oppsett

- **Språk/bygg:** TypeScript + Vite med **`@crxjs/vite-plugin`** (flere entry points, manifest-håndtering, hot reload).
- **Test/kvalitet:** Vitest på rene funksjoner (URL-normalisering, cache-LRU, tekst/prompt-bygging) + ESLint/Prettier. Alt som rører `chrome.*` testes manuelt i Vivaldi.
- **Diverse:** enkle plassholder-ikoner; kort README med innlastingsinstruksjoner for Vivaldi.

## Byggerekkefølge

1. Prosjektoppsett (TypeScript, Vite, `@crxjs/vite-plugin`, ESLint/Prettier) + manifest + skjelett (service worker, content script, options-side, offscreen).
2. Options-side med nøkkellagring + Anthropic-provider (Haiku) bak `summarize`-grensesnittet.
3. Høyreklikk-flyt: lenke → hent → oppsummer → tooltip.
4. Artikkelekstraksjon: A (offscreen + Readability) med fallback til B (bakgrunnsfane).
5. Hurtigtast `Alt+S` + sporing av lenke under musepeker.
6. Cache + feiltilstander + timeout.
7. Provider-abstraksjon klargjort for OpenRouter; Vitest-dekning på rene funksjoner.
