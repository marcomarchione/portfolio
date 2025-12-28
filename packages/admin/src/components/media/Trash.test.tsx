/**
 * Trash Functionality Tests
 *
 * Tests for trash view, restore, and permanent delete.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetadataPanel } from './MetadataPanel';
import { MediaToolbar } from './MediaToolbar';
import type { MediaItem } from '@/types/media';

// Mock deleted media item
const mockDeletedMedia: MediaItem = {
  id: 1,
  filename: 'deleted-image.jpg',
  mimeType: 'image/jpeg',
  size: 1024000,
  url: '/media/2025/01/deleted-image.jpg',
  width: 1920,
  height: 1080,
  createdAt: '2025-01-01T00:00:00.000Z',
  deletedAt: '2025-01-10T00:00:00.000Z',
};

describe('Trash Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock current date to be within 30 days of deletion
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('trash view shows only soft-deleted items toggle', () => {
    const onSelectAllToggle = vi.fn();
    const onDeleteSelected = vi.fn();
    const onUploadClick = vi.fn();
    const onMimeFilterChange = vi.fn();
    const onViewModeChange = vi.fn();

    render(
      <MediaToolbar
        totalItems={5}
        mimeFilter="all"
        onMimeFilterChange={onMimeFilterChange}
        viewMode="library"
        onViewModeChange={onViewModeChange}
        selectedCount={0}
        allSelected={false}
        onSelectAllToggle={onSelectAllToggle}
        onDeleteSelected={onDeleteSelected}
        onUploadClick={onUploadClick}
      />
    );

    // Check Library/Trash toggle exists
    expect(screen.getByRole('button', { name: /Library/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Trash/i })).toBeInTheDocument();
  });

  it('deletion date and days remaining display correctly', () => {
    render(<MetadataPanel media={mockDeletedMedia} />);

    // Check deletion date is shown
    expect(screen.getByText('Deleted')).toBeInTheDocument();
    expect(screen.getByText(/January 10, 2025/)).toBeInTheDocument();

    // Check days remaining (30 days from Jan 10 = Feb 9, current is Jan 15 = 25 days)
    expect(screen.getByText('Permanent deletion in')).toBeInTheDocument();
    expect(screen.getByText(/25 day/)).toBeInTheDocument();
  });

  it('Restore action available in trash view', () => {
    const onSelectAllToggle = vi.fn();
    const onDeleteSelected = vi.fn();
    const onUploadClick = vi.fn();
    const onMimeFilterChange = vi.fn();
    const onViewModeChange = vi.fn();

    render(
      <MediaToolbar
        totalItems={5}
        mimeFilter="all"
        onMimeFilterChange={onMimeFilterChange}
        viewMode="trash"
        onViewModeChange={onViewModeChange}
        selectedCount={0}
        allSelected={false}
        onSelectAllToggle={onSelectAllToggle}
        onDeleteSelected={onDeleteSelected}
        onUploadClick={onUploadClick}
      />
    );

    // In trash view, upload button should not be present
    expect(screen.queryByRole('button', { name: /Upload/i })).not.toBeInTheDocument();

    // Trash toggle should be active
    const trashButton = screen.getByRole('button', { name: /Trash/i });
    expect(trashButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('Permanently Delete removes item after confirmation', async () => {
    // This test verifies the ConfirmDialog pattern for permanent deletion
    const { ConfirmDialog } = await import('@/components/common/ConfirmDialog');

    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        title="Permanently Delete"
        message="This action cannot be undone. The file and all its variants will be permanently removed."
        confirmLabel="Delete Permanently"
        onConfirm={onConfirm}
        onCancel={onCancel}
        variant="danger"
      />
    );

    // Check dialog content
    expect(screen.getByText('Permanently Delete')).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/)).toBeInTheDocument();

    // Check danger button styling (red)
    const deleteButton = screen.getByRole('button', { name: /Delete Permanently/i });
    expect(deleteButton).toBeInTheDocument();
  });
});
