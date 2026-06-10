# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

Prosjektet er i oppstartsfase. Arkitektur og valg er ferdig avklart og dokumentert i [PLAN.md](PLAN.md), men koden er ikke skrevet ennå. Repoet er ikke initialisert som git. Når byggoppsettet er på plass, oppdater kommandolisten under.

## Mål

En nettleserutvidelse for Vivaldi (Chromium, Manifest V3) som oppsummerer nyhetsartikler. Brukeren peker på en artikkellenke; utvidelsen henter artikkelen i bakgrunnen, oppsummerer saken til én setning som forklarer det faktiske poenget (anti-clickbait), og viser den i en popup nær lenken.

## Kommandoer

Ikke etablert ennå (TypeScript + Vite + `@crxjs/vite-plugin` planlagt). Forventet når oppsettet er gjort: `npm run dev` (bygg + hot reload), `npm run build`, `npm run test` (Vitest), `npm run lint`. Last den bygde utvidelsen «unpacked» i Vivaldi via `vivaldi://extensions`.

## Arkitektur (Manifest V3)

Se [PLAN.md](PLAN.md) for full plan og byggerekkefølge. Komponenter:

- **Background service worker** — kontekstmeny «Oppsummer artikkel», hurtigtast (`commands`), henter artikkel (A→B), kaller LLM-provider, sender resultat til content scriptet, håndterer cache.
- **Content script** — sporer lenke under musepeker (mål for hurtigtast), viser tooltip i **Shadow DOM** (lasting/resultat/feil) nær lenken.
- **Offscreen-dokument** — DOM-parsing med Mozilla Readability.js for tilnærming A.
- **Options-side** — provider, modell, API-nøkkel; lagres i `chrome.storage.local`.
- **LLM-provider-lag** — felles `summarize(tekst)`-grensesnitt. `AnthropicProvider` nå; `OpenRouterProvider` senere (OpenRouter er OpenAI-kompatibelt). Kallsteder skal ikke kjenne konkret leverandør.

## Fastsatte valg (bindende for implementasjonen)

- **Trigger:** høyreklikk på lenke **og** hurtigtast `Alt+S`. Hurtigtasten oppsummerer lenken under musepekeren; ingen lenke = ingen reaksjon (ingen melding).
- **LLM:** Anthropic **Haiku** bak provider-abstraksjonen. Hele artikkelteksten sendes (ingen trunkering nå).
- **Oppsummering:** én setning på **artikkelens språk** som forklarer poenget. Ikke en artikkel → fast streng «fant ingen artikkel» (UI-nivå, ikke modelloversatt).
- **API-nøkkel:** limes inn i options, lagres i `chrome.storage.local`. Aldri bak inn nøkler i koden.
- **Ekstraksjon:** offscreen + Readability (A) som standard, automatisk fallback til inaktiv bakgrunnsfane (B) når A gir for lite tekst. B arver session-cookies og løser paywall/innlogging. Ingen domeneliste i v1.
- **Popup:** minimal tooltip i Shadow DOM, spinner → setning, lukkes ved klikk utenfor / Esc. Ingen ekstra handlinger i v1.
- **Feil:** fire tilstander (manglende nøkkel → klikkbar, åpner options; klarte ikke hente; fant ingen artikkel; oppsummering feilet). Ingen auto-retry. ~20 s total timeout.
- **Cache:** LRU i `chrome.storage.local`, ~200 oppføringer, nøkkel = normalisert URL (stripp `utm_*` o.l.), ingen tidsutløp i v1.
- **Tilganger:** `host_permissions: <all_urls>`; permissions `contextMenus`, `storage`, `scripting`, `commands`, `offscreen`.
- **Bygg/test:** TypeScript + Vite + `@crxjs/vite-plugin`. Vitest på rene funksjoner (URL-normalisering, cache-LRU, tekst/prompt-bygging) + ESLint/Prettier; `chrome.*`-integrasjon testes manuelt i Vivaldi.
