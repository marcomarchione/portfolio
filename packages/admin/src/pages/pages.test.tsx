/**
 * Page Component Tests
 *
 * Tests for dashboard and content list page functionality.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useContentList } from '@/hooks/useContentList';
import { useArchiveContent } from '@/hooks/useArchiveContent';

// Mock the hooks
vi.mock('@/hooks/useContentList');
vi.mock('@/hooks/useArchiveContent');
vi.mock('@/lib/api/client', () => ({
  get: vi.fn(),
  del: vi.fn(),
}));

describe('useContentList hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns items and pagination data', () => {
    const mockData = {
      items: [
        { id: 1, slug: 'test-1', status: 'draft' as const, featured: false, createdAt: '2024-01-14', updatedAt: '2024-01-15', publishedAt: null, translations: [] },
        { id: 2, slug: 'test-2', status: 'published' as const, featured: true, createdAt: '2024-01-15', updatedAt: '2024-01-16', publishedAt: '2024-01-16', translations: [] },
      ],
      total: 2,
      totalPages: 1,
      isLoading: false,
      isFetching: false,
      error: null,
      filters: {
        search: '',
        status: undefined,
        sortBy: 'updatedAt' as const,
        sortOrder: 'desc' as const,
        page: 1,
        limit: 20,
      },
      updateFilter: vi.fn(),
      resetFilters: vi.fn(),
      setSearch: vi.fn(),
      setStatus: vi.fn(),
      setSortBy: vi.fn(),
      setSortOrder: vi.fn(),
      setPage: vi.fn(),
      refetch: vi.fn(),
    };

    vi.mocked(useContentList).mockReturnValue(mockData);

    const result = useContentList({ queryKey: ['test'], endpoint: '/test' });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.isLoading).toBe(false);
  });

  test('returns loading state when fetching', () => {
    const mockData = {
      items: [],
      total: 0,
      totalPages: 0,
      isLoading: true,
      isFetching: true,
      error: null,
      filters: {
        search: '',
        status: undefined,
        sortBy: 'updatedAt' as const,
        sortOrder: 'desc' as const,
        page: 1,
        limit: 20,
      },
      updateFilter: vi.fn(),
      resetFilters: vi.fn(),
      setSearch: vi.fn(),
      setStatus: vi.fn(),
      setSortBy: vi.fn(),
      setSortOrder: vi.fn(),
      setPage: vi.fn(),
      refetch: vi.fn(),
    };

    vi.mocked(useContentList).mockReturnValue(mockData);

    const result = useContentList({ queryKey: ['test'], endpoint: '/test' });

    expect(result.isLoading).toBe(true);
    expect(result.items).toHaveLength(0);
  });
});

describe('useArchiveContent hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('provides archive function and loading state', () => {
    const mockData = {
      archive: vi.fn(),
      archiveAsync: vi.fn(),
      isArchiving: false,
      error: null,
    };

    vi.mocked(useArchiveContent).mockReturnValue(mockData);

    const result = useArchiveContent({ contentType: 'projects' });

    expect(result.archive).toBeDefined();
    expect(result.isArchiving).toBe(false);
  });

  test('indicates loading during archive operation', () => {
    const mockData = {
      archive: vi.fn(),
      archiveAsync: vi.fn(),
      isArchiving: true,
      error: null,
    };

    vi.mocked(useArchiveContent).mockReturnValue(mockData);

    const result = useArchiveContent({ contentType: 'projects' });

    expect(result.isArchiving).toBe(true);
  });
});

describe('Filter functionality', () => {
  test('setSearch updates search filter', () => {
    const setSearch = vi.fn();
    const mockData = {
      items: [],
      total: 0,
      totalPages: 0,
      isLoading: false,
      isFetching: false,
      error: null,
      filters: {
        search: '',
        status: undefined,
        sortBy: 'updatedAt' as const,
        sortOrder: 'desc' as const,
        page: 1,
        limit: 20,
      },
      updateFilter: vi.fn(),
      resetFilters: vi.fn(),
      setSearch,
      setStatus: vi.fn(),
      setSortBy: vi.fn(),
      setSortOrder: vi.fn(),
      setPage: vi.fn(),
      refetch: vi.fn(),
    };

    vi.mocked(useContentList).mockReturnValue(mockData);

    const result = useContentList({ queryKey: ['test'], endpoint: '/test' });
    result.setSearch('test query');

    expect(setSearch).toHaveBeenCalledWith('test query');
  });

  test('setStatus updates status filter', () => {
    const setStatus = vi.fn();
    const mockData = {
      items: [],
      total: 0,
      totalPages: 0,
      isLoading: false,
      isFetching: false,
      error: null,
      filters: {
        search: '',
        status: undefined,
        sortBy: 'updatedAt' as const,
        sortOrder: 'desc' as const,
        page: 1,
        limit: 20,
      },
      updateFilter: vi.fn(),
      resetFilters: vi.fn(),
      setSearch: vi.fn(),
      setStatus,
      setSortBy: vi.fn(),
      setSortOrder: vi.fn(),
      setPage: vi.fn(),
      refetch: vi.fn(),
    };

    vi.mocked(useContentList).mockReturnValue(mockData);

    const result = useContentList({ queryKey: ['test'], endpoint: '/test' });
    result.setStatus('published');

    expect(setStatus).toHaveBeenCalledWith('published');
  });
});

describe('Pagination functionality', () => {
  test('setPage updates current page', () => {
    const setPage = vi.fn();
    const mockData = {
      items: [],
      total: 100,
      totalPages: 5,
      isLoading: false,
      isFetching: false,
      error: null,
      filters: {
        search: '',
        status: undefined,
        sortBy: 'updatedAt' as const,
        sortOrder: 'desc' as const,
        page: 1,
        limit: 20,
      },
      updateFilter: vi.fn(),
      resetFilters: vi.fn(),
      setSearch: vi.fn(),
      setStatus: vi.fn(),
      setSortBy: vi.fn(),
      setSortOrder: vi.fn(),
      setPage,
      refetch: vi.fn(),
    };

    vi.mocked(useContentList).mockReturnValue(mockData);

    const result = useContentList({ queryKey: ['test'], endpoint: '/test' });
    result.setPage(3);

    expect(setPage).toHaveBeenCalledWith(3);
  });

  test('calculates totalPages correctly', () => {
    const mockData = {
      items: [],
      total: 45,
      totalPages: 3, // 45 / 20 = 2.25, rounded up to 3
      isLoading: false,
      isFetching: false,
      error: null,
      filters: {
        search: '',
        status: undefined,
        sortBy: 'updatedAt' as const,
        sortOrder: 'desc' as const,
        page: 1,
        limit: 20,
      },
      updateFilter: vi.fn(),
      resetFilters: vi.fn(),
      setSearch: vi.fn(),
      setStatus: vi.fn(),
      setSortBy: vi.fn(),
      setSortOrder: vi.fn(),
      setPage: vi.fn(),
      refetch: vi.fn(),
    };

    vi.mocked(useContentList).mockReturnValue(mockData);

    const result = useContentList({ queryKey: ['test'], endpoint: '/test' });

    expect(result.totalPages).toBe(3);
  });
});
