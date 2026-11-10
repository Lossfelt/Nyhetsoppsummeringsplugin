import { SUMMARY_SYSTEM_PROMPT, prepareArticleText } from '../lib/prompt';
import { filterOpenAiModels, type OpenAiModelEntry } from '../lib/models';
import { ProviderError, kindFromStatus } from './errors';
import type { LlmProvider } from './types';

// Rå fetch mot REST-API-et i stedet for openai-pakken: to enkle kall gjør
// ikke en ekstra avhengighet verdt det. Utvidelsen har host_permissions på
// alle URL-er, så CORS er ikke et problem.
const BASE_URL = 'https://api.openai.com/v1';

// Gjeldende OpenAI-modeller er resonneringsmodeller, og resonneringen teller
// mot grensen. reasoning.effort sendes bare når brukeren har valgt det,
// fordi eldre modeller som gpt-4.1 avviser parameteren.
const MAX_OUTPUT_TOKENS = 4000;

interface ResponsesOutputItem {
  type: string;
  content?: { type: string; text?: string }[];
}

interface ResponsesBody {
  status?: string;
  incomplete_details?: { reason?: string } | null;
  output?: ResponsesOutputItem[];
}

async function request<T>(path: string, apiKey: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  if (!res.ok) {
    throw new ProviderError(
      kindFromStatus(res.status),
      body?.error?.message ?? `OpenAI svarte med HTTP ${res.status}.`,
    );
  }
  return body as T;
}

export function extractOutputText(body: ResponsesBody): string {
  return (body.output ?? [])
    .filter((item) => item.type === 'message')
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.type === 'output_text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join(' ')
    .trim();
}

export const openAiProvider: LlmProvider = {
  id: 'openai',
  label: 'OpenAI',
  keyPlaceholder: 'sk-...',

  async summarize(articleText, { apiKey, model, effort }) {
    const body = await request<ResponsesBody>('/responses', apiKey, {
      method: 'POST',
      body: JSON.stringify({
        model,
        instructions: SUMMARY_SYSTEM_PROMPT,
        input: prepareArticleText(articleText),
        max_output_tokens: MAX_OUTPUT_TOKENS,
        store: false,
        ...(effort ? { reasoning: { effort } } : {}),
      }),
    });

    const text = extractOutputText(body);
    if (!text && body.status === 'incomplete') {
      throw new Error(`Ufullstendig svar (${body.incomplete_details?.reason ?? 'ukjent årsak'}).`);
    }
    return text;
  },

  async listModels(apiKey) {
    const body = await request<{ data?: OpenAiModelEntry[] }>('/models', apiKey);
    return filterOpenAiModels(body.data ?? []);
  },
};
