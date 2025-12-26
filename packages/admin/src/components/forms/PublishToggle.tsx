/**
 * Publish Status Toggle Component
 *
 * Displays current content status with visual styling and provides
 * a toggle button to change status with confirmation dialog.
 */
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Loader2, Globe, FileEdit, Archive, X, AlertTriangle } from 'lucide-react';
import type { ContentStatus } from '@marcomarchione/shared';

interface PublishToggleProps {
  /** Current content status */
  status: ContentStatus;
  /** Callback when status changes */
  onStatusChange: (newStatus: ContentStatus) => void;
  /** Loading state during API call */
  isLoading?: boolean;
}

/** Status configuration with styling and labels */
const STATUS_CONFIG: Record<
  ContentStatus,
  {
    label: string;
    badgeClass: string;
    textClass: string;
    icon: typeof Globe;
  }
> = {
  draft: {
    label: 'Draft',
    badgeClass: 'bg-neutral-500/20 border-neutral-500/30',
    textClass: 'text-neutral-400',
    icon: FileEdit,
  },
  published: {
    label: 'Published',
    badgeClass: 'bg-green-500/20 border-green-500/30',
    textClass: 'text-green-400',
    icon: Globe,
  },
  archived: {
    label: 'Archived',
    badgeClass: 'bg-red-500/20 border-red-500/30',
    textClass: 'text-red-400',
    icon: Archive,
  },
};

/**
 * Publish status toggle with confirmation dialog.
 */
export function PublishToggle({
  status,
  onStatusChange,
  isLoading = false,
}: PublishToggleProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ContentStatus | null>(null);

  const currentConfig = STATUS_CONFIG[status];
  const StatusIcon = currentConfig.icon;

  /** Determine the next status based on current status */
  function getNextStatus(): ContentStatus {
    if (status === 'draft') return 'published';
    if (status === 'published') return 'draft';
    return 'draft'; // archived -> draft
  }

  /** Get the action label for the button */
  function getActionLabel(): string {
    if (status === 'draft') return 'Publish';
    if (status === 'published') return 'Unpublish';
    return 'Restore to Draft';
  }

  /** Get the confirmation message */
  function getConfirmationMessage(): string {
    const nextStatus = pendingStatus || getNextStatus();
    if (nextStatus === 'published') {
      return 'Are you sure you want to publish this content? It will become publicly visible.';
    }
    if (nextStatus === 'draft') {
      return 'Are you sure you want to unpublish this content? It will no longer be publicly visible.';
    }
    return 'Are you sure you want to change the status of this content?';
  }

  /** Handle toggle button click */
  function handleToggleClick() {
    const nextStatus = getNextStatus();
    setPendingStatus(nextStatus);
    setIsDialogOpen(true);
  }

  /** Handle archive button click */
  function handleArchiveClick() {
    setPendingStatus('archived');
    setIsDialogOpen(true);
  }

  /** Handle confirmation */
  function handleConfirm() {
    if (pendingStatus) {
      onStatusChange(pendingStatus);
    }
    setIsDialogOpen(false);
    setPendingStatus(null);
  }

  /** Handle cancel */
  function handleCancel() {
    setIsDialogOpen(false);
    setPendingStatus(null);
  }

  return (
    <div className="flex items-center gap-4">
      {/* Current status badge */}
      <span
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${currentConfig.badgeClass}`}
      >
        <StatusIcon className={`h-4 w-4 ${currentConfig.textClass}`} />
        <span className={`text-sm font-medium ${currentConfig.textClass}`}>
          {currentConfig.label}
        </span>
      </span>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Main toggle button */}
        <button
          type="button"
          onClick={handleToggleClick}
          disabled={isLoading}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            status === 'draft'
              ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:opacity-90'
              : 'bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            getActionLabel()
          )}
        </button>

        {/* Archive button (only show for non-archived content) */}
        {status !== 'archived' && (
          <button
            type="button"
            onClick={handleArchiveClick}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Archive className="h-4 w-4" />
            Archive
          </button>
        )}
      </div>

      {/* Confirmation dialog */}
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50">
            <div className="glass-card p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                  </div>
                  <Dialog.Title className="text-lg font-display font-semibold text-neutral-100">
                    Confirm Status Change
                  </Dialog.Title>
                </div>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="p-1 text-neutral-500 hover:text-neutral-300 transition-colors"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Close>
              </div>

              {/* Message */}
              <Dialog.Description className="text-neutral-400 mb-6">
                {getConfirmationMessage()}
              </Dialog.Description>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-300 hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    pendingStatus === 'archived'
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:opacity-90'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Confirm'
                  )}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
