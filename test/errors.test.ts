import { describe, it, expect } from 'vitest';
import { kindFromStatus } from '../src/providers/errors';
import { summaryCacheKey } from '../src/lib/cache';

describe('kindFromStatus', () => {
  it('tolker 401 og 403 som avvist nøkkel', () => {
    expect(kindFromStatus(401)).toBe('auth');
    expect(kindFromStatus(403)).toBe('auth');
  });

  it('tolker 429 som for mange forespørsler', () => {
    expect(kindFromStatus(429)).toBe('rate-limit');
  });

  it('tolker andre statuser og manglende status som annen feil', () => {
    expect(kindFromStatus(500)).toBe('other');
    expect(kindFromStatus(undefined)).toBe('other');
  });
});

describe('summaryCacheKey', () => {
  const url = 'https://example.com/sak?utm_source=x';

  it('gir ulik nøkkel for ulike modeller', () => {
    expect(summaryCacheKey(url, 'anthropic', 'a')).not.toBe(summaryCacheKey(url, 'openai', 'a'));
    expect(summaryCacheKey(url, 'openai', 'a')).not.toBe(summaryCacheKey(url, 'openai', 'b'));
  });

  it('normaliserer URL-en i nøkkelen', () => {
    expect(summaryCacheKey(url, 'openai', 'a')).toBe(
      summaryCacheKey('https://example.com/sak', 'openai', 'a'),
    );
  });
});
