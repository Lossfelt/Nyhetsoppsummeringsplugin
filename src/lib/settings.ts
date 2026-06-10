export type ProviderId = 'anthropic' | 'openrouter';

export interface Settings {
  provider: ProviderId;
  model: string;
  apiKey: string;
}

export const DEFAULT_SETTINGS: Settings = {
  provider: 'anthropic',
  model: 'claude-haiku-4-5',
  apiKey: '',
};

const SETTINGS_KEY = 'settings';

export async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  const partial = (stored[SETTINGS_KEY] ?? {}) as Partial<Settings>;
  return { ...DEFAULT_SETTINGS, ...partial };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}
