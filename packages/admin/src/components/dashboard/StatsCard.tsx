/**
 * StatsCard Component
 *
 * Glass-card styled statistics display for dashboard.
 * Shows a metric with label and optional trend indicator.
 */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  /** Label for the statistic */
  label: string;
  /** Main value to display */
  value: number | string;
  /** Optional icon component */
  icon?: LucideIcon;
  /** Optional additional content (e.g., breakdown) */
  children?: ReactNode;
}

/**
 * Displays a statistic in a glass-card style container.
 */
export function StatsCard({ label, value, icon: Icon, children }: StatsCardProps) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-400">{label}</p>
          <p className="text-3xl font-bold text-neutral-100 mt-1">{value}</p>
        </div>
        {Icon && (
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20">
            <Icon className="w-6 h-6 text-primary-400" />
          </div>
        )}
      </div>
      {children && <div className="mt-4 pt-4 border-t border-white/10">{children}</div>}
    </div>
  );
}

export default StatsCard;
