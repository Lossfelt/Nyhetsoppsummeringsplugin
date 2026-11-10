import type { ModelInfo } from '../lib/models';
import type { ProviderId } from '../lib/settings';

export interface SummarizeOptions {
  apiKey: string;
  model: string;
  // 'low' ber modellen tenke mindre (raskere og billigere). Utelatt betyr
  // modellens eget standardnivå.
  effort?: 'low';
}

// Felles grensesnitt for alle LLM-leverandører. Kallstedene skal ikke kjenne
// den konkrete leverandøren; nye leverandører legges til uten å endre
// background-flyten.
export interface LlmProvider {
  readonly id: ProviderId;
  readonly label: string;
  readonly keyPlaceholder: string;
  summarize(articleText: string, options: SummarizeOptions): Promise<string>;
  // Henter tilgjengelige modeller for nøkkelen, nyeste først. Kaster
  // ProviderError med kind 'auth' når nøkkelen avvises.
  listModels(apiKey: string): Promise<ModelInfo[]>;
}
