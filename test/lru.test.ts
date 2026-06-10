import { describe, it, expect } from 'vitest';
import { lruGet, lruSet, type LruEntry } from '../src/lib/lru';

function keys<T>(entries: LruEntry<T>[]): string[] {
  return entries.map((e) => e.key);
}

describe('lruSet', () => {
  it('legger nye oppføringer bakerst', () => {
    let entries: LruEntry<string>[] = [];
    entries = lruSet(entries, 'a', '1', 3);
    entries = lruSet(entries, 'b', '2', 3);
    expect(keys(entries)).toEqual(['a', 'b']);
  });

  it('overskriver eksisterende nøkkel og flytter den bakerst', () => {
    let entries: LruEntry<string>[] = [];
    entries = lruSet(entries, 'a', '1', 3);
    entries = lruSet(entries, 'b', '2', 3);
    entries = lruSet(entries, 'a', '1b', 3);
    expect(keys(entries)).toEqual(['b', 'a']);
    expect(entries[1].value).toBe('1b');
  });

  it('kutter de eldste når maks overskrides', () => {
    let entries: LruEntry<string>[] = [];
    entries = lruSet(entries, 'a', '1', 2);
    entries = lruSet(entries, 'b', '2', 2);
    entries = lruSet(entries, 'c', '3', 2);
    expect(keys(entries)).toEqual(['b', 'c']);
  });
});

describe('lruGet', () => {
  it('returnerer undefined ved bom og lar lista være', () => {
    const entries = lruSet([], 'a', '1', 3);
    const result = lruGet(entries, 'mangler');
    expect(result.value).toBeUndefined();
    expect(keys(result.entries)).toEqual(['a']);
  });

  it('flytter treffet bakerst (markerer som sist brukt)', () => {
    let entries: LruEntry<string>[] = [];
    entries = lruSet(entries, 'a', '1', 3);
    entries = lruSet(entries, 'b', '2', 3);
    const result = lruGet(entries, 'a');
    expect(result.value).toBe('1');
    expect(keys(result.entries)).toEqual(['b', 'a']);
  });
});
