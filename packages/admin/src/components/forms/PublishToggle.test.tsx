/**
 * PublishToggle Component Tests
 *
 * Tests for the publish status toggle component with confirmation dialog.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PublishToggle } from './PublishToggle';

describe('PublishToggle', () => {
  it('displays current status with correct styling', () => {
    const { rerender } = render(
      <PublishToggle status="draft" onStatusChange={vi.fn()} />
    );

    // Draft should have gray styling - find the parent badge span
    const draftText = screen.getByText('Draft');
    expect(draftText).toBeInTheDocument();
    // The text is inside a span which is inside the badge span
    const draftBadge = draftText.parentElement;
    expect(draftBadge).toHaveClass('bg-neutral-500/20');

    // Rerender with published status
    rerender(<PublishToggle status="published" onStatusChange={vi.fn()} />);
    const publishedText = screen.getByText('Published');
    expect(publishedText).toBeInTheDocument();
    const publishedBadge = publishedText.parentElement;
    expect(publishedBadge).toHaveClass('bg-green-500/20');

    // Rerender with archived status
    rerender(<PublishToggle status="archived" onStatusChange={vi.fn()} />);
    const archivedText = screen.getByText('Archived');
    expect(archivedText).toBeInTheDocument();
    const archivedBadge = archivedText.parentElement;
    expect(archivedBadge).toHaveClass('bg-red-500/20');
  });

  it('clicking toggle opens confirmation dialog', async () => {
    const user = userEvent.setup();

    render(<PublishToggle status="draft" onStatusChange={vi.fn()} />);

    // Click the publish button
    const publishButton = screen.getByRole('button', { name: /publish/i });
    await user.click(publishButton);

    // Confirmation dialog should appear
    expect(
      screen.getByText(/are you sure you want to publish/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('confirming publish calls onStatusChange', async () => {
    const user = userEvent.setup();
    const handleStatusChange = vi.fn();

    render(
      <PublishToggle status="draft" onStatusChange={handleStatusChange} />
    );

    // Open confirmation dialog
    const publishButton = screen.getByRole('button', { name: /publish/i });
    await user.click(publishButton);

    // Confirm the action
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    // onStatusChange should be called with 'published'
    await waitFor(() => {
      expect(handleStatusChange).toHaveBeenCalledWith('published');
    });
  });

  it('cancel closes dialog without change', async () => {
    const user = userEvent.setup();
    const handleStatusChange = vi.fn();

    render(
      <PublishToggle status="draft" onStatusChange={handleStatusChange} />
    );

    // Open confirmation dialog
    const publishButton = screen.getByRole('button', { name: /publish/i });
    await user.click(publishButton);

    // Cancel the action
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // onStatusChange should NOT be called
    expect(handleStatusChange).not.toHaveBeenCalled();

    // Dialog should be closed
    expect(
      screen.queryByText(/are you sure you want to publish/i)
    ).not.toBeInTheDocument();
  });
});
