// System-prompten holdes som én sentral konstant. Den kan eksponeres i
// innstillingene senere hvis vi vil eksperimentere.
export const SUMMARY_SYSTEM_PROMPT = [
  'Du får brødteksten fra en nyhetsartikkel.',
  'Skriv én enkelt setning, på samme språk som artikkelen, som forklarer hva',
  'saken faktisk handler om, slik at leseren forstår poenget uten å stole på en',
  'tittel som kan være klikkagn. Vær konkret og nøytral.',
  'Svar med kun denne ene setningen, uten innledning, anførselstegn eller punktliste.',
].join(' ');

// Lengdegrense for innsendt artikkeltekst. Hele teksten sendes som standard;
// dette er kun en sikkerhetsventil mot ekstremt lange sider.
export const MAX_ARTICLE_CHARS = 50000;

export function prepareArticleText(text: string): string {
  const trimmed = text.trim();
  return trimmed.length > MAX_ARTICLE_CHARS ? trimmed.slice(0, MAX_ARTICLE_CHARS) : trimmed;
}
