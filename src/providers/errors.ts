// Leverandørfeil klassifisert slik at UI kan gi en presis melding uten å
// kjenne den konkrete leverandørens feiltyper.
export type ProviderErrorKind = 'auth' | 'rate-limit' | 'other';

export class ProviderError extends Error {
  constructor(
    readonly kind: ProviderErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export function kindFromStatus(status: number | undefined): ProviderErrorKind {
  if (status === 401 || status === 403) return 'auth';
  if (status === 429) return 'rate-limit';
  return 'other';
}
