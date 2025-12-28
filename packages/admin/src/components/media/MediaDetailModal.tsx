/**
 * Media Detail Modal Component
 *
 * Modal showing full media details including preview, metadata, variants, and alt text editing.
 */
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Loader2, RotateCcw, Trash2 } from 'lucide-react';
import { get } from '@/lib/api/client';
import { mediaKeys } from '@/lib/query/keys';
import { MetadataPanel } from './MetadataPanel';
import { VariantsPanel } from './VariantsPanel';
import { AltTextEditor } from './AltTextEditor';
import type { MediaItem } from '@/types/media';
import type { ApiResponse } from '@/types/api';

interface MediaDetailModalProps {
  /** Media ID to display */
  mediaId: number | null;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal closes */
  onClose: () => void;
  /** Whether viewing trash item */
  isTrashView?: boolean;
  /** Callback for restore action */
  onRestore?: (id: number) => void;
  /** Callback for permanent delete action */
  onPermanentDelete?: (id: number) => void;
  /** Whether restore is in progress */
  isRestoring?: boolean;
}

/**
 * Media detail modal component.
 */
export function MediaDetailModal({
  mediaId,
  isOpen,
  onClose,
  isTrashView = false,
  onRestore,
  onPermanentDelete,
  isRestoring = false,
}: MediaDetailModalProps) {
  // Fetch media detail
  const { data: response, isLoading, error } = useQuery({
    queryKey: mediaKeys.detail(String(mediaId)),
    queryFn: () => get<ApiResponse<MediaItem>>(`/admin/media/${mediaId}`),
    enabled: isOpen && mediaId !== null,
  });

  const media = response?.data;

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const isImage = media?.mimeType.startsWith('image/');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-detail-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="glass-card relative z-10 w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2
            id="media-detail-title"
            className="text-lg font-display font-semibold text-neutral-100 truncate"
          >
            {media?.filename || 'Media Details'}
          </h2>
          <div className="flex items-center gap-2">
            {/* Trash view actions */}
            {isTrashView && media && (
              <>
                <button
                  type="button"
                  onClick={() => onRestore?.(media.id)}
                  disabled={isRestoring}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-green-400 hover:text-green-300 hover:bg-green-500/10 disabled:opacity-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restore
                </button>
                <button
                  type="button"
                  onClick={() => onPermanentDelete?.(media.id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Permanently
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-white/5 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

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
              <p className="text-red-400">Failed to load media details</p>
            </div>
          )}

          {/* Media content */}
          {media && !isLoading && (
            <div className="space-y-6">
              {/* Preview */}
              <div className="flex justify-center bg-neutral-800/30 rounded-lg p-4">
                {isImage ? (
                  <img
                    src={media.url}
                    alt={media.altText || media.filename}
                    className="max-w-full max-h-[40vh] object-contain rounded"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-16 h-16 rounded-lg bg-neutral-700/50 flex items-center justify-center mb-3">
                      <span className="text-2xl text-neutral-400">
                        {media.mimeType === 'application/pdf' ? 'PDF' : 'FILE'}
                      </span>
                    </div>
                    <p className="text-neutral-400">{media.filename}</p>
                  </div>
                )}
              </div>

              {/* Two-column layout for details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column: Metadata */}
                <div className="space-y-6">
                  <MetadataPanel media={media} />

                  {/* Alt text editor (only for images and not in trash) */}
                  {isImage && !isTrashView && (
                    <AltTextEditor mediaId={media.id} initialValue={media.altText} />
                  )}
                </div>

                {/* Right column: Variants */}
                <div>
                  <VariantsPanel media={media} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MediaDetailModal;
