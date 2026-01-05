/**
 * ThemeToggle Component
 *
 * React island component for toggling between dark and light themes.
 * Uses CSS to show correct icon before hydration to prevent flash.
 *
 * @example
 * <ThemeToggle client:load />
 */
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export interface ThemeToggleProps {
  /** Accessible label for screen readers */
  ariaLabelLight?: string;
  /** Accessible label for screen readers */
  ariaLabelDark?: string;
}

export function ThemeToggle({
  ariaLabelLight = 'Switch to light mode',
  ariaLabelDark = 'Switch to dark mode',
}: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Read initial theme from document class on mount
  useEffect(() => {
    const html = document.documentElement;
    const currentIsDark = html.classList.contains('dark');
    setIsDark(currentIsDark);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const newIsDark = !isDark;

    if (newIsDark) {
      html.classList.add('dark');
      html.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
      localStorage.setItem('theme', 'light');
    }

    setIsDark(newIsDark);
  };

  // Before mount, render both icons and use CSS to show correct one
  // This prevents flash by letting CSS handle visibility based on html class
  if (!mounted) {
    return (
      <button
        type="button"
        className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors [.light_&]:text-neutral-600 [.light_&]:hover:text-neutral-900 [.light_&]:hover:bg-neutral-200 w-9 h-9 flex items-center justify-center"
        aria-label={ariaLabelLight}
      >
        {/* Sun shown in dark mode, Moon shown in light mode */}
        <Sun className="h-5 w-5 hidden [.dark_&]:block" />
        <Moon className="h-5 w-5 block [.dark_&]:hidden" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors [.light_&]:text-neutral-600 [.light_&]:hover:text-neutral-900 [.light_&]:hover:bg-neutral-200 w-9 h-9 flex items-center justify-center"
      aria-label={isDark ? ariaLabelLight : ariaLabelDark}
    >
      {isDark ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}

export default ThemeToggle;
