/**
 * Upload Queue Component
 *
 * Floating upload progress panel with auto-hide behavior.
 * Shows only when there are pending/uploading/error items.
 * Can be manually dismissed by the user.
 */
import { useState, useEffect, useMemo } from 'react';
import { X, Check, AlertCircle, Loader2, Upload, ChevronUp, ChevronDown } from 'lucide-react';
import type { UploadQueueItem } from '@/types/media';

interface UploadQueueProps {
  /** Items in the upload queue */
  items: UploadQueueItem[];
  /** Callback to remove an item from queue */
  onRemove: (id: string) => void;
  /** Callback to clear all completed items */
  onClearCompleted?: () => void;
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
 * Upload queue component with smart visibility.
 */
export function UploadQueue({ items, onRemove, onClearCompleted }: UploadQueueProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Calculate stats
  const stats = useMemo(() => {
    const pending = items.filter((i) => i.status === 'pending').length;
    const uploading = items.filter((i) => i.status === 'uploading').length;
    const complete = items.filter((i) => i.status === 'complete').length;
    const error = items.filter((i) => i.status === 'error').length;
    const active = pending + uploading;
    const hasIssues = error > 0;
    const allDone = items.length > 0 && active === 0;

    return { pending, uploading, complete, error, active, hasIssues, allDone };
  }, [items]);

  // Reset dismissed state when new uploads start
  useEffect(() => {
    if (stats.active > 0) {
      setIsDismissed(false);
    }
  }, [stats.active]);

  // Auto-dismiss after all complete (with delay for user to see success)
  useEffect(() => {
    if (stats.allDone && !stats.hasIssues) {
      const timer = setTimeout(() => {
        setIsDismissed(true);
        onClearCompleted?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [stats.allDone, stats.hasIssues, onClearCompleted]);

  // Don't render if no items or dismissed (unless there are errors)
  if (items.length === 0 || (isDismissed && !stats.hasIssues)) {
    return null;
  }

  // Calculate overall progress
  const overallProgress = items.length > 0
    ? Math.round(items.reduce((acc, item) => acc + (item.status === 'complete' ? 100 : item.progress), 0) / items.length)
    : 0;

  return (
    <div className="fixed bottom-6 right-6 z-40 w-96 max-w-[calc(100vw-3rem)]">
      <div className="glass-card rounded-xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-800/50 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stats.hasIssues ? 'bg-red-500/20' : stats.allDone ? 'bg-green-500/20' : 'bg-primary-500/20'}`}>
              {stats.active > 0 ? (
                <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />
              ) : stats.hasIssues ? (
                <AlertCircle className="w-4 h-4 text-red-400" />
              ) : (
                <Check className="w-4 h-4 text-green-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-100">
                {stats.active > 0
                  ? `Uploading ${stats.active} file${stats.active !== 1 ? 's' : ''}...`
                  : stats.hasIssues
                    ? `${stats.error} upload${stats.error !== 1 ? 's' : ''} failed`
                    : 'Upload complete'
                }
              </p>
              {stats.active > 0 && (
                <p className="text-xs text-neutral-400">{overallProgress}% complete</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-white/10 transition-colors"
              aria-label={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsDismissed(true);
                onClearCompleted?.();
              }}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-white/10 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Overall progress bar */}
        {stats.active > 0 && (
          <div className="h-1 bg-neutral-800">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        )}

        {/* Items list (collapsible) */}
        {!isCollapsed && (
          <div className="max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className={`
                  flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-b-0
                  ${item.status === 'error' ? 'bg-red-500/5' : ''}
                `}
              >
                {/* Status icon */}
                <div className="flex-shrink-0">
                  {item.status === 'pending' && (
                    <div className="w-8 h-8 rounded-lg bg-neutral-700/50 flex items-center justify-center">
                      <Upload className="w-4 h-4 text-neutral-400" />
                    </div>
                  )}
                  {item.status === 'uploading' && (
                    <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />
                    </div>
                  )}
                  {item.status === 'complete' && (
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                  )}
                  {item.status === 'error' && (
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    </div>
                  )}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-200 truncate">{item.file.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">
                      {formatFileSize(item.file.size)}
                    </span>
                    {item.status === 'uploading' && (
                      <span className="text-xs text-primary-400">{item.progress}%</span>
                    )}
                    {item.status === 'error' && item.error && (
                      <span className="text-xs text-red-400 truncate">{item.error}</span>
                    )}
                  </div>
                </div>

                {/* Remove button (for complete/error) */}
                {(item.status === 'complete' || item.status === 'error') && (
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="flex-shrink-0 p-1 rounded text-neutral-500 hover:text-neutral-300 hover:bg-white/10 transition-colors"
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer with stats */}
        {!isCollapsed && items.length > 3 && (
          <div className="px-4 py-2 bg-neutral-800/30 border-t border-white/5">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>
                {stats.complete} complete
                {stats.error > 0 && <span className="text-red-400"> · {stats.error} failed</span>}
              </span>
              {(stats.complete > 0 || stats.error > 0) && stats.active === 0 && (
                <button
                  type="button"
                  onClick={onClearCompleted}
                  className="text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadQueue;
