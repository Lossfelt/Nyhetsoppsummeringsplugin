export interface SummarizeOptions {
  apiKey: string;
  model: string;
}

// Felles grensesnitt for alle LLM-leverandører. Kallstedene skal ikke kjenne
// den konkrete leverandøren; nye leverandører (f.eks. OpenRouter) legges til
// uten å endre background-flyten.
export interface LlmProvider {
  readonly id: string;
  summarize(articleText: string, options: SummarizeOptions): Promise<string>;
}
