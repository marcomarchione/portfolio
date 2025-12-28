/**
 * Upload Queue Tests
 *
 * Tests for the upload queue component.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UploadQueue } from './UploadQueue';
import type { UploadQueueItem } from '@/types/media';

describe('UploadQueue', () => {
  it('displays pending/uploading/complete/error states', () => {
    const items: UploadQueueItem[] = [
      {
        id: '1',
        file: new File(['test'], 'pending.jpg', { type: 'image/jpeg' }),
        status: 'pending',
        progress: 0,
      },
      {
        id: '2',
        file: new File(['test'], 'uploading.jpg', { type: 'image/jpeg' }),
        status: 'uploading',
        progress: 50,
      },
      {
        id: '3',
        file: new File(['test'], 'complete.jpg', { type: 'image/jpeg' }),
        status: 'complete',
        progress: 100,
      },
      {
        id: '4',
        file: new File(['test'], 'error.jpg', { type: 'image/jpeg' }),
        status: 'error',
        progress: 0,
        error: 'Upload failed',
      },
    ];

    const onRemove = vi.fn();

    render(<UploadQueue items={items} onRemove={onRemove} />);

    // Check queue header
    expect(screen.getByText('Upload Queue (4)')).toBeInTheDocument();

    // Check each file is displayed
    expect(screen.getByText('pending.jpg')).toBeInTheDocument();
    expect(screen.getByText('uploading.jpg')).toBeInTheDocument();
    expect(screen.getByText('complete.jpg')).toBeInTheDocument();
    expect(screen.getByText('error.jpg')).toBeInTheDocument();

    // Check pending status
    expect(screen.getByText('Waiting...')).toBeInTheDocument();

    // Check error message
    expect(screen.getByText('Upload failed')).toBeInTheDocument();
  });

  it('file validation rejects invalid types with error message', () => {
    const items: UploadQueueItem[] = [
      {
        id: '1',
        file: new File(['test'], 'script.exe', { type: 'application/x-msdownload' }),
        status: 'error',
        progress: 0,
        error: 'File type application/x-msdownload is not supported',
      },
    ];

    const onRemove = vi.fn();

    render(<UploadQueue items={items} onRemove={onRemove} />);

    expect(screen.getByText('script.exe')).toBeInTheDocument();
    expect(screen.getByText('File type application/x-msdownload is not supported')).toBeInTheDocument();
  });

  it('returns null when no items', () => {
    const onRemove = vi.fn();

    const { container } = render(<UploadQueue items={[]} onRemove={onRemove} />);

    expect(container.firstChild).toBeNull();
  });
});
