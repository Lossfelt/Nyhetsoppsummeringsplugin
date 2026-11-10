import { describe, it, expect } from 'vitest';
import { filterOpenAiModels, withSelected } from '../src/lib/models';
import { extractOutputText } from '../src/providers/openai';

describe('filterOpenAiModels', () => {
  it('beholder tekstmodeller og fjerner embedding, lyd og bilde', () => {
    const ids = filterOpenAiModels([
      { id: 'gpt-6-luna', created: 3 },
      { id: 'text-embedding-3-small', created: 9 },
      { id: 'gpt-4o-audio-preview', created: 8 },
      { id: 'gpt-image-1', created: 7 },
      { id: 'o3', created: 2 },
      { id: 'whisper-1', created: 1 },
    ]).map((m) => m.id);
    expect(ids).toEqual(['gpt-6-luna', 'o3']);
  });

  it('sorterer nyeste først', () => {
    const ids = filterOpenAiModels([
      { id: 'gpt-old', created: 1 },
      { id: 'gpt-new', created: 5 },
    ]).map((m) => m.id);
    expect(ids).toEqual(['gpt-new', 'gpt-old']);
  });
});

describe('withSelected', () => {
  const list = [{ id: 'a', label: 'A' }];

  it('legger valgt modell først hvis den mangler i listen', () => {
    expect(withSelected(list, 'x').map((m) => m.id)).toEqual(['x', 'a']);
  });

  it('lar listen være uendret når valgt modell finnes', () => {
    expect(withSelected(list, 'a')).toBe(list);
  });
});

describe('extractOutputText', () => {
  it('henter tekst fra message-elementer og hopper over resonnering', () => {
    expect(
      extractOutputText({
        output: [
          { type: 'reasoning', content: [] },
          { type: 'message', content: [{ type: 'output_text', text: ' Én setning. ' }] },
        ],
      }),
    ).toBe('Én setning.');
  });

  it('gir tom streng når det ikke finnes output', () => {
    expect(extractOutputText({})).toBe('');
  });
});
