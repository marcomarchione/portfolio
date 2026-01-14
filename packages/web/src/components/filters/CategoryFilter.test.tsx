/**
 * CategoryFilter Component Tests
 *
 * Tests for the material category filter component.
 * Verifies:
 * 1. Renders all category pills plus "All" option (5 total pills)
 * 2. Clicking a category calls onFilterChange with correct value
 * 3. Selected category has active styling (primary-500)
 * 4. Clicking "All" clears filter (passes empty string)
 */
import { describe, test, expect, mock } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import {
  CategoryFilter,
  MATERIAL_CATEGORIES,
  type CategoryLabels,
} from './CategoryFilter';

const defaultLabels: CategoryLabels = {
  guide: 'Guides',
  template: 'Templates',
  resource: 'Resources',
  tool: 'Tools',
};

describe('CategoryFilter', () => {
  test('renders all category pills plus "All" option (5 total)', () => {
    const mockOnChange = mock(() => {});

    render(
      <CategoryFilter
        selectedCategory=""
        onFilterChange={mockOnChange}
        allLabel="All"
        categoryLabels={defaultLabels}
      />
    );

    // Should have "All" button
    expect(screen.getByText('All')).toBeDefined();

    // Should have all 4 category buttons
    expect(screen.getByText('Guides')).toBeDefined();
    expect(screen.getByText('Templates')).toBeDefined();
    expect(screen.getByText('Resources')).toBeDefined();
    expect(screen.getByText('Tools')).toBeDefined();

    // Verify total count: 1 "All" + 4 categories = 5 buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(5);

    cleanup();
  });

  test('clicking a category calls onFilterChange with correct value', () => {
    const mockOnChange = mock(() => {});

    render(
      <CategoryFilter
        selectedCategory=""
        onFilterChange={mockOnChange}
        allLabel="All"
        categoryLabels={defaultLabels}
      />
    );

    // Click the "Guides" category button
    fireEvent.click(screen.getByText('Guides'));
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('guide');

    // Click the "Templates" category button
    fireEvent.click(screen.getByText('Templates'));
    expect(mockOnChange).toHaveBeenCalledTimes(2);
    expect(mockOnChange).toHaveBeenCalledWith('template');

    cleanup();
  });

  test('selected category has active styling (primary-500)', () => {
    const mockOnChange = mock(() => {});

    render(
      <CategoryFilter
        selectedCategory="guide"
        onFilterChange={mockOnChange}
        allLabel="All"
        categoryLabels={defaultLabels}
      />
    );

    // The selected "Guides" button should have primary-500 class
    const guidesButton = screen.getByText('Guides');
    expect(guidesButton.className).toContain('bg-primary-500');
    expect(guidesButton.className).toContain('text-white');

    // The "All" button should NOT have the active styling (should be inactive)
    const allButton = screen.getByText('All');
    expect(allButton.className).toContain('bg-neutral-800/50');
    expect(allButton.className).not.toContain('bg-primary-500');

    // Other category buttons should also be inactive
    const templatesButton = screen.getByText('Templates');
    expect(templatesButton.className).toContain('bg-neutral-800/50');
    expect(templatesButton.className).not.toContain('bg-primary-500');

    cleanup();
  });

  test('clicking "All" clears filter (passes empty string)', () => {
    const mockOnChange = mock(() => {});

    render(
      <CategoryFilter
        selectedCategory="resource"
        onFilterChange={mockOnChange}
        allLabel="All"
        categoryLabels={defaultLabels}
      />
    );

    // Click the "All" button
    fireEvent.click(screen.getByText('All'));

    // Should call onFilterChange with empty string
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('');

    cleanup();
  });
});
