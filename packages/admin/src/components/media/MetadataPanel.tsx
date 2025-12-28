/**
 * Metadata Panel Component
 *
 * Displays file metadata including filename, MIME type, dimensions, size, and dates.
 */
import type { MediaItem } from '@/types/media';

interface MetadataPanelProps {
  /** Media item to display metadata for */
  media: MediaItem;
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
 * Formats date for display.
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculates days until permanent deletion (30 days from deletedAt).
 */
function getDaysUntilDeletion(deletedAtStr: string): number {
  const deletedAt = new Date(deletedAtStr);
  const deletionDate = new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diffMs = deletionDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

/**
 * Metadata panel component.
 */
export function MetadataPanel({ media }: MetadataPanelProps) {
  const isImage = media.mimeType.startsWith('image/');
  const daysUntilDeletion = media.deletedAt ? getDaysUntilDeletion(media.deletedAt) : null;

  return (
    <div className="glass-card rounded-lg p-4">
      <h3 className="text-sm font-medium text-neutral-200 mb-4">File Information</h3>
      <dl className="space-y-3">
        {/* Filename */}
        <div className="flex justify-between">
          <dt className="text-sm text-neutral-400">Filename</dt>
          <dd className="text-sm text-neutral-200 text-right max-w-[60%] truncate">
            {media.filename}
          </dd>
        </div>

        {/* MIME type */}
        <div className="flex justify-between">
          <dt className="text-sm text-neutral-400">Type</dt>
          <dd className="text-sm text-neutral-200">{media.mimeType}</dd>
        </div>

        {/* Dimensions (for images) */}
        {isImage && media.width && media.height && (
          <div className="flex justify-between">
            <dt className="text-sm text-neutral-400">Dimensions</dt>
            <dd className="text-sm text-neutral-200">
              {media.width} x {media.height} px
            </dd>
          </div>
        )}

        {/* File size */}
        <div className="flex justify-between">
          <dt className="text-sm text-neutral-400">Size</dt>
          <dd className="text-sm text-neutral-200">{formatFileSize(media.size)}</dd>
        </div>

        {/* Upload date */}
        <div className="flex justify-between">
          <dt className="text-sm text-neutral-400">Uploaded</dt>
          <dd className="text-sm text-neutral-200">{formatDate(media.createdAt)}</dd>
        </div>

        {/* Deleted date (if in trash) */}
        {media.deletedAt && (
          <>
            <div className="flex justify-between">
              <dt className="text-sm text-neutral-400">Deleted</dt>
              <dd className="text-sm text-neutral-200">{formatDate(media.deletedAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-neutral-400">Permanent deletion in</dt>
              <dd className="text-sm text-red-400">
                {daysUntilDeletion} day{daysUntilDeletion !== 1 ? 's' : ''}
              </dd>
            </div>
          </>
        )}
      </dl>
    </div>
  );
}

export default MetadataPanel;
