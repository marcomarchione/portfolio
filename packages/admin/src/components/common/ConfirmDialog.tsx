/**
 * Confirm Dialog Component
 *
 * Modal dialog for confirming destructive actions.
 */
import { useEffect, useRef } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Dialog title */
  title: string;
  /** Dialog message */
  message: string;
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Callback when confirmed */
  onConfirm: () => void;
  /** Callback when cancelled */
  onCancel: () => void;
  /** Dialog variant for styling */
  variant?: 'default' | 'danger';
  /** Whether action is loading */
  isLoading?: boolean;
}

/**
 * Confirmation dialog component.
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  // Focus trap and initial focus
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

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

  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm"
        onClick={isLoading ? undefined : onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="glass-card relative z-10 w-full max-w-md p-6"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-white/5 disabled:opacity-50 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon and title */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`
              flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
              ${isDanger ? 'bg-red-500/20' : 'bg-primary-500/20'}
            `}
          >
            <AlertTriangle
              className={`w-5 h-5 ${isDanger ? 'text-red-500' : 'text-primary-500'}`}
            />
          </div>
          <div className="flex-1 pt-1">
            <h2
              id="confirm-dialog-title"
              className="text-lg font-display font-semibold text-neutral-100"
            >
              {title}
            </h2>
          </div>
        </div>

        {/* Message */}
        <p className="text-neutral-400 mb-6">{message}</p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-neutral-100 hover:bg-white/10 disabled:opacity-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white
              disabled:opacity-50 transition-colors
              ${
                isDanger
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gradient-to-r from-primary-500 to-accent-500 hover:opacity-90'
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
