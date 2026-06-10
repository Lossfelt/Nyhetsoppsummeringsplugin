// Ren LRU-logikk uten avhengighet til chrome.storage, slik at den kan
// enhetstestes isolert. Oppføringene er ordnet eldst -> nyest.

export interface LruEntry<T> {
  key: string;
  value: T;
}

// Henter en verdi og returnerer en ny liste der treffet er flyttet bakerst
// (markert som sist brukt). Bom gir uendret liste og undefined verdi.
export function lruGet<T>(
  entries: LruEntry<T>[],
  key: string,
): { value: T | undefined; entries: LruEntry<T>[] } {
  const idx = entries.findIndex((e) => e.key === key);
  if (idx === -1) return { value: undefined, entries };
  const next = entries.slice();
  const [entry] = next.splice(idx, 1);
  next.push(entry);
  return { value: entry.value, entries: next };
}

// Setter en verdi (overskriver eksisterende nøkkel), legger den bakerst, og
// kutter de eldste oppføringene slik at lista ikke overstiger `max`.
export function lruSet<T>(
  entries: LruEntry<T>[],
  key: string,
  value: T,
  max: number,
): LruEntry<T>[] {
  const next = entries.filter((e) => e.key !== key);
  next.push({ key, value });
  while (next.length > max) next.shift();
  return next;
}
