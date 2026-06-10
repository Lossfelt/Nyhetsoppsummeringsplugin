import Anthropic from '@anthropic-ai/sdk';
import { SUMMARY_SYSTEM_PROMPT, prepareArticleText } from '../lib/prompt';
import type { LlmProvider } from './types';

export const anthropicProvider: LlmProvider = {
  id: 'anthropic',
  async summarize(articleText, { apiKey, model }) {
    // dangerouslyAllowBrowser kreves fordi SDK-en kjører i en
    // utvidelseskontekst. Nøkkelen ligger lokalt i nettleseren, ikke i koden.
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

    const response = await client.messages.create({
      model,
      max_tokens: 256,
      system: SUMMARY_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prepareArticleText(articleText) }],
    });

    return response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join(' ')
      .trim();
  },
};
