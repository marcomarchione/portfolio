/**
 * i18n Barrel Export
 *
 * Re-exports all i18n utilities for clean imports.
 */

// Configuration
export {
  LANGUAGES,
  DEFAULT_LANGUAGE,
  isValidLanguage,
  ROUTES,
  getLocalizedPath,
  getLanguageFromPath,
  switchLanguage,
  getAlternateUrls,
  type Language,
} from './config';

// Translation utilities
export { t, useTranslations, getNamespace } from './utils';
