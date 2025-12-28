/**
 * StatusBadge Component
 *
 * Displays content status with color-coded badges.
 * Supports draft (amber), published (green), and archived (gray) statuses.
 */
import type { ContentStatus } from '@marcomarchione/shared';

interface StatusBadgeProps {
  status: ContentStatus;
}

const STATUS_CONFIG: Record<ContentStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  published: {
    label: 'Published',
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  archived: {
    label: 'Archived',
    className: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
  },
};

/**
 * Displays a color-coded status badge.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
        border ${config.className}
      `}
    >
      {config.label}
    </span>
  );
}

export default StatusBadge;
