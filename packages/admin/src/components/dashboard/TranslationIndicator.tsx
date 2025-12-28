/**
 * TranslationIndicator Component
 *
 * Displays language flags with filled/empty states based on translation status.
 * Shows which translations are complete for a content item.
 */
import type { Language } from '@marcomarchione/shared';
import { LANGUAGES } from '@marcomarchione/shared';

interface TranslationIndicatorProps {
  /** Languages that have translations */
  completedLanguages: Language[];
}

const LANGUAGE_CONFIG: Record<Language, { flag: string; label: string }> = {
  it: { flag: 'IT', label: 'Italian' },
  en: { flag: 'EN', label: 'English' },
  es: { flag: 'ES', label: 'Spanish' },
  de: { flag: 'DE', label: 'German' },
};

/**
 * Displays translation status for all languages.
 */
export function TranslationIndicator({ completedLanguages }: TranslationIndicatorProps) {
  return (
    <div className="flex items-center gap-1">
      {LANGUAGES.map((lang) => {
        const config = LANGUAGE_CONFIG[lang];
        const isComplete = completedLanguages.includes(lang);

        return (
          <span
            key={lang}
            className={`
              inline-flex items-center justify-center w-6 h-5 rounded text-[10px] font-medium
              ${
                isComplete
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'bg-neutral-700/50 text-neutral-500 border border-neutral-600/30'
              }
            `}
            title={`${config.label}: ${isComplete ? 'Complete' : 'Missing'}`}
          >
            {config.flag}
          </span>
        );
      })}
    </div>
  );
}

export default TranslationIndicator;
