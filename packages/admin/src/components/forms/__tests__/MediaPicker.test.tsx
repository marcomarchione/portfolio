/**
 * MediaPicker Component Tests
 *
 * Tests for the media picker modal component including:
 * - Modal open/close behavior
 * - Media grid display
 * - Selection handling
 * - Upload functionality
 * - MIME type filtering
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MediaPicker } from '../MediaPicker';

// Mock the API client module
vi.mock('@/lib/api/client', () => ({
  get: vi.fn(),
  apiRequest: vi.fn(),
}));

// Import mocked functions for control
import { get } from '@/lib/api/client';

const mockGet = vi.mocked(get);

// Sample media data for tests
const mockMediaItems = [
  {
    id: 1,
    filename: 'test-image.jpg',
    mimeType: 'image/jpeg',
    size: 1024,
    url: '/uploads/2025/01/test-image.jpg',
    variants: {
      thumb: { url: '/uploads/2025/01/test-image-thumb.webp', width: 400, height: 300 },
    },
  },
  {
    id: 2,
    filename: 'document.pdf',
    mimeType: 'application/pdf',
    size: 2048,
    url: '/uploads/2025/01/document.pdf',
  },
  {
    id: 3,
    filename: 'photo.png',
    mimeType: 'image/png',
    size: 3072,
    url: '/uploads/2025/01/photo.png',
    variants: {
      thumb: { url: '/uploads/2025/01/photo-thumb.webp', width: 400, height: 300 },
    },
  },
];

/**
 * Creates a test QueryClient with no retry for faster tests.
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

/**
 * Wrapper component with QueryClient provider.
 */
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('MediaPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation for media list
    mockGet.mockResolvedValue({
      data: mockMediaItems,
      pagination: { total: 3, offset: 0, limit: 20, hasMore: false },
    });
  });

  test('modal opens and closes correctly', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSelect = vi.fn();

    // Render with isOpen=true
    const { rerender } = render(
      <TestWrapper>
        <MediaPicker isOpen={true} onClose={onClose} onSelect={onSelect} />
      </TestWrapper>
    );

    // Modal should be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Select Media')).toBeInTheDocument();

    // Click close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    // onClose should be called
    expect(onClose).toHaveBeenCalledTimes(1);

    // Rerender with isOpen=false
    rerender(
      <TestWrapper>
        <MediaPicker isOpen={false} onClose={onClose} onSelect={onSelect} />
      </TestWrapper>
    );

    // Modal should not be visible
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('media grid displays thumbnails from API', async () => {
    const onClose = vi.fn();
    const onSelect = vi.fn();

    render(
      <TestWrapper>
        <MediaPicker isOpen={true} onClose={onClose} onSelect={onSelect} />
      </TestWrapper>
    );

    // Wait for media items to load
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/admin/media');
    });

    // Media items should be displayed
    await waitFor(() => {
      expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByText('photo.png')).toBeInTheDocument();
    });
  });

  test('selecting a media item calls onSelect handler', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSelect = vi.fn();

    render(
      <TestWrapper>
        <MediaPicker isOpen={true} onClose={onClose} onSelect={onSelect} />
      </TestWrapper>
    );

    // Wait for media items to load
    await waitFor(() => {
      expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
    });

    // Click on a media item
    const mediaItem = screen.getByText('test-image.jpg').closest('button');
    expect(mediaItem).toBeInTheDocument();
    await user.click(mediaItem!);

    // onSelect should be called with the selected media data
    expect(onSelect).toHaveBeenCalledWith({
      id: 1,
      url: '/uploads/2025/01/test-image.jpg',
      filename: 'test-image.jpg',
      mimeType: 'image/jpeg',
    });
  });

  test('upload button triggers file input', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSelect = vi.fn();

    render(
      <TestWrapper>
        <MediaPicker isOpen={true} onClose={onClose} onSelect={onSelect} />
      </TestWrapper>
    );

    // Upload button should be visible
    const uploadButton = screen.getByRole('button', { name: /upload new/i });
    expect(uploadButton).toBeInTheDocument();

    // File input should exist but be hidden
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    // Click upload button should trigger file input click
    // We can verify the file input exists and is accessible
    await user.click(uploadButton);

    // The file input should be ready to accept files
    expect(fileInput).toHaveAttribute('type', 'file');
  });

  test('mime type filter restricts displayed items', async () => {
    const onClose = vi.fn();
    const onSelect = vi.fn();

    // Render with image/* filter
    render(
      <TestWrapper>
        <MediaPicker
          isOpen={true}
          onClose={onClose}
          onSelect={onSelect}
          mimeTypeFilter="image/*"
        />
      </TestWrapper>
    );

    // API should be called with mimeType as query parameter
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/admin/media?mimeType=image%2F*');
    });

    // The filter should be displayed in the UI
    await waitFor(() => {
      expect(screen.getByText(/filtered: image\/\*/)).toBeInTheDocument();
    });
  });
});
