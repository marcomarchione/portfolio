/**
 * ColorPicker Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ColorPicker } from './ColorPicker';

describe('ColorPicker', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with label', () => {
    render(
      <ColorPicker
        label="Color"
        value={null}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Color')).toBeInTheDocument();
  });

  it('displays placeholder when no value', () => {
    render(
      <ColorPicker
        label="Color"
        value={null}
        onChange={mockOnChange}
        placeholder="Enter color"
      />
    );

    expect(screen.getByPlaceholderText('Enter color')).toBeInTheDocument();
  });

  it('displays current value in input', () => {
    render(
      <ColorPicker
        label="Color"
        value="FF0000"
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('FF0000');
  });

  it('shows color swatch', () => {
    const { container } = render(
      <ColorPicker
        label="Color"
        value="3B82F6"
        onChange={mockOnChange}
      />
    );

    // Just verify the swatch element exists
    const swatch = container.querySelector('.w-10.h-10.rounded-lg');
    expect(swatch).toBeInTheDocument();
  });

  it('calls onChange with valid hex input', () => {
    render(
      <ColorPicker
        label="Color"
        value={null}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '00FF00' } });

    expect(mockOnChange).toHaveBeenCalledWith('00FF00');
  });

  it('strips # from input', () => {
    render(
      <ColorPicker
        label="Color"
        value={null}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '#FF0000' } });

    expect(input).toHaveValue('FF0000');
  });

  it('converts input to uppercase', () => {
    render(
      <ColorPicker
        label="Color"
        value={null}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'aabbcc' } });

    expect(input).toHaveValue('AABBCC');
  });

  it('limits input to 6 characters', () => {
    render(
      <ColorPicker
        label="Color"
        value={null}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'AABBCCDD' } });

    expect(input).toHaveValue('AABBCC');
  });

  it('removes invalid characters', () => {
    render(
      <ColorPicker
        label="Color"
        value={null}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'GH12XY' } });

    expect(input).toHaveValue('12');
  });

  it('clears value when clear button is clicked', () => {
    render(
      <ColorPicker
        label="Color"
        value="FF0000"
        onChange={mockOnChange}
      />
    );

    const clearButton = screen.getByLabelText('Clear color');
    fireEvent.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('opens color palette on focus', async () => {
    render(
      <ColorPicker
        label="Color"
        value={null}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('Preset Colors')).toBeInTheDocument();
    });
  });

  it('selects preset color when clicked', async () => {
    render(
      <ColorPicker
        label="Color"
        value={null}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    const redPreset = await screen.findByTitle('#EF4444');
    fireEvent.click(redPreset);

    expect(mockOnChange).toHaveBeenCalledWith('EF4444');
  });

  it('shows icon brand color when iconSlug is provided', async () => {
    render(
      <ColorPicker
        label="Color"
        value={null}
        onChange={mockOnChange}
        iconSlug="react"
      />
    );

    // Check for the pipette button that appears when iconSlug is provided
    expect(screen.getByTitle(/Use icon color/)).toBeInTheDocument();
  });

  it('picks icon brand color when button is clicked', async () => {
    render(
      <ColorPicker
        label="Color"
        value={null}
        onChange={mockOnChange}
        iconSlug="react"
      />
    );

    const pipetteButton = screen.getByTitle(/Use icon color/);
    fireEvent.click(pipetteButton);

    // React's brand color is 61DAFB
    expect(mockOnChange).toHaveBeenCalledWith('61DAFB');
  });

  it('displays error message when error prop is provided', () => {
    render(
      <ColorPicker
        label="Color"
        value={null}
        onChange={mockOnChange}
        error="Invalid color"
      />
    );

    expect(screen.getByText('Invalid color')).toBeInTheDocument();
  });

  it('displays help text when provided', () => {
    render(
      <ColorPicker
        label="Color"
        value={null}
        onChange={mockOnChange}
        helpText="Enter a hex color"
      />
    );

    expect(screen.getByText('Enter a hex color')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <ColorPicker
        label="Color"
        value={null}
        onChange={mockOnChange}
        disabled
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('calls onChange with null when input is cleared', () => {
    render(
      <ColorPicker
        label="Color"
        value="FF0000"
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '' } });

    expect(mockOnChange).toHaveBeenCalledWith(null);
  });
});
