/**
 * Translation Utilities
 *
 * Helper functions for accessing translations with type safety
 * and parameter interpolation support.
 */
import type { Language } from '@marcomarchione/shared';

// Import translations statically
import it from './translations/it.json';
import en from './translations/en.json';
import es from './translations/es.json';
import de from './translations/de.json';

/** Translation dictionaries by language */
const translations: Record<Language, typeof it> = {
  it,
  en,
  es,
  de,
};

/**
 * Gets a nested value from an object using dot notation.
 *
 * @param obj - Object to traverse
 * @param path - Dot-separated path (e.g., 'nav.projects')
 * @returns Value at path or undefined
 */
function getNestedValue(obj: unknown, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

/**
 * Interpolates parameters in a string.
 * Replaces {paramName} with the corresponding value.
 *
 * @param text - String with parameter placeholders
 * @param params - Parameter values to interpolate
 * @returns Interpolated string
 */
function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) {
    return text;
  }

  return text.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Gets a translated string for a given language and key.
 *
 * @param lang - Language code
 * @param key - Translation key in dot notation (e.g., 'nav.projects')
 * @param params - Optional parameters for interpolation
 * @returns Translated string or key if not found
 *
 * @example
 * t('it', 'nav.projects') // "Progetti"
 * t('en', 'common.readingTime', { minutes: '5' }) // "5 min read"
 */
export function t(
  lang: Language,
  key: string,
  params?: Record<string, string | number>
): string {
  const dictionary = translations[lang];
  const value = getNestedValue(dictionary, key);

  if (typeof value !== 'string') {
    // Return key for debugging if translation not found
    console.warn(`Translation not found: ${lang}.${key}`);
    return key;
  }

  return interpolate(value, params);
}

/**
 * Creates a bound translation function for a specific language.
 * Useful in components where the language is known.
 *
 * @param lang - Language code
 * @returns Translation function bound to the language
 *
 * @example
 * const t = useTranslations('it');
 * t('nav.projects') // "Progetti"
 */
export function useTranslations(lang: Language) {
  return (key: string, params?: Record<string, string | number>) => t(lang, key, params);
}

/**
 * Gets all translations for a specific namespace.
 * Useful for iterating over menu items, etc.
 *
 * @param lang - Language code
 * @param namespace - Top-level namespace (e.g., 'nav')
 * @returns Object with all translations in namespace
 */
export function getNamespace(
  lang: Language,
  namespace: keyof typeof it
): Record<string, string> {
  const dictionary = translations[lang];
  const namespaceData = dictionary[namespace];

  if (typeof namespaceData !== 'object') {
    return {};
  }

  return namespaceData as Record<string, string>;
}
