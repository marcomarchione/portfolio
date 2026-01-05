/**
 * LanguageSwitcher Component
 *
 * React island component for switching between languages.
 * Uses dropdown menu pattern with keyboard navigation.
 *
 * @example
 * <LanguageSwitcher
 *   currentLang="it"
 *   currentPath="/it/projects/"
 *   client:idle
 * />
 */
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Language } from '@marcomarchione/shared';
import { switchLanguage, LANGUAGES } from '../../i18n/config';

export interface LanguageSwitcherProps {
  /** Current language code */
  currentLang: Language;
  /** Current page path for language switching */
  currentPath: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
}

/** Language display names */
const LANGUAGE_NAMES: Record<Language, string> = {
  it: 'Italiano',
  en: 'English',
  es: 'Espanol',
  de: 'Deutsch',
};

export function LanguageSwitcher({
  currentLang: initialLang,
  currentPath: initialPath,
  ariaLabel = 'Switch language',
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [currentLang, setCurrentLang] = useState(initialLang);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Listen for View Transitions navigation to update current path and lang
  useEffect(() => {
    const handlePageLoad = () => {
      const pathname = window.location.pathname;
      setCurrentPath(pathname);
      // Extract language from pathname (e.g., /it/projects -> it)
      const langMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
      if (langMatch) {
        setCurrentLang(langMatch[1] as Language);
      }
    };

    document.addEventListener('astro:page-load', handlePageLoad);
    return () => document.removeEventListener('astro:page-load', handlePageLoad);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleLanguageSelect = (newLang: Language) => {
    if (newLang === currentLang) {
      setIsOpen(false);
      return;
    }

    // Always use current URL path, not stored state
    const actualPath = window.location.pathname;
    const newPath = switchLanguage(actualPath, newLang);
    setIsOpen(false);

    // Use SPA navigation if available, otherwise fallback to full page load
    if (typeof (window as any).spaNavigate === 'function') {
      (window as any).spaNavigate(newPath);
      setCurrentPath(newPath);
      setCurrentLang(newLang);
    } else {
      window.location.href = newPath;
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, lang: Language) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleLanguageSelect(lang);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors [.light_&]:text-neutral-600 [.light_&]:hover:text-neutral-900 [.light_&]:hover:bg-neutral-200 min-w-[60px] h-9 justify-center"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-sm font-medium uppercase">{currentLang}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-40 bg-neutral-800/95 backdrop-blur-sm border border-neutral-700 rounded-lg shadow-lg overflow-hidden z-50 [.light_&]:bg-white [.light_&]:border-neutral-200"
          role="listbox"
          aria-label={ariaLabel}
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              role="option"
              aria-selected={lang === currentLang}
              onClick={() => handleLanguageSelect(lang)}
              onKeyDown={(e) => handleKeyDown(e, lang)}
              className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center justify-between ${
                lang === currentLang
                  ? 'bg-primary-500/20 text-primary-300 [.light_&]:bg-primary-100 [.light_&]:text-primary-700'
                  : 'text-neutral-300 hover:bg-white/5 hover:text-white [.light_&]:text-neutral-700 [.light_&]:hover:bg-neutral-100 [.light_&]:hover:text-neutral-900'
              }`}
            >
              <span>{LANGUAGE_NAMES[lang]}</span>
              <span className="text-xs uppercase opacity-60">{lang}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;
