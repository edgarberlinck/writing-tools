import { describe, it, expect } from 'vitest';
import { getLocaleContent, setLocaleContent } from '../content';
import type { LanguageContent } from '../../db/types';

const langs: LanguageContent[] = [
  { locale: 'en', content: '<p>Hello</p>' },
  { locale: 'pt-BR', content: '<p>Olá</p>' },
];

describe('getLocaleContent', () => {
  it('returns the content for an existing locale', () => {
    expect(getLocaleContent(langs, 'en')).toBe('<p>Hello</p>');
  });

  it('returns an empty string when locale does not exist', () => {
    expect(getLocaleContent(langs, 'fr')).toBe('');
  });

  it('returns an empty string for an empty array', () => {
    expect(getLocaleContent([], 'en')).toBe('');
  });
});

describe('setLocaleContent', () => {
  it('updates an existing locale entry', () => {
    const result = setLocaleContent(langs, 'en', '<p>Updated</p>');
    expect(result.find((l) => l.locale === 'en')?.content).toBe('<p>Updated</p>');
    expect(result).toHaveLength(2);
  });

  it('adds a new entry when locale does not exist', () => {
    const result = setLocaleContent(langs, 'es', '<p>Hola</p>');
    expect(result).toHaveLength(3);
    expect(result.find((l) => l.locale === 'es')?.content).toBe('<p>Hola</p>');
  });

  it('does not mutate the original array', () => {
    setLocaleContent(langs, 'en', '<p>New</p>');
    expect(langs[0].content).toBe('<p>Hello</p>');
  });

  it('preserves entries for other locales', () => {
    const result = setLocaleContent(langs, 'en', '<p>New</p>');
    expect(result.find((l) => l.locale === 'pt-BR')?.content).toBe('<p>Olá</p>');
  });

  it('is idempotent – calling twice with same args gives same result', () => {
    const first = setLocaleContent(langs, 'en', '<p>Same</p>');
    const second = setLocaleContent(first, 'en', '<p>Same</p>');
    expect(second).toEqual(first);
  });
});
