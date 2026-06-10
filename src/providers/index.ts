import { anthropicProvider } from './anthropic';
import type { LlmProvider } from './types';
import type { ProviderId } from '../lib/settings';

const providers: Partial<Record<ProviderId, LlmProvider>> = {
  anthropic: anthropicProvider,
  // openrouter: openRouterProvider,  // legges til senere
};

export function getProvider(id: ProviderId): LlmProvider {
  const provider = providers[id];
  if (!provider) throw new Error(`Ukjent eller ikke-implementert leverandør: ${id}`);
  return provider;
}
