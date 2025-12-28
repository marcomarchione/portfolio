/**
 * useMediaLibrary Hook
 *
 * State management for the media library including pagination, filtering,
 * and URL search parameter synchronization.
 */
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';
import { mediaKeys } from '@/lib/query/keys';
import { getApiMimeType } from '@/components/media/MimeTypeFilter';
import type { PaginatedResponse } from '@/types/api';
import type { MediaItem, MimeTypeFilterValue, MediaViewMode } from '@/types/media';

/** Items per page */
const PAGE_LIMIT = 20;

/**
 * Builds the media API endpoint with query parameters.
 */
function buildMediaEndpoint(
  viewMode: MediaViewMode,
  page: number,
  mimeType: string | undefined
): string {
  const params = new URLSearchParams();
  params.set('limit', PAGE_LIMIT.toString());
  params.set('offset', ((page - 1) * PAGE_LIMIT).toString());

  if (mimeType) {
    params.set('mimeType', mimeType);
  }

  const baseEndpoint = viewMode === 'trash' ? '/admin/media/trash' : '/admin/media';
  return `${baseEndpoint}?${params.toString()}`;
}

/**
 * Hook for managing media library state.
 */
export function useMediaLibrary() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract state from URL params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const mimeFilter = (searchParams.get('filter') || 'all') as MimeTypeFilterValue;
  const viewMode = (searchParams.get('view') || 'library') as MediaViewMode;

  // Convert filter to API format
  const apiMimeType = getApiMimeType(mimeFilter);

  // Query key includes all filter parameters
  const queryFilters = useMemo(
    () => ({
      page,
      mimeType: apiMimeType,
      viewMode,
    }),
    [page, apiMimeType, viewMode]
  );

  // Use appropriate query key based on view mode
  const queryKey = useMemo(
    () =>
      viewMode === 'trash'
        ? mediaKeys.trashList(queryFilters)
        : mediaKeys.list(queryFilters),
    [viewMode, queryFilters]
  );

  // Fetch media data
  const {
    data: response,
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey,
    queryFn: () =>
      get<PaginatedResponse<MediaItem>>(
        buildMediaEndpoint(viewMode, page, apiMimeType)
      ),
  });

  // Calculate total pages
  const totalPages = useMemo(() => {
    if (!response?.pagination) return 1;
    return Math.ceil(response.pagination.total / PAGE_LIMIT);
  }, [response?.pagination]);

  // Update URL params helper
  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, value]) => {
          if (value === undefined || value === '' ||
              (key === 'page' && value === '1') ||
              (key === 'filter' && value === 'all') ||
              (key === 'view' && value === 'library')) {
            newParams.delete(key);
          } else {
            newParams.set(key, value);
          }
        });
        return newParams;
      });
    },
    [setSearchParams]
  );

  // Page change handler
  const setPage = useCallback(
    (newPage: number) => {
      updateParams({ page: newPage.toString() });
    },
    [updateParams]
  );

  // Filter change handler
  const setMimeFilter = useCallback(
    (filter: MimeTypeFilterValue) => {
      updateParams({ filter, page: '1' }); // Reset to page 1 on filter change
    },
    [updateParams]
  );

  // View mode change handler
  const setViewMode = useCallback(
    (mode: MediaViewMode) => {
      updateParams({ view: mode, page: '1' }); // Reset to page 1 on view change
    },
    [updateParams]
  );

  return {
    // Data
    items: response?.data ?? [],
    total: response?.pagination?.total ?? 0,
    totalPages,

    // State
    page,
    mimeFilter,
    viewMode,

    // Loading states
    isLoading,
    isFetching,
    error,

    // Actions
    setPage,
    setMimeFilter,
    setViewMode,
  };
}

export default useMediaLibrary;
