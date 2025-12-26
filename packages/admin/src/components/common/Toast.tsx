/**
 * Toast Notification Component
 *
 * Configures react-hot-toast with custom styling to match admin design system.
 * Provides helper functions for showing success and error notifications.
 */
import { Toaster, toast as hotToast } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ApiError } from '@/lib/api/client';

/**
 * Toast provider component.
 * Add this to the app root to enable toast notifications.
 */
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      containerClassName=""
      containerStyle={{
        top: 80, // Below header
      }}
      toastOptions={{
        // Default options for all toasts
        duration: 4000,
        style: {
          background: 'rgba(23, 23, 23, 0.95)',
          color: '#e5e5e5',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '0.75rem',
          padding: '12px 16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(12px)',
          fontSize: '0.875rem',
          maxWidth: '400px',
        },
        // Success toast styling
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#22c55e',
            secondary: '#ffffff',
          },
        },
        // Error toast styling
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
        },
      }}
    />
  );
}

/**
 * Shows a success toast notification.
 */
export function showSuccess(message: string) {
  hotToast.custom(
    (t) => (
      <div
        className={`
          flex items-start gap-3 px-4 py-3 rounded-xl
          bg-neutral-900/95 backdrop-blur-xl border border-white/10
          shadow-xl transition-all duration-200
          ${t.visible ? 'animate-enter' : 'animate-leave'}
        `}
      >
        <span className="flex-shrink-0 mt-0.5">
          <CheckCircle className="w-5 h-5 text-green-400" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-100">{message}</p>
        </div>
      </div>
    ),
    { duration: 3000 }
  );
}

/**
 * Shows an error toast notification.
 */
export function showError(message: string, details?: string) {
  hotToast.custom(
    (t) => (
      <div
        className={`
          flex items-start gap-3 px-4 py-3 rounded-xl
          bg-neutral-900/95 backdrop-blur-xl border border-red-500/30
          shadow-xl transition-all duration-200
          ${t.visible ? 'animate-enter' : 'animate-leave'}
        `}
      >
        <span className="flex-shrink-0 mt-0.5">
          <XCircle className="w-5 h-5 text-red-400" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-100">{message}</p>
          {details && (
            <p className="text-xs text-neutral-400 mt-1">{details}</p>
          )}
        </div>
      </div>
    ),
    { duration: 5000 }
  );
}

/**
 * Shows a warning toast notification.
 */
export function showWarning(message: string) {
  hotToast.custom(
    (t) => (
      <div
        className={`
          flex items-start gap-3 px-4 py-3 rounded-xl
          bg-neutral-900/95 backdrop-blur-xl border border-amber-500/30
          shadow-xl transition-all duration-200
          ${t.visible ? 'animate-enter' : 'animate-leave'}
        `}
      >
        <span className="flex-shrink-0 mt-0.5">
          <AlertCircle className="w-5 h-5 text-amber-400" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-100">{message}</p>
        </div>
      </div>
    ),
    { duration: 4000 }
  );
}

/**
 * Shows an error toast from an API error.
 * Extracts the error message and details from the ApiError.
 */
export function showApiError(error: unknown) {
  if (error instanceof ApiError) {
    showError(error.message, error.errorCode !== error.message ? error.errorCode : undefined);
  } else if (error instanceof Error) {
    showError(error.message);
  } else {
    showError('An unexpected error occurred');
  }
}

/**
 * Dismiss all toasts.
 */
export function dismissAllToasts() {
  hotToast.dismiss();
}

// Re-export the raw toast function for advanced usage
export { hotToast as toast };
