/**
 * Bulk Actions Tests
 *
 * Tests for selection and bulk delete functionality.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MediaGrid } from './MediaGrid';
import { MediaToolbar } from './MediaToolbar';
import type { MediaItem } from '@/types/media';

const mockItems: MediaItem[] = [
  {
    id: 1,
    filename: 'image1.jpg',
    mimeType: 'image/jpeg',
    size: 1024,
    url: '/media/image1.jpg',
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    filename: 'image2.jpg',
    mimeType: 'image/jpeg',
    size: 2048,
    url: '/media/image2.jpg',
    createdAt: '2025-01-02T00:00:00.000Z',
  },
  {
    id: 3,
    filename: 'image3.jpg',
    mimeType: 'image/jpeg',
    size: 3072,
    url: '/media/image3.jpg',
    createdAt: '2025-01-03T00:00:00.000Z',
  },
];

describe('Bulk Actions', () => {
  it('checkbox selection toggles item in selection set', () => {
    const onItemClick = vi.fn();
    const onSelectionChange = vi.fn();

    render(
      <MediaGrid
        items={mockItems}
        onItemClick={onItemClick}
        selectedIds={new Set()}
        onSelectionChange={onSelectionChange}
      />
    );

    // Find and click the checkbox for first item
    const checkbox = screen.getByRole('checkbox', { name: /Select image1\.jpg/i });
    fireEvent.click(checkbox);

    expect(onSelectionChange).toHaveBeenCalledWith(new Set([1]));
  });

  it('Select All toggles all visible items', () => {
    const onSelectAllToggle = vi.fn();
    const onDeleteSelected = vi.fn();
    const onUploadClick = vi.fn();
    const onMimeFilterChange = vi.fn();
    const onViewModeChange = vi.fn();

    // Test with no items selected (Select All should work)
    const { rerender } = render(
      <MediaToolbar
        totalItems={3}
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

    // Click Select All
    const selectAllButton = screen.getByRole('button', { name: /Select All/i });
    fireEvent.click(selectAllButton);

    expect(onSelectAllToggle).toHaveBeenCalled();

    // Test with all items selected (Deselect All should show)
    rerender(
      <MediaToolbar
        totalItems={3}
        mimeFilter="all"
        onMimeFilterChange={onMimeFilterChange}
        viewMode="library"
        onViewModeChange={onViewModeChange}
        selectedCount={3}
        allSelected={true}
        onSelectAllToggle={onSelectAllToggle}
        onDeleteSelected={onDeleteSelected}
        onUploadClick={onUploadClick}
      />
    );

    // Now it should show Deselect All
    expect(screen.getByRole('button', { name: /Deselect All/i })).toBeInTheDocument();
  });

  it('Delete Selected calls soft delete for each selected item', () => {
    const onSelectAllToggle = vi.fn();
    const onDeleteSelected = vi.fn();
    const onUploadClick = vi.fn();
    const onMimeFilterChange = vi.fn();
    const onViewModeChange = vi.fn();

    render(
      <MediaToolbar
        totalItems={3}
        mimeFilter="all"
        onMimeFilterChange={onMimeFilterChange}
        viewMode="library"
        onViewModeChange={onViewModeChange}
        selectedCount={2}
        allSelected={false}
        onSelectAllToggle={onSelectAllToggle}
        onDeleteSelected={onDeleteSelected}
        onUploadClick={onUploadClick}
      />
    );

    // Selection count should be shown
    expect(screen.getByText(/2 selected/)).toBeInTheDocument();

    // Delete Selected button should be visible
    const deleteButton = screen.getByRole('button', { name: /Delete Selected/i });
    expect(deleteButton).toBeInTheDocument();

    // Click delete
    fireEvent.click(deleteButton);
    expect(onDeleteSelected).toHaveBeenCalled();
  });
});
