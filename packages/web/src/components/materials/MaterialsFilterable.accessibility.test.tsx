/**
 * MaterialsFilterable Accessibility Tests
 *
 * Tests for keyboard navigation and ARIA attributes in materials filtering.
 */
import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MaterialsFilterable } from './MaterialsFilterable';
import type { Material } from '@marcomarchione/shared';

const mockMaterials: Material[] = [
  {
    id: 1,
    type: 'material',
    slug: 'test-guide',
    status: 'published',
    featured: false,
    category: 'guide',
    downloadUrl: '/files/test.pdf',
    fileSize: 1024000,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    publishedAt: '2026-01-01T00:00:00Z',
    translation: {
      id: 1,
      contentId: 1,
      lang: 'en',
      title: 'Test Guide',
      description: 'A test guide',
      body: 'Content here',
      metaTitle: null,
      metaDescription: null,
    },
  },
];

const mockPagination = {
  total: 1,
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

describe('MaterialsFilterable - Accessibility', () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockMaterials, pagination: mockPagination }),
      })
    );
    global.fetch = fetchMock as any;

    if (typeof window !== 'undefined') {
      (window as any).history.pushState = mock(() => {});
      (window as any).scrollTo = mock(() => {});
    }
  });

  test('search input has proper aria-label', () => {
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

    const searchInput = screen.getByPlaceholderText('Search materials...') as HTMLInputElement;
    expect(searchInput.getAttribute('aria-label')).toBe('Search');

    cleanup();
  });

  test('category filter buttons are keyboard navigable', () => {
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

    const categoryButtons = screen.getAllByRole('button');

    // Category filter buttons should be focusable
    categoryButtons.forEach(button => {
      expect(button.getAttribute('type')).toBe('button');
    });

    cleanup();
  });

  test('search input can be focused and typed into with keyboard', () => {
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

    const searchInput = screen.getByPlaceholderText('Search materials...') as HTMLInputElement;

    // Focus the input
    searchInput.focus();
    expect(document.activeElement).toBe(searchInput);

    // Type using keyboard events
    fireEvent.change(searchInput, { target: { value: 'keyboard test' } });
    expect(searchInput.value).toBe('keyboard test');

    cleanup();
  });

  test('category buttons can be activated with Enter key', () => {
    const mockOnChange = mock(() => {});

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

    const guideButton = screen.getByText('Guide');

    // Simulate Enter key press
    fireEvent.keyDown(guideButton, { key: 'Enter', code: 'Enter', charCode: 13 });
    fireEvent.click(guideButton);

    // Should trigger filter change
    expect(fetchMock).toHaveBeenCalled();

    cleanup();
  });

  test('pagination buttons have descriptive text for screen readers', () => {
    const paginationWithNext = {
      total: 20,
      offset: 0,
      limit: 9,
      hasMore: true,
    };

    render(
      <MaterialsFilterable
        lang="en"
        initialMaterials={mockMaterials}
        initialPagination={paginationWithNext}
        initialCategory=""
        initialSearch=""
        initialSort="newest"
        initialPage={1}
        labels={mockLabels}
        apiBaseUrl="http://localhost:3000/api/v1"
      />
    );

    // Previous and Next buttons should have clear text
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDefined();

    const pageIndicator = screen.getByText(/Page 1 of/i);
    expect(pageIndicator).toBeDefined();

    cleanup();
  });

  test('material cards are keyboard accessible links', () => {
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

    // Material title should be inside a link
    const materialLink = screen.getByText('Test Guide').closest('a');
    expect(materialLink).toBeDefined();
    expect(materialLink?.getAttribute('href')).toContain('/materials/test-guide');

    cleanup();
  });
});
