/**
 * ProjectFilters Component
 *
 * React island component for project filtering (status and sort).
 * Uses custom dropdown components matching the site design.
 */
import { FilterDropdown, type FilterOption } from '../ui/FilterDropdown';

export interface ProjectFiltersProps {
  /** Current status filter value */
  currentStatus: string;
  /** Current sort value */
  currentSort: string;
  /** Base URL path for building filter URLs */
  basePath: string;
  /** Translation labels */
  labels: {
    filterByStatus: string;
    sortBy: string;
    statusAll: string;
    statusInProgress: string;
    statusCompleted: string;
    statusArchived: string;
    sortNewest: string;
    sortOldest: string;
    sortTitle: string;
  };
}

export function ProjectFilters({
  currentStatus,
  currentSort,
  basePath,
  labels,
}: ProjectFiltersProps) {
  const statusOptions: FilterOption[] = [
    { value: '', label: labels.statusAll },
    { value: 'in-progress', label: labels.statusInProgress },
    { value: 'completed', label: labels.statusCompleted },
    { value: 'archived', label: labels.statusArchived },
  ];

  const sortOptions: FilterOption[] = [
    { value: 'newest', label: labels.sortNewest },
    { value: 'oldest', label: labels.sortOldest },
    { value: 'title', label: labels.sortTitle },
  ];

  const buildUrl = (params: Record<string, string | null>): string => {
    const url = new URL(window.location.href);

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === '') {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });

    // Reset to page 1 when filters change
    url.searchParams.delete('page');

    return url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '');
  };

  const handleStatusChange = (value: string) => {
    const newUrl = buildUrl({ status: value || null });
    window.location.href = newUrl;
  };

  const handleSortChange = (value: string) => {
    const newUrl = buildUrl({ sortBy: value === 'newest' ? null : value });
    window.location.href = newUrl;
  };

  return (
    <div className="flex flex-wrap gap-4">
      <FilterDropdown
        label={labels.filterByStatus}
        options={statusOptions}
        value={currentStatus}
        onChange={handleStatusChange}
        ariaLabel={labels.filterByStatus}
      />
      <FilterDropdown
        label={labels.sortBy}
        options={sortOptions}
        value={currentSort}
        onChange={handleSortChange}
        ariaLabel={labels.sortBy}
      />
    </div>
  );
}

export default ProjectFilters;
