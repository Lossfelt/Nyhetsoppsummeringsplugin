import { describe, it, expect } from 'vitest';
import { normalizeUrl } from '../src/lib/url';

describe('normalizeUrl', () => {
  it('fjerner utm-parametre', () => {
    expect(normalizeUrl('https://nrk.no/sak?utm_source=fb&utm_medium=social')).toBe(
      'https://nrk.no/sak',
    );
  });

  it('beholder reelle query-parametre', () => {
    expect(normalizeUrl('https://nrk.no/sak?id=42&utm_campaign=x')).toBe(
      'https://nrk.no/sak?id=42',
    );
  });

  it('fjerner kjente klikk-id-parametre', () => {
    expect(normalizeUrl('https://vg.no/a?fbclid=abc&gclid=def')).toBe('https://vg.no/a');
  });

  it('stripper fragment', () => {
    expect(normalizeUrl('https://nrk.no/sak#avsnitt-3')).toBe('https://nrk.no/sak');
  });

  it('senker store bokstaver i vertsnavn', () => {
    expect(normalizeUrl('https://NRK.no/Sak')).toBe('https://nrk.no/Sak');
  });

  it('returnerer ugyldig input uendret', () => {
    expect(normalizeUrl('ikke en url')).toBe('ikke en url');
  });
});
