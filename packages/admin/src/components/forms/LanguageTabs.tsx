/**
 * Language Tabs Component
 *
 * Horizontal tab navigation for switching between language translations.
 * Displays IT, EN, ES, DE tabs with visual indicators for completion status.
 */

import { LANGUAGES } from '@marcomarchione/shared';
import type {
  LanguageTabsProps,
  LanguageTab,
} from '@/types/forms';
import { LANGUAGE_LABELS, LANGUAGE_NAMES } from '@/types/forms';

/**
 * Horizontal tab navigation for multilingual content editing.
 *
 * Features:
 * - Four language tabs: IT, EN, ES, DE
 * - Italian tab selected by default when creating new content
 * - Visual indicator for translation completion (filled dot vs empty circle)
 * - Accessible keyboard navigation
 */
export function LanguageTabs({
  activeTab,
  onChange,
  completionStatus,
}: LanguageTabsProps) {
  return (
    <div
      className="glass-card p-1 inline-flex gap-1"
      role="tablist"
      aria-label="Language tabs"
    >
      {LANGUAGES.map((lang) => {
        const isActive = activeTab === lang;
        const isComplete = completionStatus[lang];
        const label = LANGUAGE_LABELS[lang];
        const fullName = LANGUAGE_NAMES[lang];

        return (
          <button
            key={lang}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${lang}`}
            id={`tab-${lang}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(lang as LanguageTab)}
            onKeyDown={(e) => handleKeyDown(e, lang, onChange)}
            className={`
              relative flex items-center gap-2 px-4 py-2 rounded-lg
              font-display font-medium text-sm
              transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950
              ${
                isActive
                  ? 'bg-gradient-to-br from-primary-500/20 to-accent-500/20 text-neutral-100 border border-white/10'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }
            `}
            title={`${fullName} translation${isComplete ? ' (complete)' : ' (incomplete)'}`}
          >
            {/* Language label */}
            <span>{label}</span>

            {/* Completion indicator */}
            <span
              className={`
                w-2 h-2 rounded-full transition-colors duration-200
                ${
                  isComplete
                    ? 'bg-green-500'
                    : 'bg-transparent border border-neutral-500'
                }
              `}
              aria-hidden="true"
            />

            {/* Screen reader only text for completion status */}
            <span className="sr-only">
              {isComplete ? 'Translation complete' : 'Translation incomplete'}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Handle keyboard navigation between tabs.
 * Arrow keys move focus between tabs.
 */
function handleKeyDown(
  event: React.KeyboardEvent,
  currentLang: string,
  onChange: (tab: LanguageTab) => void
) {
  const currentIndex = LANGUAGES.indexOf(currentLang as LanguageTab);
  let newIndex: number | null = null;

  switch (event.key) {
    case 'ArrowRight':
      newIndex = (currentIndex + 1) % LANGUAGES.length;
      break;
    case 'ArrowLeft':
      newIndex = (currentIndex - 1 + LANGUAGES.length) % LANGUAGES.length;
      break;
    case 'Home':
      newIndex = 0;
      break;
    case 'End':
      newIndex = LANGUAGES.length - 1;
      break;
    default:
      return;
  }

  if (newIndex !== null) {
    event.preventDefault();
    const newLang = LANGUAGES[newIndex];
    onChange(newLang);
    // Focus the new tab button
    const newTab = document.getElementById(`tab-${newLang}`);
    newTab?.focus();
  }
}

export default LanguageTabs;
