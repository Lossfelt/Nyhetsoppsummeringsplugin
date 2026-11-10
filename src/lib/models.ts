import type { ProviderId } from './settings';

export interface ModelInfo {
  id: string;
  label: string;
}

// Brukes når modellisten ikke kan hentes (ingen nøkkel, nettverksfeil).
// Holdes kort; den levende listen fra leverandøren er kilden til sannhet.
export const FALLBACK_MODELS: Record<ProviderId, ModelInfo[]> = {
  anthropic: [
    { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5' },
    { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5' },
    { id: 'claude-opus-5-5', label: 'Claude Opus 5.5' },
  ],
  openai: [
    { id: 'gpt-6-luna', label: 'gpt-6-luna' },
    { id: 'gpt-6.1-terra', label: 'gpt-6.1-terra' },
    { id: 'gpt-6.1-sol', label: 'gpt-6.1-sol' },
  ],
};

// OpenAIs /v1/models returnerer også embedding-, lyd-, bilde- og
// moderasjonsmodeller. Vi beholder bare tekstmodeller som kan oppsummere.
const OPENAI_EXCLUDE =
  /(embed|audio|realtime|tts|transcribe|whisper|image|dall-e|moderation|search|instruct|codex|computer-use|sora)/i;
const OPENAI_INCLUDE = /^(gpt-|o\d)/i;

export interface OpenAiModelEntry {
  id: string;
  created?: number;
}

export function filterOpenAiModels(entries: OpenAiModelEntry[]): ModelInfo[] {
  return entries
    .filter((m) => OPENAI_INCLUDE.test(m.id) && !OPENAI_EXCLUDE.test(m.id))
    .sort((a, b) => (b.created ?? 0) - (a.created ?? 0) || a.id.localeCompare(b.id))
    .map((m) => ({ id: m.id, label: m.id }));
}

// Sørger for at den valgte modellen alltid finnes i listen, også om den er
// fjernet hos leverandøren eller satt før listen ble hentet.
export function withSelected(models: ModelInfo[], selected: string): ModelInfo[] {
  if (!selected || models.some((m) => m.id === selected)) return models;
  return [{ id: selected, label: selected }, ...models];
}

const MODEL_CACHE_KEY = 'modelLists';

interface CachedModelList {
  models: ModelInfo[];
  fetchedAt: number;
}

export async function loadCachedModels(provider: ProviderId): Promise<CachedModelList | null> {
  const stored = await chrome.storage.local.get(MODEL_CACHE_KEY);
  const all = (stored[MODEL_CACHE_KEY] ?? {}) as Partial<Record<ProviderId, CachedModelList>>;
  return all[provider] ?? null;
}

export async function saveCachedModels(provider: ProviderId, models: ModelInfo[]): Promise<void> {
  const stored = await chrome.storage.local.get(MODEL_CACHE_KEY);
  const all = (stored[MODEL_CACHE_KEY] ?? {}) as Partial<Record<ProviderId, CachedModelList>>;
  all[provider] = { models, fetchedAt: Date.now() };
  await chrome.storage.local.set({ [MODEL_CACHE_KEY]: all });
}
