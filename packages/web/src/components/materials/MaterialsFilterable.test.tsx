/**
 * MaterialsFilterable Component Tests
 *
 * Tests for the materials filtering React island component.
 */
import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { MaterialsFilterable } from './MaterialsFilterable';
import type { Material } from '@marcomarchione/shared';

// Mock data
const mockMaterials: Material[] = [
  {
    id: 1,
    type: 'material',
    slug: 'test-guide',
    status: 'published',
    featured: true,
    category: 'guide',
    downloadUrl: '/files/test-guide.pdf',
    fileSize: 2048000, // 2 MB
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    publishedAt: '2026-01-01T00:00:00Z',
    translation: {
      id: 1,
      contentId: 1,
      lang: 'en',
      title: 'Test Guide',
      description: 'A test guide for developers',
      body: 'Guide content here',
      metaTitle: null,
      metaDescription: null,
    },
  },
  {
    id: 2,
    type: 'material',
    slug: 'test-template',
    status: 'published',
    featured: false,
    category: 'template',
    downloadUrl: '/files/test-template.zip',
    fileSize: 1024000, // 1 MB
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
    publishedAt: '2026-01-02T00:00:00Z',
    translation: {
      id: 2,
      contentId: 2,
      lang: 'en',
      title: 'Test Template',
      description: 'A test template for projects',
      body: 'Template content here',
      metaTitle: null,
      metaDescription: null,
    },
  },
];

const mockPagination = {
  total: 2,
  offset: 0,
  limit: 9,
  hasMore: false,
};

const mockLabels = {
  filterByCategory: 'Filter by Category',
  search: 'Search',
  searchPlaceholder: 'Search materials...',
  sortBy: 'Sort by',
  all: 'All',
  categoryGuide: 'Guide',
  categoryTemplate: 'Template',
  categoryResource: 'Resource',
  categoryTool: 'Tool',
  sortNewest: 'Newest',
  sortOldest: 'Oldest',
  sortTitle: 'Title (A-Z)',
  featured: 'Featured',
  noResults: 'No materials found',
  previous: 'Previous',
  next: 'Next',
  page: 'Page',
  of: 'of',
};

describe('MaterialsFilterable', () => {
  let fetchMock: any;
  let pushStateMock: any;
  let scrollToMock: any;

  beforeEach(() => {
    // Mock fetch globally
    fetchMock = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockMaterials, pagination: mockPagination }),
      })
    );
    global.fetch = fetchMock as any;

    // Mock window.history.pushState
    if (typeof window !== 'undefined') {
      pushStateMock = mock(() => {});
      (window as any).history.pushState = pushStateMock;

      // Mock window.scrollTo
      scrollToMock = mock(() => {});
      (window as any).scrollTo = scrollToMock;
    }
  });

  test('renders initial materials from props', () => {
    render(
      <MaterialsFilterable
        lang="en"
        initialMaterials={mockMaterials}
        initialPagination={mockPagination}
        initialCategory=""
        initialSearch=""
        initialSort="newest"
        initialPage={1}
        labels={mockLabels}
        apiBaseUrl="http://localhost:3000/api/v1"
      />
    );

    expect(screen.getByText('Test Guide')).toBeDefined();
    expect(screen.getByText('Test Template')).toBeDefined();
    expect(screen.getByText('A test guide for developers')).toBeDefined();

    cleanup();
  });

  test('category filter change fetches new data', async () => {
    render(
      <MaterialsFilterable
        lang="en"
        initialMaterials={mockMaterials}
        initialPagination={mockPagination}
        initialCategory=""
        initialSearch=""
        initialSort="newest"
        initialPage={1}
        labels={mockLabels}
        apiBaseUrl="http://localhost:3000/api/v1"
      />
    );

    // Click the "Guide" category filter
    const guideButton = screen.getByText('Guide');
    fireEvent.click(guideButton);

    // Wait for fetch to be called
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    // Check that URL was updated
    if (typeof window !== 'undefined') {
      expect(pushStateMock).toHaveBeenCalled();
    }

    cleanup();
  });

  test('search input triggers API call with search parameter', async () => {
    render(
      <MaterialsFilterable
        lang="en"
        initialMaterials={mockMaterials}
        initialPagination={mockPagination}
        initialCategory=""
        initialSearch=""
        initialSort="newest"
        initialPage={1}
        labels={mockLabels}
        apiBaseUrl="http://localhost:3000/api/v1"
      />
    );

    // Find search input and type
    const searchInput = screen.getByPlaceholderText('Search materials...') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'test query' } });

    // Wait for debounced API call
    await waitFor(
      () => {
        expect(fetchMock).toHaveBeenCalled();
        const fetchCalls = fetchMock.mock.calls;
        const lastCall = fetchCalls[fetchCalls.length - 1];
        expect(lastCall[0]).toContain('search=test+query');
      },
      { timeout: 500 }
    );

    cleanup();
  });

  test('sort dropdown changes sorting', async () => {
    render(
      <MaterialsFilterable
        lang="en"
        initialMaterials={mockMaterials}
        initialPagination={mockPagination}
        initialCategory=""
        initialSearch=""
        initialSort="newest"
        initialPage={1}
        labels={mockLabels}
        apiBaseUrl="http://localhost:3000/api/v1"
      />
    );

    // Click the sort dropdown button
    const sortButton = screen.getByText('Newest');
    fireEvent.click(sortButton);

    // Click "Title (A-Z)" option
    const titleOption = screen.getByText('Title (A-Z)');
    fireEvent.click(titleOption);

    // Wait for fetch to be called with sortBy parameter
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      const fetchCalls = fetchMock.mock.calls;
      const lastCall = fetchCalls[fetchCalls.length - 1];
      expect(lastCall[0]).toContain('sortBy=title');
    });

    cleanup();
  });

  test('pagination updates page and scrolls to top', async () => {
    const paginationWithMore = {
      total: 20,
      offset: 0,
      limit: 9,
      hasMore: true,
    };

    render(
      <MaterialsFilterable
        lang="en"
        initialMaterials={mockMaterials}
        initialPagination={paginationWithMore}
        initialCategory=""
        initialSearch=""
        initialSort="newest"
        initialPage={1}
        labels={mockLabels}
        apiBaseUrl="http://localhost:3000/api/v1"
      />
    );

    // Click the "Next" button
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    // Wait for API call
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    // Check that scrollTo was called
    if (typeof window !== 'undefined') {
      expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    }

    cleanup();
  });

  test('URL updates reflect filter state', async () => {
    render(
      <MaterialsFilterable
        lang="en"
        initialMaterials={mockMaterials}
        initialPagination={mockPagination}
        initialCategory=""
        initialSearch=""
        initialSort="newest"
        initialPage={1}
        labels={mockLabels}
        apiBaseUrl="http://localhost:3000/api/v1"
      />
    );

    // Click the "Template" category filter
    const templateButton = screen.getByText('Template');
    fireEvent.click(templateButton);

    // Wait for URL update
    await waitFor(() => {
      if (typeof window !== 'undefined') {
        expect(pushStateMock).toHaveBeenCalled();
        const pushStateCalls = pushStateMock.mock.calls;
        const lastCall = pushStateCalls[pushStateCalls.length - 1];
        expect(lastCall[2]).toContain('category=template');
      }
    });

    cleanup();
  });
});
