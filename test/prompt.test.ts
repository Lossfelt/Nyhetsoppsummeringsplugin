import { describe, it, expect } from 'vitest';
import { prepareArticleText, MAX_ARTICLE_CHARS } from '../src/lib/prompt';

describe('prepareArticleText', () => {
  it('trimmer omkringliggende whitespace', () => {
    expect(prepareArticleText('  hei verden  \n')).toBe('hei verden');
  });

  it('lar tekst under grensen være uendret', () => {
    expect(prepareArticleText('kort artikkel')).toBe('kort artikkel');
  });

  it('kutter tekst over maksgrensen', () => {
    const long = 'a'.repeat(MAX_ARTICLE_CHARS + 500);
    expect(prepareArticleText(long).length).toBe(MAX_ARTICLE_CHARS);
  });
});
