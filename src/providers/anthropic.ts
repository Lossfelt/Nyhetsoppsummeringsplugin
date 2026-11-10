import Anthropic from '@anthropic-ai/sdk';
import { SUMMARY_SYSTEM_PROMPT, prepareArticleText } from '../lib/prompt';
import type { ModelInfo } from '../lib/models';
import { ProviderError, kindFromStatus } from './errors';
import type { LlmProvider } from './types';

// Nyere modeller tenker som standard, og tenkingen teller mot max_tokens.
// Grensen må derfor gi rom for både tenking og selve setningen.
const MAX_TOKENS = 4000;

function createClient(apiKey: string): Anthropic {
  return new Anthropic({
    apiKey,
    // Kreves fordi SDK-en kjører i en utvidelseskontekst. Nøkkelen ligger
    // lokalt i nettleseren, ikke i koden.
    dangerouslyAllowBrowser: true,
    // Ingen auto-retry (fastsatt valg); SDK-ens standard er 2 forsøk til,
    // som ellers spiser av tidsgrensen ved 429.
    maxRetries: 0,
  });
}

function classify(error: unknown): unknown {
  if (error instanceof Anthropic.APIError) {
    return new ProviderError(kindFromStatus(error.status), error.message);
  }
  return error;
}

export const anthropicProvider: LlmProvider = {
  id: 'anthropic',
  label: 'Anthropic',
  keyPlaceholder: 'sk-ant-...',

  async summarize(articleText, { apiKey, model, effort }) {
    let response: Anthropic.Message;
    try {
      response = await createClient(apiKey).messages.create({
        model,
        max_tokens: MAX_TOKENS,
        system: SUMMARY_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prepareArticleText(articleText) }],
        ...(effort ? { output_config: { effort } } : {}),
      });
    } catch (error) {
      throw classify(error);
    }

    if (response.stop_reason === 'refusal') {
      throw new Error('Modellen avslo forespørselen.');
    }

    return response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join(' ')
      .trim();
  },

  async listModels(apiKey) {
    const models: ModelInfo[] = [];
    try {
      // API-et returnerer nyeste først; list() paginerer automatisk.
      for await (const model of createClient(apiKey).models.list()) {
        models.push({ id: model.id, label: model.display_name || model.id });
      }
    } catch (error) {
      throw classify(error);
    }
    return models;
  },
};
