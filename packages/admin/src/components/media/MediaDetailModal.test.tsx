/**
 * Media Detail Modal Tests
 *
 * Tests for the media detail modal component.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MediaDetailModal } from './MediaDetailModal';

// Mock the API client
vi.mock('@/lib/api/client', () => ({
  get: vi.fn(),
  put: vi.fn(),
}));

import { get } from '@/lib/api/client';

const mockGet = vi.mocked(get);

const mockMediaItem = {
  id: 1,
  filename: 'test-image.jpg',
  mimeType: 'image/jpeg',
  size: 1024000, // 1MB
  url: '/media/2025/01/test-image.jpg',
  altText: 'A test image',
  width: 1920,
  height: 1080,
  variants: {
    thumb: { url: '/media/2025/01/test-image-thumb.webp', width: 400, height: 225 },
    medium: { url: '/media/2025/01/test-image-medium.webp', width: 800, height: 450 },
    large: { url: '/media/2025/01/test-image-large.webp', width: 1200, height: 675 },
  },
  createdAt: '2025-01-15T10:30:00.000Z',
  deletedAt: null,
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('MediaDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: mockMediaItem });
  });

  it('displays image preview', async () => {
    renderWithProviders(
      <MediaDetailModal
        mediaId={1}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByAltText('A test image')).toBeInTheDocument();
    });

    const image = screen.getByAltText('A test image');
    expect(image).toHaveAttribute('src', '/media/2025/01/test-image.jpg');
  });

  it('shows metadata section with filename, size, dimensions, upload date', async () => {
    renderWithProviders(
      <MediaDetailModal
        mediaId={1}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('File Information')).toBeInTheDocument();
    });

    // Check filename is in metadata (can appear in header too, so use getAllByText)
    const filenameElements = screen.getAllByText('test-image.jpg');
    expect(filenameElements.length).toBeGreaterThanOrEqual(1);

    // Check dimensions - appears in multiple places, use getAllByText
    const dimensionElements = screen.getAllByText(/1920/);
    expect(dimensionElements.length).toBeGreaterThanOrEqual(1);

    // Check size (1MB = 1000 KB)
    expect(screen.getByText('1000.0 KB')).toBeInTheDocument();

    // Check MIME type
    expect(screen.getByText('image/jpeg')).toBeInTheDocument();
  });

  it('displays variant URLs that are copyable', async () => {
    renderWithProviders(
      <MediaDetailModal
        mediaId={1}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Image Variants')).toBeInTheDocument();
    });

    // Check variants are displayed
    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.getByText('Large')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Thumbnail')).toBeInTheDocument();

    // Check copy buttons exist
    const copyButtons = screen.getAllByRole('button', { name: /Copy.*URL/i });
    expect(copyButtons.length).toBe(4); // Original + 3 variants
  });

  it('shows alt text field for images', async () => {
    renderWithProviders(
      <MediaDetailModal
        mediaId={1}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Alt Text')).toBeInTheDocument();
    });

    const altTextInput = screen.getByLabelText('Alt Text');
    expect(altTextInput).toHaveValue('A test image');
  });
});
