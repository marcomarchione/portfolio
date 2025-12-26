/**
 * Form-Related Types
 *
 * Type definitions for content editor forms, language tabs, and translation state.
 */

import type { Language } from '@marcomarchione/shared';

/**
 * Supported language tabs for content editing.
 * Italian (IT) is the default/required language.
 */
export type LanguageTab = Language;

/**
 * Mapping of language codes to their display labels.
 */
export const LANGUAGE_LABELS: Record<LanguageTab, string> = {
  it: 'IT',
  en: 'EN',
  es: 'ES',
  de: 'DE',
} as const;

/**
 * Full language names for accessibility and tooltips.
 */
export const LANGUAGE_NAMES: Record<LanguageTab, string> = {
  it: 'Italian',
  en: 'English',
  es: 'Spanish',
  de: 'German',
} as const;

/**
 * Translation completion status per language.
 * true = translation has required fields filled (at minimum: title)
 * false = translation is empty or incomplete
 */
export interface TranslationCompletionStatus {
  it: boolean;
  en: boolean;
  es: boolean;
  de: boolean;
}

/**
 * Default completion status - all languages incomplete.
 */
export const DEFAULT_COMPLETION_STATUS: TranslationCompletionStatus = {
  it: false,
  en: false,
  es: false,
  de: false,
};

/**
 * Props for the LanguageTabs component.
 */
export interface LanguageTabsProps {
  /** Currently active language tab */
  activeTab: LanguageTab;
  /** Callback when tab is changed */
  onChange: (tab: LanguageTab) => void;
  /** Completion status for each language */
  completionStatus: TranslationCompletionStatus;
}
