/**
 * IconPicker Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IconPicker } from './IconPicker';

describe('IconPicker', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with label', () => {
    render(
      <IconPicker
        label="Icon"
        value={null}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Icon')).toBeInTheDocument();
  });

  it('displays placeholder when no value selected', () => {
    render(
      <IconPicker
        label="Icon"
        value={null}
        onChange={mockOnChange}
        placeholder="Choose an icon"
      />
    );

    expect(screen.getByText('Choose an icon')).toBeInTheDocument();
  });

  it('displays selected icon title when value is set', () => {
    render(
      <IconPicker
        label="Icon"
        value="react"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('opens popup when clicked', async () => {
    render(
      <IconPicker
        label="Icon"
        value={null}
        onChange={mockOnChange}
      />
    );

    // Get the trigger button by ID
    const trigger = document.getElementById('icon-picker') as HTMLButtonElement;
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search icons...')).toBeInTheDocument();
    });
  });

  it('filters icons based on search query', async () => {
    render(
      <IconPicker
        label="Icon"
        value={null}
        onChange={mockOnChange}
      />
    );

    const trigger = document.getElementById('icon-picker') as HTMLButtonElement;
    fireEvent.click(trigger);

    const searchInput = await screen.findByPlaceholderText('Search icons...');
    fireEvent.change(searchInput, { target: { value: 'react' } });

    await waitFor(() => {
      expect(screen.getByTitle('React')).toBeInTheDocument();
    });
  });

  it('calls onChange when icon is selected', async () => {
    render(
      <IconPicker
        label="Icon"
        value={null}
        onChange={mockOnChange}
      />
    );

    const trigger = document.getElementById('icon-picker') as HTMLButtonElement;
    fireEvent.click(trigger);

    const searchInput = await screen.findByPlaceholderText('Search icons...');
    fireEvent.change(searchInput, { target: { value: 'react' } });

    const reactIcon = await screen.findByTitle('React');
    fireEvent.click(reactIcon);

    expect(mockOnChange).toHaveBeenCalledWith('react');
  });

  it('clears selection when clear button is clicked', async () => {
    render(
      <IconPicker
        label="Icon"
        value="react"
        onChange={mockOnChange}
      />
    );

    const clearButton = screen.getByLabelText('Clear icon');
    fireEvent.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('closes popup when escape is pressed', async () => {
    render(
      <IconPicker
        label="Icon"
        value={null}
        onChange={mockOnChange}
      />
    );

    const trigger = document.getElementById('icon-picker') as HTMLButtonElement;
    fireEvent.click(trigger);

    await screen.findByPlaceholderText('Search icons...');

    fireEvent.keyDown(trigger, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search icons...')).not.toBeInTheDocument();
    });
  });

  it('displays error message when error prop is provided', () => {
    render(
      <IconPicker
        label="Icon"
        value={null}
        onChange={mockOnChange}
        error="Please select an icon"
      />
    );

    expect(screen.getByText('Please select an icon')).toBeInTheDocument();
  });

  it('displays help text when provided', () => {
    render(
      <IconPicker
        label="Icon"
        value={null}
        onChange={mockOnChange}
        helpText="Select a technology icon"
      />
    );

    expect(screen.getByText('Select a technology icon')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <IconPicker
        label="Icon"
        value={null}
        onChange={mockOnChange}
        disabled
      />
    );

    const trigger = document.getElementById('icon-picker') as HTMLButtonElement;
    expect(trigger).toBeDisabled();

    fireEvent.click(trigger);
    expect(screen.queryByPlaceholderText('Search icons...')).not.toBeInTheDocument();
  });

  it('shows count of filtered icons', async () => {
    render(
      <IconPicker
        label="Icon"
        value={null}
        onChange={mockOnChange}
      />
    );

    const trigger = document.getElementById('icon-picker') as HTMLButtonElement;
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText(/icons shown/)).toBeInTheDocument();
    });
  });
});
