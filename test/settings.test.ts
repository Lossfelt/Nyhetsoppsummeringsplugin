import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS, normalizeSettings } from '../src/lib/settings';

describe('normalizeSettings', () => {
  it('gir standardverdier når ingenting er lagret', () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
  });

  it('migrerer gammelt format med én modell og én nøkkel til Anthropic', () => {
    const result = normalizeSettings({
      provider: 'anthropic',
      model: 'claude-haiku-4-5',
      apiKey: 'sk-ant-x',
    });
    expect(result.models.anthropic).toBe('claude-haiku-4-5');
    expect(result.apiKeys.anthropic).toBe('sk-ant-x');
    expect(result.models.openai).toBe(DEFAULT_SETTINGS.models.openai);
    expect(result.apiKeys.openai).toBe('');
  });

  it('beholder nøkler og modeller per leverandør', () => {
    const result = normalizeSettings({
      provider: 'openai',
      models: { anthropic: 'a', openai: 'o' },
      apiKeys: { anthropic: 'ka', openai: 'ko' },
    });
    expect(result).toEqual({
      provider: 'openai',
      effort: 'default',
      models: { anthropic: 'a', openai: 'o' },
      apiKeys: { anthropic: 'ka', openai: 'ko' },
    });
  });

  it('leser lavt tenkenivå og ignorerer ukjente verdier', () => {
    expect(normalizeSettings({ effort: 'low' }).effort).toBe('low');
    expect(normalizeSettings({ effort: 'max' }).effort).toBe('default');
  });

  it('faller tilbake til standardleverandør ved ukjent verdi', () => {
    expect(normalizeSettings({ provider: 'openrouter' }).provider).toBe('anthropic');
  });
});
