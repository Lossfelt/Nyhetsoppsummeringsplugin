import { anthropicProvider } from './anthropic';
import { openAiProvider } from './openai';
import type { LlmProvider } from './types';
import type { ProviderId } from '../lib/settings';

const providers: Record<ProviderId, LlmProvider> = {
  anthropic: anthropicProvider,
  openai: openAiProvider,
};

export function getProvider(id: ProviderId): LlmProvider {
  const provider = providers[id];
  if (!provider) throw new Error(`Ukjent leverandør: ${id}`);
  return provider;
}

export function allProviders(): LlmProvider[] {
  return Object.values(providers);
}
