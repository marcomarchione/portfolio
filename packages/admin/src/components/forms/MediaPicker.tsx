/**
 * Media Picker Modal Component
 *
 * Modal for selecting media from the library or uploading new files.
 * Features:
 * - Grid view of available media with thumbnails
 * - Optional MIME type filtering (e.g., 'image/*' for cover photos)
 * - Upload new files directly within the modal
 * - Visual selection state with ring indicator
 */
import { useRef, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, Loader2, Image as ImageIcon, File } from 'lucide-react';
import { get } from '@/lib/api/client';
import { mediaKeys } from '@/lib/query/keys';
import type { PaginatedResponse } from '@/types/api';

/**
 * Media item from the API.
 */
interface MediaItem {
  id: number;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
  variants?: {
    thumb?: {
      url: string;
      width: number;
      height: number;
    };
    medium?: {
      url: string;
      width: number;
      height: number;
    };
    large?: {
      url: string;
      width: number;
      height: number;
    };
  };
}

/**
 * Selected media data returned to the calling form.
 */
export interface SelectedMedia {
  id: number;
  url: string;
  filename: string;
  mimeType: string;
}

/**
 * Props for the MediaPicker component.
 */
export interface MediaPickerProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Callback when a media item is selected */
  onSelect: (media: SelectedMedia) => void;
  /** Optional MIME type filter (e.g., 'image/*', 'application/pdf') */
  mimeTypeFilter?: string;
}

/**
 * Gets the thumbnail URL for a media item.
 * Falls back to original URL for non-image files.
 */
function getThumbnailUrl(media: MediaItem): string | null {
  if (media.variants?.thumb?.url) {
    return media.variants.thumb.url;
  }
  if (media.mimeType.startsWith('image/')) {
    return media.url;
  }
  return null;
}

/**
 * Formats file size for display.
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Builds the API endpoint with query parameters.
 */
function buildMediaEndpoint(mimeTypeFilter?: string): string {
  const params = new URLSearchParams();
  if (mimeTypeFilter) {
    params.set('mimeType', mimeTypeFilter);
  }
  const queryString = params.toString();
  return queryString ? `/admin/media?${queryString}` : '/admin/media';
}

/**
 * Media Picker modal component.
 */
export function MediaPicker({
  isOpen,
  onClose,
  onSelect,
  mimeTypeFilter,
}: MediaPickerProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Build query options based on filter
  const queryOptions = mimeTypeFilter ? { mimeType: mimeTypeFilter } : {};

  // Fetch media list
  const {
    data: mediaResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: mediaKeys.list(queryOptions),
    queryFn: () =>
      get<PaginatedResponse<MediaItem>>(buildMediaEndpoint(mimeTypeFilter)),
    enabled: isOpen,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      // Use fetch directly for FormData upload with progress
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/v1/admin/media', {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate media list to refresh
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });

      // Auto-select the uploaded file
      if (data?.data) {
        const uploadedMedia = data.data as MediaItem;
        onSelect({
          id: uploadedMedia.id,
          url: uploadedMedia.url,
          filename: uploadedMedia.filename,
          mimeType: uploadedMedia.mimeType,
        });
      }

      setUploadProgress(null);
    },
    onError: () => {
      setUploadProgress(null);
    },
  });

  // Handle file selection from input
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setUploadProgress(0);
        uploadMutation.mutate(file);
        // Simulate progress (actual XHR progress would require XMLHttpRequest)
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev === null || prev >= 90) {
              clearInterval(interval);
              return prev;
            }
            return prev + 10;
          });
        }, 100);
      }
      // Reset input value to allow selecting the same file again
      event.target.value = '';
    },
    [uploadMutation]
  );

  // Handle upload button click
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle media item selection
  const handleSelect = useCallback(
    (media: MediaItem) => {
      setSelectedId(media.id);
      onSelect({
        id: media.id,
        url: media.url,
        filename: media.filename,
        mimeType: media.mimeType,
      });
    },
    [onSelect]
  );

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  const mediaItems = mediaResponse?.data ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-picker-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="glass-card relative z-10 w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2
            id="media-picker-title"
            className="text-lg font-display font-semibold text-neutral-100"
          >
            Select Media
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="text-sm text-neutral-400">
            {mediaItems.length} item{mediaItems.length !== 1 ? 's' : ''}
            {mimeTypeFilter && ` (filtered: ${mimeTypeFilter})`}
          </div>
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={uploadMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 text-white font-medium text-sm hover:from-primary-400 hover:to-accent-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload New</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept={mimeTypeFilter || undefined}
            className="sr-only"
            aria-hidden="true"
          />
        </div>

        {/* Upload progress bar */}
        {uploadProgress !== null && (
          <div className="px-4 py-2 border-b border-white/10">
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-400">Failed to load media library</p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && mediaItems.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-400">
                No media files found.
                {mimeTypeFilter && ' Try removing the filter or upload a new file.'}
              </p>
            </div>
          )}

          {/* Media grid */}
          {!isLoading && !error && mediaItems.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {mediaItems.map((media) => {
                const thumbnailUrl = getThumbnailUrl(media);
                const isSelected = selectedId === media.id;

                return (
                  <button
                    key={media.id}
                    type="button"
                    onClick={() => handleSelect(media)}
                    className={`
                      group relative aspect-square rounded-lg overflow-hidden
                      bg-neutral-800/50 border-2 transition-all duration-200
                      hover:border-primary-500/50 hover:scale-105
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950
                      ${isSelected ? 'border-primary-500 ring-2 ring-primary-500/50' : 'border-white/10'}
                    `}
                  >
                    {/* Thumbnail or icon */}
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={media.altText || media.filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <File className="w-12 h-12 text-neutral-500" />
                      </div>
                    )}

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Hover overlay with filename */}
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-neutral-900/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-neutral-200 truncate">
                        {media.filename}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {formatFileSize(media.size)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MediaPicker;
