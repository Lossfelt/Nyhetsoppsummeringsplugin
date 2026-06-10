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

export async function getCached(url: string): Promise<string | undefined> {
  const key = normalizeUrl(url);
  const { value, entries } = lruGet(await read(), key);
  if (value !== undefined) await write(entries);
  return value;
}

export async function setCached(url: string, sentence: string): Promise<void> {
  const key = normalizeUrl(url);
  await write(lruSet(await read(), key, sentence, MAX_ENTRIES));
}
