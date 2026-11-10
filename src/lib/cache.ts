import { lruGet, lruSet, type LruEntry } from './lru';
import { normalizeUrl } from './url';

const CACHE_KEY = 'summaryCache';
const MAX_ENTRIES = 200;

type CacheEntries = LruEntry<string>[];

async function read(): Promise<CacheEntries> {
  const store = await chrome.storage.local.get(CACHE_KEY);
  return (store[CACHE_KEY] ?? []) as CacheEntries;
}

async function write(entries: CacheEntries): Promise<void> {
  await chrome.storage.local.set({ [CACHE_KEY]: entries });
}

// Samme artikkel kan ha ulik oppsummering per modell, så modellen er en del
// av nøkkelen. Bytter man modell, hentes en ny oppsummering.
export function summaryCacheKey(url: string, provider: string, model: string): string {
  return `${provider}:${model}|${normalizeUrl(url)}`;
}

export async function getCached(key: string): Promise<string | undefined> {
  const { value, entries } = lruGet(await read(), key);
  if (value !== undefined) await write(entries);
  return value;
}

export async function setCached(key: string, sentence: string): Promise<void> {
  await write(lruSet(await read(), key, sentence, MAX_ENTRIES));
}
