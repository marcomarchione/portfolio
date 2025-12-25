/**
 * Page Wrapper Component
 *
 * Consistent page layout with title, actions, and content area.
 */
import type { ReactNode } from 'react';

interface PageProps {
  /** Page title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Optional action buttons (top-right) */
  actions?: ReactNode;
  /** Page content */
  children: ReactNode;
}

/**
 * Page wrapper with consistent header and layout.
 */
export function Page({ title, subtitle, actions, children }: PageProps) {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="relative flex items-center justify-center">
        {/* Centered title and subtitle */}
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-neutral-100">
            {title}
          </h1>
          {subtitle && (
            <p className="text-neutral-400 mt-1">{subtitle}</p>
          )}
        </div>

        {/* Actions positioned on the right */}
        {actions && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
}

/**
 * Coming soon placeholder content.
 */
interface ComingSoonProps {
  /** Feature description */
  description?: string;
}

export function ComingSoon({ description }: ComingSoonProps) {
  return (
    <div className="glass-card p-12 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-500/20 to-accent-500/20 mb-6">
        <span className="text-3xl">🚧</span>
      </div>
      <h2 className="text-xl font-display font-semibold text-neutral-200 mb-2">
        Coming Soon
      </h2>
      <p className="text-neutral-400 max-w-md mx-auto">
        {description || 'This feature is currently under development and will be available soon.'}
      </p>
    </div>
  );
}
