/**
 * Media Grid Tests
 *
 * Tests for the media grid component.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MediaGrid } from './MediaGrid';
import type { MediaItem } from '@/types/media';

const mockItems: MediaItem[] = [
  {
    id: 1,
    filename: 'test-image.jpg',
    mimeType: 'image/jpeg',
    size: 1024,
    url: '/media/2025/01/test-image.jpg',
    altText: 'Test image',
    width: 800,
    height: 600,
    variants: {
      thumb: { url: '/media/2025/01/test-image-thumb.webp', width: 400, height: 300 },
    },
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    filename: 'document.pdf',
    mimeType: 'application/pdf',
    size: 2048,
    url: '/media/2025/01/document.pdf',
    createdAt: '2025-01-02T00:00:00.000Z',
  },
];

describe('MediaGrid', () => {
  it('renders items with thumbnails', () => {
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

    // Check items are rendered
    expect(screen.getByRole('grid')).toBeInTheDocument();

    // Image should have thumbnail
    const image = screen.getByAltText('Test image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/media/2025/01/test-image-thumb.webp');

    // PDF should have file icon (no thumbnail)
    expect(screen.getByRole('gridcell', { name: /document\.pdf/i })).toBeInTheDocument();
  });

  it('handles item click', () => {
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

    // Click on first item
    fireEvent.click(screen.getByRole('gridcell', { name: /test-image\.jpg/i }));

    expect(onItemClick).toHaveBeenCalledWith(mockItems[0]);
  });

  it('shows selection state correctly', () => {
    const onItemClick = vi.fn();
    const onSelectionChange = vi.fn();

    render(
      <MediaGrid
        items={mockItems}
        onItemClick={onItemClick}
        selectedIds={new Set([1])}
        onSelectionChange={onSelectionChange}
      />
    );

    // First item should be selected
    const firstItem = screen.getByRole('gridcell', { name: /test-image\.jpg/i });
    expect(firstItem).toHaveAttribute('aria-selected', 'true');

    // Second item should not be selected
    const secondItem = screen.getByRole('gridcell', { name: /document\.pdf/i });
    expect(secondItem).toHaveAttribute('aria-selected', 'false');
  });

  it('displays empty state when no items', () => {
    const onItemClick = vi.fn();
    const onSelectionChange = vi.fn();

    render(
      <MediaGrid
        items={[]}
        onItemClick={onItemClick}
        selectedIds={new Set()}
        onSelectionChange={onSelectionChange}
      />
    );

    expect(screen.getByText('No media files found.')).toBeInTheDocument();
  });
});
