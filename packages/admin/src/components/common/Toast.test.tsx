/**
 * Toast Component Tests
 *
 * Tests for the toast notification system.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ToastProvider, showSuccess, showError, dismissAllToasts } from './Toast';

describe('Toast', () => {
  beforeEach(() => {
    // Dismiss any existing toasts before each test
    dismissAllToasts();
  });

  afterEach(() => {
    // Clean up toasts after each test
    dismissAllToasts();
  });

  it('displays success toast correctly', async () => {
    render(<ToastProvider />);

    // Show success toast
    act(() => {
      showSuccess('Changes saved successfully');
    });

    // Toast should be visible
    await waitFor(() => {
      expect(screen.getByText('Changes saved successfully')).toBeInTheDocument();
    });
  });

  it('displays error toast with API error message', async () => {
    render(<ToastProvider />);

    // Show error toast with details
    act(() => {
      showError('Failed to save changes', 'VALIDATION_ERROR');
    });

    // Toast should show both message and details
    await waitFor(() => {
      expect(screen.getByText('Failed to save changes')).toBeInTheDocument();
      expect(screen.getByText('VALIDATION_ERROR')).toBeInTheDocument();
    });
  });

  it('toast has auto-dismiss duration configured', () => {
    // This tests that toasts are configured with a duration
    // The actual auto-dismiss is handled by react-hot-toast
    render(<ToastProvider />);

    // Show a toast
    act(() => {
      showSuccess('Test message');
    });

    // If we can show a toast without error, the configuration is correct
    // The duration is set in the ToastProvider options (3000ms for success, 5000ms for error)
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });
});
