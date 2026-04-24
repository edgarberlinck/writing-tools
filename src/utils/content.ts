import type { LanguageContent } from '../db/types';

/**
 * Returns the HTML content for `locale`, or an empty string if not found.
 */
export function getLocaleContent(
  languages: LanguageContent[],
  locale: string,
): string {
  return languages.find((l) => l.locale === locale)?.content ?? '';
}

/**
 * Returns a new array where the entry for `locale` has been set to `content`.
 * Creates the entry if it does not exist yet.
 * Does NOT mutate the original array.
 */
export function setLocaleContent(
  languages: LanguageContent[],
  locale: string,
  content: string,
): LanguageContent[] {
  const exists = languages.some((l) => l.locale === locale);
  if (exists) {
    return languages.map((l) => (l.locale === locale ? { ...l, content } : l));
  }
  return [...languages, { locale, content }];
}
