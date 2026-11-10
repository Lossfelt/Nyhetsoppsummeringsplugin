export type ProviderId = 'anthropic' | 'openai';

export const PROVIDER_IDS: readonly ProviderId[] = ['anthropic', 'openai'];

// 'low' ber modellen tenke mindre: raskere og billigere, men noen eldre
// modeller avviser parameteren. 'default' sender ingenting.
export type Effort = 'default' | 'low';

// Nøkkel og modell lagres per leverandør, slik at man kan bytte frem og
// tilbake uten å lime inn nøkkelen på nytt.
export interface Settings {
  provider: ProviderId;
  effort: Effort;
  models: Record<ProviderId, string>;
  apiKeys: Record<ProviderId, string>;
}

export const DEFAULT_MODELS: Record<ProviderId, string> = {
  anthropic: 'claude-haiku-5-5',
  openai: 'gpt-6-luna',
};

export const DEFAULT_SETTINGS: Settings = {
  provider: 'anthropic',
  effort: 'default',
  models: { ...DEFAULT_MODELS },
  apiKeys: { anthropic: '', openai: '' },
};

const SETTINGS_KEY = 'settings';

function isProviderId(value: unknown): value is ProviderId {
  return typeof value === 'string' && (PROVIDER_IDS as readonly string[]).includes(value);
}

function pickStrings(value: unknown): Partial<Record<ProviderId, string>> {
  if (!value || typeof value !== 'object') return {};
  const result: Partial<Record<ProviderId, string>> = {};
  for (const id of PROVIDER_IDS) {
    const entry = (value as Record<string, unknown>)[id];
    if (typeof entry === 'string' && entry) result[id] = entry;
  }
  return result;
}

// Gjør lagrede (muligens eldre eller ufullstendige) innstillinger om til
// gyldige Settings. Det gamle formatet hadde én `model` og én `apiKey`
// som gjaldt Anthropic; de flyttes inn under `anthropic`.
export function normalizeSettings(raw: unknown): Settings {
  const stored = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  const legacyModel = typeof stored.model === 'string' && stored.model ? stored.model : undefined;
  const legacyKey = typeof stored.apiKey === 'string' && stored.apiKey ? stored.apiKey : undefined;

  return {
    provider: isProviderId(stored.provider) ? stored.provider : DEFAULT_SETTINGS.provider,
    effort: stored.effort === 'low' ? 'low' : 'default',
    models: {
      ...DEFAULT_SETTINGS.models,
      ...(legacyModel ? { anthropic: legacyModel } : {}),
      ...pickStrings(stored.models),
    },
    apiKeys: {
      ...DEFAULT_SETTINGS.apiKeys,
      ...(legacyKey ? { anthropic: legacyKey } : {}),
      ...pickStrings(stored.apiKeys),
    },
  };
}

export async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  return normalizeSettings(stored[SETTINGS_KEY]);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}
