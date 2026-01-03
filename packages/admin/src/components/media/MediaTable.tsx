/**
 * MediaTable Component
 *
 * Professional table view for media items matching the content table design.
 * Displays thumbnail, filename, type, size, dimensions, and creation date.
 */
import { File, Image as ImageIcon, FileText, Eye, Trash2, Check } from 'lucide-react';
import type { MediaItem } from '@/types/media';

interface MediaTableProps {
  /** Array of media items to display */
  items: MediaItem[];
  /** Callback when an item is clicked for preview */
  onItemClick: (item: MediaItem) => void;
  /** Set of selected item IDs */
  selectedIds: Set<number>;
  /** Callback when selection changes */
  onSelectionChange: (ids: Set<number>) => void;
  /** Callback for delete action */
  onDelete?: (id: number) => void;
  /** Whether this is trash view */
  isTrashView?: boolean;
}

/**
 * Gets the thumbnail URL for a media item.
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
 * Formats date for display.
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Gets a friendly file type name.
 */
function getFileType(mimeType: string): { label: string; color: string } {
  if (mimeType.startsWith('image/svg')) {
    return { label: 'SVG', color: 'text-purple-400' };
  }
  if (mimeType.startsWith('image/')) {
    return { label: 'Image', color: 'text-blue-400' };
  }
  if (mimeType === 'application/pdf') {
    return { label: 'PDF', color: 'text-red-400' };
  }
  return { label: 'File', color: 'text-neutral-400' };
}

/**
 * Gets the appropriate icon for a file type.
 */
function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) {
    return <ImageIcon className="w-4 h-4" />;
  }
  if (mimeType === 'application/pdf') {
    return <FileText className="w-4 h-4" />;
  }
  return <File className="w-4 h-4" />;
}

/**
 * Media table component with professional styling.
 */
export function MediaTable({
  items,
  onItemClick,
  selectedIds,
  onSelectionChange,
  onDelete,
  isTrashView = false,
}: MediaTableProps) {
  const handleSelectAll = () => {
    if (selectedIds.size === items.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(items.map((item) => item.id)));
    }
  };

  const handleSelectItem = (id: number) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    onSelectionChange(newSelection);
  };

  if (items.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <ImageIcon className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
        <p className="text-neutral-400">
          {isTrashView ? 'Trash is empty' : 'No media files found'}
        </p>
      </div>
    );
  }

  const allSelected = selectedIds.size === items.length;

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-4 text-left w-12">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                    ${allSelected
                      ? 'bg-primary-500 border-primary-500'
                      : 'border-neutral-600 hover:border-neutral-400'
                    }
                  `}
                  aria-label="Select all"
                >
                  {allSelected && <Check className="w-3 h-3 text-white" />}
                </button>
              </th>
              <th className="px-4 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Preview
              </th>
              <th className="px-4 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Filename
              </th>
              <th className="px-4 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Size
              </th>
              <th className="px-4 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Dimensions
              </th>
              <th className="px-4 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 py-4 text-right text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((item) => {
              const thumbnailUrl = getThumbnailUrl(item);
              const isSelected = selectedIds.has(item.id);
              const fileType = getFileType(item.mimeType);

              return (
                <tr
                  key={item.id}
                  className={`
                    transition-colors cursor-pointer
                    ${isSelected ? 'bg-primary-500/10' : 'hover:bg-white/5'}
                  `}
                  onClick={() => onItemClick(item)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleSelectItem(item.id)}
                      className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                        ${isSelected
                          ? 'bg-primary-500 border-primary-500'
                          : 'border-neutral-600 hover:border-neutral-400'
                        }
                      `}
                      aria-label={`Select ${item.filename}`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-800/50 flex items-center justify-center border border-white/10">
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt={item.altText || item.filename}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="text-neutral-500">
                          <FileTypeIcon mimeType={item.mimeType} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-100 truncate max-w-[200px]">
                        {item.filename}
                      </p>
                      {item.altText && (
                        <p className="text-xs text-neutral-500 truncate max-w-[200px]">
                          {item.altText}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${fileType.color}`}>
                      {fileType.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-neutral-400">
                      {formatFileSize(item.size)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-neutral-400">
                      {item.width && item.height
                        ? `${item.width} × ${item.height}`
                        : '—'
                      }
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-neutral-400">
                      {formatDate(item.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onItemClick(item)}
                        className="p-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-white/10 transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {onDelete && !isTrashView && (
                        <button
                          type="button"
                          onClick={() => onDelete(item.id)}
                          className="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MediaTable;
