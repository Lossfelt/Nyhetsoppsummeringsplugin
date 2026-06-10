import { loadSettings, saveSettings, type ProviderId, type Settings } from '../lib/settings';

const providerEl = document.getElementById('provider') as HTMLSelectElement;
const modelEl = document.getElementById('model') as HTMLInputElement;
const apiKeyEl = document.getElementById('apiKey') as HTMLInputElement;
const saveEl = document.getElementById('save') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLParagraphElement;

async function init(): Promise<void> {
  const settings = await loadSettings();
  providerEl.value = settings.provider;
  modelEl.value = settings.model;
  apiKeyEl.value = settings.apiKey;
}

saveEl.addEventListener('click', async () => {
  const settings: Settings = {
    provider: providerEl.value as ProviderId,
    model: modelEl.value.trim(),
    apiKey: apiKeyEl.value.trim(),
  };
  await saveSettings(settings);
  statusEl.textContent = 'Lagret.';
  setTimeout(() => {
    statusEl.textContent = '';
  }, 2000);
});

void init();
