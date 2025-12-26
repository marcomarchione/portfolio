/**
 * LanguageTabs Component Tests
 *
 * Tests for the language tab navigation component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageTabs } from './LanguageTabs';
import type { TranslationCompletionStatus } from '@/types/forms';

describe('LanguageTabs', () => {
  const defaultCompletionStatus: TranslationCompletionStatus = {
    it: false,
    en: false,
    es: false,
    de: false,
  };

  it('renders all 4 language tabs (IT, EN, ES, DE)', () => {
    const onChange = vi.fn();

    render(
      <LanguageTabs
        activeTab="it"
        onChange={onChange}
        completionStatus={defaultCompletionStatus}
      />
    );

    // Check all tabs are rendered
    expect(screen.getByRole('tab', { name: /IT/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /EN/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /ES/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /DE/i })).toBeInTheDocument();
  });

  it('has Italian tab selected by default when activeTab is "it"', () => {
    const onChange = vi.fn();

    render(
      <LanguageTabs
        activeTab="it"
        onChange={onChange}
        completionStatus={defaultCompletionStatus}
      />
    );

    const italianTab = screen.getByRole('tab', { name: /IT/i });
    expect(italianTab).toHaveAttribute('aria-selected', 'true');

    // Other tabs should not be selected
    expect(screen.getByRole('tab', { name: /EN/i })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: /ES/i })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: /DE/i })).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onChange handler when switching between tabs', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <LanguageTabs
        activeTab="it"
        onChange={onChange}
        completionStatus={defaultCompletionStatus}
      />
    );

    // Click on English tab
    const englishTab = screen.getByRole('tab', { name: /EN/i });
    await user.click(englishTab);

    expect(onChange).toHaveBeenCalledWith('en');
    expect(onChange).toHaveBeenCalledTimes(1);

    // Click on Spanish tab
    const spanishTab = screen.getByRole('tab', { name: /ES/i });
    await user.click(spanishTab);

    expect(onChange).toHaveBeenCalledWith('es');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('shows completion indicator for filled/empty translation state', () => {
    const onChange = vi.fn();
    const completionStatus: TranslationCompletionStatus = {
      it: true,  // Complete
      en: false, // Incomplete
      es: true,  // Complete
      de: false, // Incomplete
    };

    render(
      <LanguageTabs
        activeTab="it"
        onChange={onChange}
        completionStatus={completionStatus}
      />
    );

    // Italian tab should have complete indicator (green dot)
    const italianTab = screen.getByRole('tab', { name: /IT/i });
    expect(italianTab).toHaveAccessibleDescription(/complete/i);

    // English tab should have incomplete indicator
    const englishTab = screen.getByRole('tab', { name: /EN/i });
    expect(englishTab).toHaveAccessibleDescription(/incomplete/i);

    // Spanish tab should have complete indicator
    const spanishTab = screen.getByRole('tab', { name: /ES/i });
    expect(spanishTab).toHaveAccessibleDescription(/complete/i);

    // German tab should have incomplete indicator
    const germanTab = screen.getByRole('tab', { name: /DE/i });
    expect(germanTab).toHaveAccessibleDescription(/incomplete/i);
  });
});
