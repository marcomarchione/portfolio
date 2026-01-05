/**
 * i18n Configuration
 *
 * Re-exports language constants from shared package and provides
 * i18n utilities for the web package.
 */

// Re-export from shared package
export {
  LANGUAGES,
  DEFAULT_LANGUAGE,
  isValidLanguage,
  type Language,
} from '@marcomarchione/shared';

import { LANGUAGES, DEFAULT_LANGUAGE, type Language } from '@marcomarchione/shared';

/**
 * Route paths configuration.
 * All route paths use English regardless of language.
 */
export const ROUTES = {
  home: '',
  projects: 'projects',
  materials: 'materials',
  news: 'news',
  privacyPolicy: 'privacy-policy',
  cookiePolicy: 'cookie-policy',
} as const;

/**
 * Gets the localized path for a route.
 *
 * @param lang - Language code
 * @param route - Route key from ROUTES
 * @returns Full path with language prefix
 */
export function getLocalizedPath(lang: Language, route: keyof typeof ROUTES): string {
  const routePath = ROUTES[route];
  return `/${lang}${routePath ? `/${routePath}` : ''}/`;
}

/**
 * Gets the current language from a URL pathname.
 *
 * @param pathname - URL pathname (e.g., /it/projects/)
 * @returns Language code or default language
 */
export function getLanguageFromPath(pathname: string): Language {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && LANGUAGES.includes(firstSegment as Language)) {
    return firstSegment as Language;
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Converts a path from one language to another.
 * Used for language switcher component.
 *
 * @param pathname - Current URL pathname
 * @param targetLang - Target language code
 * @returns Path with new language prefix
 */
export function switchLanguage(pathname: string, targetLang: Language): string {
  const segments = pathname.split('/').filter(Boolean);
  const currentLang = segments[0];

  if (currentLang && LANGUAGES.includes(currentLang as Language)) {
    segments[0] = targetLang;
  } else {
    segments.unshift(targetLang);
  }

  return `/${segments.join('/')}/`.replace(/\/+/g, '/');
}

/**
 * Generates alternate URLs for all languages.
 * Used for hreflang tags.
 *
 * @param pathname - Current URL pathname
 * @param baseUrl - Site base URL
 * @returns Map of language codes to full URLs
 */
export function getAlternateUrls(
  pathname: string,
  baseUrl: string
): Record<Language, string> {
  const result = {} as Record<Language, string>;
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');

  for (const lang of LANGUAGES) {
    const localizedPath = switchLanguage(pathname, lang);
    result[lang] = `${cleanBaseUrl}${localizedPath}`;
  }

  return result;
}
