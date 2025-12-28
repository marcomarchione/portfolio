/**
 * Media Grid Component
 *
 * Responsive grid layout for displaying media items with thumbnails.
 */
import { File, Check, Image as ImageIcon } from 'lucide-react';
import type { MediaItem } from '@/types/media';

interface MediaGridProps {
  /** Array of media items to display */
  items: MediaItem[];
  /** Callback when an item is clicked */
  onItemClick: (item: MediaItem) => void;
  /** Set of selected item IDs */
  selectedIds: Set<number>;
  /** Callback when selection changes */
  onSelectionChange: (ids: Set<number>) => void;
  /** Whether selection mode is enabled */
  selectionMode?: boolean;
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
 * Media grid component for displaying media items.
 */
export function MediaGrid({
  items,
  onItemClick,
  selectedIds,
  onSelectionChange,
  selectionMode = false,
}: MediaGridProps) {
  const handleItemClick = (item: MediaItem, event: React.MouseEvent) => {
    if (selectionMode) {
      event.preventDefault();
      const newSelection = new Set(selectedIds);
      if (newSelection.has(item.id)) {
        newSelection.delete(item.id);
      } else {
        newSelection.add(item.id);
      }
      onSelectionChange(newSelection);
    } else {
      onItemClick(item);
    }
  };

  const handleCheckboxClick = (item: MediaItem, event: React.MouseEvent) => {
    event.stopPropagation();
    const newSelection = new Set(selectedIds);
    if (newSelection.has(item.id)) {
      newSelection.delete(item.id);
    } else {
      newSelection.add(item.id);
    }
    onSelectionChange(newSelection);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
        <p className="text-neutral-400">
          No media files found.
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
      role="grid"
      aria-label="Media library grid"
    >
      {items.map((item) => {
        const thumbnailUrl = getThumbnailUrl(item);
        const isSelected = selectedIds.has(item.id);

        return (
          <button
            key={item.id}
            type="button"
            onClick={(e) => handleItemClick(item, e)}
            className={`
              group relative aspect-square rounded-lg overflow-hidden
              bg-neutral-800/50 border-2 transition-all duration-200
              hover:border-primary-500/50 hover:scale-105
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950
              ${isSelected ? 'border-primary-500 ring-2 ring-primary-500/50' : 'border-white/10'}
            `}
            role="gridcell"
            aria-label={`${item.filename}, ${formatFileSize(item.size)}`}
            aria-selected={isSelected}
          >
            {/* Thumbnail or icon */}
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={item.altText || item.filename}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <File className="w-12 h-12 text-neutral-500" />
              </div>
            )}

            {/* Checkbox overlay */}
            <div
              className={`
                absolute top-2 left-2 w-6 h-6 rounded border-2 flex items-center justify-center
                transition-all cursor-pointer
                ${
                  isSelected
                    ? 'bg-primary-500 border-primary-500'
                    : 'bg-neutral-900/70 border-white/30 opacity-0 group-hover:opacity-100'
                }
              `}
              onClick={(e) => handleCheckboxClick(item, e)}
              role="checkbox"
              aria-checked={isSelected}
              aria-label={`Select ${item.filename}`}
            >
              {isSelected && <Check className="w-4 h-4 text-white" />}
            </div>

            {/* Selection indicator (when selected) */}
            {isSelected && (
              <div className="absolute inset-0 bg-primary-500/10 pointer-events-none" />
            )}

            {/* Hover overlay with filename */}
            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-neutral-900/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-xs text-neutral-200 truncate">
                {item.filename}
              </p>
              <p className="text-xs text-neutral-400">
                {formatFileSize(item.size)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default MediaGrid;
