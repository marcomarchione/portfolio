/**
 * Shared Media Components Tests
 *
 * Tests for Pagination, MimeTypeFilter, and DropZone components.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '@/components/common/Pagination';
import { MimeTypeFilter } from './MimeTypeFilter';
import { DropZone } from './DropZone';

describe('Pagination', () => {
  it('renders page numbers correctly', () => {
    const onPageChange = vi.fn();

    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={onPageChange}
      />
    );

    // Should render page numbers 1-5
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument();

    // Current page should be marked
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
  });

  it('navigates to correct page on click', () => {
    const onPageChange = vi.fn();

    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={onPageChange}
      />
    );

    // Click page 4
    fireEvent.click(screen.getByRole('button', { name: 'Page 4' }));
    expect(onPageChange).toHaveBeenCalledWith(4);

    // Click previous
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(onPageChange).toHaveBeenCalledWith(1);

    // Click next
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});

describe('MimeTypeFilter', () => {
  it('displays filter options when opened', () => {
    const onChange = vi.fn();

    render(
      <MimeTypeFilter
        value="all"
        onChange={onChange}
      />
    );

    // Custom dropdown uses a button trigger
    const trigger = screen.getByRole('button', { name: 'Filter by file type' });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('All Files');

    // Open dropdown
    fireEvent.click(trigger);

    // Check options are available
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent('All Files');
    expect(options[1]).toHaveTextContent('Images');
    expect(options[2]).toHaveTextContent('Documents');
  });

  it('calls onChange when option is clicked', () => {
    const onChange = vi.fn();

    render(
      <MimeTypeFilter
        value="all"
        onChange={onChange}
      />
    );

    // Open dropdown
    const trigger = screen.getByRole('button', { name: 'Filter by file type' });
    fireEvent.click(trigger);

    // Click "Images" option
    const imagesOption = screen.getByRole('option', { name: 'Images' });
    fireEvent.click(imagesOption);

    expect(onChange).toHaveBeenCalledWith('image');
  });
});

describe('DropZone', () => {
  it('displays visual states correctly', () => {
    const onDrop = vi.fn();

    // Idle state
    const { rerender } = render(
      <DropZone onDrop={onDrop} isUploading={false} />
    );

    expect(screen.getByText('Drag and drop files here')).toBeInTheDocument();
    expect(screen.getByText('or click to browse')).toBeInTheDocument();

    // Uploading state
    rerender(<DropZone onDrop={onDrop} isUploading={true} />);

    expect(screen.getByText('Uploading files...')).toBeInTheDocument();
    expect(screen.getByText('Please wait')).toBeInTheDocument();
  });

  it('handles click to open file picker', () => {
    const onDrop = vi.fn();

    render(<DropZone onDrop={onDrop} />);

    const dropzone = screen.getByRole('button', { name: 'Drop files here to upload' });
    expect(dropzone).toBeInTheDocument();

    // Check that file input exists
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('multiple');
  });
});
