import {
  FALLBACK_MODELS,
  loadCachedModels,
  saveCachedModels,
  withSelected,
  type ModelInfo,
} from '../lib/models';
import { loadSettings, saveSettings, type ProviderId, type Settings } from '../lib/settings';
import { getProvider } from '../providers';

const providerEl = document.getElementById('provider') as HTMLSelectElement;
const modelEl = document.getElementById('model') as HTMLSelectElement;
const refreshEl = document.getElementById('refresh') as HTMLButtonElement;
const modelStatusEl = document.getElementById('modelStatus') as HTMLParagraphElement;
const apiKeyEl = document.getElementById('apiKey') as HTMLInputElement;
const saveEl = document.getElementById('save') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLParagraphElement;

// Arbeidskopi: holder nøkkel og modell for begge leverandører mens man
// bytter frem og tilbake, og lagres samlet ved «Lagre».
let draft: Settings;
let current: ProviderId;

function renderModels(models: ModelInfo[], selected: string): void {
  modelEl.replaceChildren(
    ...withSelected(models, selected).map((m) => {
      const option = document.createElement('option');
      option.value = m.id;
      option.textContent = m.label === m.id ? m.id : `${m.label} (${m.id})`;
      return option;
    }),
  );
  modelEl.value = selected;
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleString('no-NO', { dateStyle: 'short', timeStyle: 'short' });
}

// Viser først mellomlagret (eller innebygd) liste umiddelbart, og henter
// deretter den ferske listen fra leverandøren hvis det finnes en nøkkel.
async function refreshModels(provider: ProviderId): Promise<void> {
  const cached = await loadCachedModels(provider);
  if (provider !== current) return;
  renderModels(cached?.models ?? FALLBACK_MODELS[provider], draft.models[provider]);
  modelStatusEl.textContent = cached
    ? `Liste hentet ${formatTime(cached.fetchedAt)}.`
    : 'Viser standardliste. Legg inn nøkkel for å hente alle modeller.';

  const apiKey = apiKeyEl.value.trim();
  if (!apiKey) return;

  refreshEl.disabled = true;
  modelStatusEl.textContent = 'Henter modeller …';
  try {
    const models = await getProvider(provider).listModels(apiKey);
    if (models.length === 0) throw new Error('Leverandøren returnerte ingen modeller.');
    await saveCachedModels(provider, models);
    if (provider !== current) return;
    renderModels(models, modelEl.value || draft.models[provider]);
    modelStatusEl.textContent = `${models.length} modeller hentet nå.`;
  } catch (error) {
    if (provider !== current) return;
    const reason = error instanceof Error ? error.message : 'ukjent feil';
    modelStatusEl.textContent = `Kunne ikke hente modellisten: ${reason}`;
  } finally {
    refreshEl.disabled = false;
  }
}

function stashCurrent(): void {
  draft.apiKeys[current] = apiKeyEl.value.trim();
  if (modelEl.value) draft.models[current] = modelEl.value;
}

function showProvider(provider: ProviderId): void {
  current = provider;
  providerEl.value = provider;
  apiKeyEl.value = draft.apiKeys[provider];
  apiKeyEl.placeholder = getProvider(provider).keyPlaceholder;
  void refreshModels(provider);
}

async function init(): Promise<void> {
  draft = await loadSettings();
  showProvider(draft.provider);
}

providerEl.addEventListener('change', () => {
  stashCurrent();
  showProvider(providerEl.value as ProviderId);
});

modelEl.addEventListener('change', () => {
  draft.models[current] = modelEl.value;
});

apiKeyEl.addEventListener('change', () => {
  draft.apiKeys[current] = apiKeyEl.value.trim();
  void refreshModels(current);
});

refreshEl.addEventListener('click', () => void refreshModels(current));

saveEl.addEventListener('click', async () => {
  stashCurrent();
  draft.provider = current;
  await saveSettings(draft);
  statusEl.textContent = 'Lagret.';
  setTimeout(() => {
    statusEl.textContent = '';
  }, 2000);
});

void init();
