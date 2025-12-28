/**
 * FilterBar Component
 *
 * Search and filter controls for content lists.
 * Includes search input, status filter, and sort options.
 */
import { useState, useCallback } from 'react';
import { Search, Filter, ArrowUpDown, X } from 'lucide-react';
import type { ContentStatus } from '@marcomarchione/shared';
import { CONTENT_STATUSES } from '@marcomarchione/shared';

export type SortField = 'title' | 'createdAt' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

interface FilterBarProps {
  /** Current search term */
  search: string;
  /** Callback when search changes */
  onSearchChange: (value: string) => void;
  /** Current status filter */
  status?: ContentStatus;
  /** Callback when status filter changes */
  onStatusChange: (status: ContentStatus | undefined) => void;
  /** Current sort field */
  sortBy: SortField;
  /** Callback when sort field changes */
  onSortByChange: (field: SortField) => void;
  /** Current sort order */
  sortOrder: SortOrder;
  /** Callback when sort order changes */
  onSortOrderChange: (order: SortOrder) => void;
}

const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
};

const SORT_LABELS: Record<SortField, string> = {
  title: 'Title',
  createdAt: 'Created',
  updatedAt: 'Updated',
};

/**
 * Filter bar with search, status filter, and sort controls.
 */
export function FilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: FilterBarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleClearSearch = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  const toggleSortOrder = useCallback(() => {
    onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
  }, [sortOrder, onSortOrderChange]);

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search input */}
      <div className="relative flex-1">
        <Search
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
            isSearchFocused ? 'text-primary-400' : 'text-neutral-500'
          }`}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          placeholder="Search by title..."
          className="w-full pl-10 pr-10 py-2.5 bg-neutral-800/50 border border-white/10 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-neutral-500 hover:text-neutral-300 hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Status filter */}
      <div className="relative">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <select
          value={status ?? ''}
          onChange={(e) =>
            onStatusChange(e.target.value ? (e.target.value as ContentStatus) : undefined)
          }
          className="appearance-none pl-10 pr-8 py-2.5 bg-neutral-800/50 border border-white/10 rounded-lg text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all cursor-pointer"
        >
          <option value="">All statuses</option>
          {CONTENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as SortField)}
          className="appearance-none px-4 py-2.5 bg-neutral-800/50 border border-white/10 rounded-lg text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all cursor-pointer"
        >
          {Object.entries(SORT_LABELS).map(([field, label]) => (
            <option key={field} value={field}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={toggleSortOrder}
          className="p-2.5 bg-neutral-800/50 border border-white/10 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-white/10 transition-colors"
          title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        >
          <ArrowUpDown className={`w-4 h-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
}

export default FilterBar;
