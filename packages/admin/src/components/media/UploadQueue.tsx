/**
 * Upload Queue Component
 *
 * Displays the list of files being uploaded with progress indicators.
 */
import { X, Check, AlertCircle, Loader2, File } from 'lucide-react';
import type { UploadQueueItem } from '@/types/media';

interface UploadQueueProps {
  /** Items in the upload queue */
  items: UploadQueueItem[];
  /** Callback to remove an item from queue */
  onRemove: (id: string) => void;
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
 * Upload queue component.
 */
export function UploadQueue({ items, onRemove }: UploadQueueProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="glass-card rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-medium text-neutral-200">
        Upload Queue ({items.length})
      </h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-neutral-800/50"
          >
            {/* File icon */}
            <File className="w-5 h-5 text-neutral-400 flex-shrink-0" />

            {/* File info and progress */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-neutral-200 truncate">
                  {item.file.name}
                </p>
                <span className="text-xs text-neutral-400 ml-2 flex-shrink-0">
                  {formatFileSize(item.file.size)}
                </span>
              </div>

              {/* Progress bar */}
              {(item.status === 'pending' || item.status === 'uploading') && (
                <div className="h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-200"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}

              {/* Error message */}
              {item.status === 'error' && item.error && (
                <p className="text-xs text-red-400 mt-1">{item.error}</p>
              )}
            </div>

            {/* Status indicator */}
            <div className="flex-shrink-0">
              {item.status === 'pending' && (
                <span className="text-xs text-neutral-400">Waiting...</span>
              )}
              {item.status === 'uploading' && (
                <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
              )}
              {item.status === 'complete' && (
                <Check className="w-5 h-5 text-green-500" />
              )}
              {item.status === 'error' && (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
            </div>

            {/* Remove button (only for completed/errored) */}
            {(item.status === 'complete' || item.status === 'error') && (
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-100 hover:bg-white/10 transition-colors"
                aria-label={`Remove ${item.file.name} from queue`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default UploadQueue;
