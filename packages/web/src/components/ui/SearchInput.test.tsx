/**
 * SearchInput Component Tests
 *
 * Tests for the debounced search input component.
 * Verifies:
 * 1. Renders input with placeholder text
 * 2. Debounces onChange callback by 300ms
 * 3. Shows clear button when value is present
 * 4. Clicking clear button resets value and calls onChange immediately
 */
import { describe, test, expect, mock } from 'bun:test';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  test('renders input with placeholder text', () => {
    const mockOnChange = mock(() => {});

    render(
      <SearchInput
        value=""
        onChange={mockOnChange}
        placeholder="Search materials..."
        ariaLabel="Search materials"
      />
    );

    const input = screen.getByPlaceholderText('Search materials...') as HTMLInputElement;
    expect(input).toBeDefined();
    expect(input.value).toBe('');
    expect(input.getAttribute('aria-label')).toBe('Search materials');

    cleanup();
  });

  test('debounces onChange callback by 300ms', async () => {
    const mockOnChange = mock(() => {});

    render(
      <SearchInput
        value=""
        onChange={mockOnChange}
        placeholder="Search..."
        debounceMs={300}
      />
    );

    const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;

    // Type into the input
    fireEvent.change(input, { target: { value: 'test query' } });

    // onChange should not be called immediately
    expect(mockOnChange).not.toHaveBeenCalled();

    // Wait for debounce delay
    await waitFor(
      () => {
        expect(mockOnChange).toHaveBeenCalledTimes(1);
        expect(mockOnChange).toHaveBeenCalledWith('test query');
      },
      { timeout: 400 }
    );

    cleanup();
  });

  test('shows clear button when value is present', () => {
    const mockOnChange = mock(() => {});

    render(
      <SearchInput
        value="test search"
        onChange={mockOnChange}
        placeholder="Search..."
      />
    );

    // Clear button should be visible
    const clearButton = screen.getByLabelText('Clear search');
    expect(clearButton).toBeDefined();

    cleanup();
  });

  test('clicking clear button resets value and calls onChange immediately', async () => {
    const mockOnChange = mock(() => {});

    render(
      <SearchInput
        value="test search"
        onChange={mockOnChange}
        placeholder="Search..."
      />
    );

    const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
    expect(input.value).toBe('test search');

    // Click the clear button
    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);

    // onChange should be called immediately (no debounce)
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('');

    // Input value should be cleared
    expect(input.value).toBe('');

    cleanup();
  });

  test('custom debounce delay works correctly', async () => {
    const mockOnChange = mock(() => {});

    render(
      <SearchInput
        value=""
        onChange={mockOnChange}
        placeholder="Search..."
        debounceMs={500}
      />
    );

    const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'custom debounce' } });

    // Should not be called after 300ms (default)
    await new Promise(resolve => setTimeout(resolve, 300));
    expect(mockOnChange).not.toHaveBeenCalled();

    // Should be called after 500ms
    await waitFor(
      () => {
        expect(mockOnChange).toHaveBeenCalledTimes(1);
        expect(mockOnChange).toHaveBeenCalledWith('custom debounce');
      },
      { timeout: 300 }
    );

    cleanup();
  });
});
