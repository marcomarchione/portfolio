/**
 * Language Constants
 *
 * Supported languages for i18n across the portfolio.
 */

/** Supported language codes */
export const LANGUAGES = ['it', 'en', 'es', 'de'] as const;

/** Type for supported language codes */
export type Language = (typeof LANGUAGES)[number];

/** Default language */
export const DEFAULT_LANGUAGE: Language = 'it';

/**
 * Type guard to check if a string is a valid language code.
 */
export function isValidLanguage(lang: string): lang is Language {
  return LANGUAGES.includes(lang as Language);
}
