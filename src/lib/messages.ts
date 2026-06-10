// Meldingstyper som flyter mellom utvidelsens komponenter.

// Resultatet av et oppsummeringsforsøk (background -> content script).
export type SummarizeResult =
  | { kind: 'ok'; sentence: string }
  | { kind: 'no-key' }
  | { kind: 'fetch-failed' }
  | { kind: 'not-article' }
  | { kind: 'summary-failed'; reason?: string };

// background -> content script: start en oppsummering.
// 'start' kommer fra høyreklikk-menyen og har en konkret URL.
// 'start-hovered' kommer fra hurtigtasten; content scriptet finner selv
// lenken under musepekeren.
export type CommandMessage = { type: 'start'; url: string } | { type: 'start-hovered' };

// content script -> background.
export type ContentMessage = { type: 'summarize'; url: string } | { type: 'open-options' };
