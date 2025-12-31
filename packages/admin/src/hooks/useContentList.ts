/**
 * useContentList Hook
 *
 * Generic hook for fetching and managing paginated content lists.
 * Supports search, filtering, sorting, and pagination.
 */
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '../lib/api/client';
import type { ContentStatus, Language } from '@marcomarchione/shared';
import type { SortField, SortOrder } from '../components/dashboard';

/** Filter options for content list */
export interface ContentListFilters {
  search: string;
  status?: ContentStatus;
  sortBy: SortField;
  sortOrder: SortOrder;
  page: number;
  limit: number;
}

/** Content item from API */
export interface ContentListItem {
  id: number;
  slug: string;
  status: ContentStatus;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  translations: Array<{
    lang: Language;
    title: string;
    [key: string]: unknown;
  }>;
}

/** API response with pagination */
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
    hasMore: boolean;
  };
}

interface UseContentListOptions {
  /** Query key base */
  queryKey: readonly unknown[];
  /** API endpoint path */
  endpoint: string;
  /** Default filters */
  defaultFilters?: Partial<ContentListFilters>;
}

const DEFAULT_FILTERS: ContentListFilters = {
  search: '',
  status: undefined,
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
};

/**
 * Hook for managing paginated content lists with filtering and sorting.
 */
export function useContentList<T extends ContentListItem>({
  queryKey,
  endpoint,
  defaultFilters = {},
}: UseContentListOptions) {
  const [filters, setFilters] = useState<ContentListFilters>({
    ...DEFAULT_FILTERS,
    ...defaultFilters,
  });

  // Build query parameters
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set('limit', filters.limit.toString());
    params.set('offset', ((filters.page - 1) * filters.limit).toString());

    if (filters.search) {
      params.set('search', filters.search);
    }
    if (filters.status) {
      params.set('status', filters.status);
    }
    if (filters.sortBy) {
      params.set('sortBy', filters.sortBy);
    }
    if (filters.sortOrder) {
      params.set('sortOrder', filters.sortOrder);
    }

    return params.toString();
  }, [filters]);

  // Fetch content list
  const query = useQuery({
    queryKey: [...queryKey, filters],
    queryFn: async (): Promise<PaginatedResponse<T>> => {
      const queryParams = buildQueryParams();
      const response = await get<PaginatedResponse<T>>(
        `${endpoint}?${queryParams}`
      );
      return response;
    },
  });

  // Update individual filter
  const updateFilter = useCallback(
    <K extends keyof ContentListFilters>(key: K, value: ContentListFilters[K]) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
        // Reset to page 1 when filters change (except page itself)
        ...(key !== 'page' ? { page: 1 } : {}),
      }));
    },
    []
  );

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS, ...defaultFilters });
  }, [defaultFilters]);

  // Compute pagination info
  const totalPages = Math.ceil((query.data?.pagination.total ?? 0) / filters.limit);

  return {
    // Data
    items: query.data?.data ?? [],
    total: query.data?.pagination.total ?? 0,
    totalPages,

    // Query state
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,

    // Filters
    filters,
    updateFilter,
    resetFilters,
    setSearch: (value: string) => updateFilter('search', value),
    setStatus: (value: ContentStatus | undefined) => updateFilter('status', value),
    setSortBy: (value: SortField) => updateFilter('sortBy', value),
    setSortOrder: (value: SortOrder) => updateFilter('sortOrder', value),
    setPage: (value: number) => updateFilter('page', value),

    // Refetch
    refetch: query.refetch,
  };
}

export default useContentList;
