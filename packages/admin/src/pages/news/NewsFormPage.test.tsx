/**
 * NewsFormPage Tests
 *
 * Tests for the news editor form component.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import NewsFormPage from './NewsFormPage';

// Mock the API client
vi.mock('@/lib/api/client', () => ({
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));

// Mock toast notifications
vi.mock('@/components/common/Toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showApiError: vi.fn(),
  ToastProvider: () => null,
}));

import { get } from '@/lib/api/client';

const mockGet = vi.mocked(get);

// Sample news data
const mockNews = {
  id: 1,
  type: 'news' as const,
  slug: 'test-article',
  status: 'draft' as const,
  featured: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
  publishedAt: null,
  coverImage: 'https://example.com/cover.jpg',
  readingTime: 5,
  translations: [
    {
      id: 1,
      contentId: 1,
      lang: 'it' as const,
      title: 'Articolo Test',
      description: 'Descrizione articolo',
      body: 'Contenuto lungo per calcolare il tempo di lettura. '.repeat(50),
      metaTitle: null,
      metaDescription: null,
    },
  ],
  tags: [
    { id: 1, name: 'JavaScript', slug: 'javascript' },
    { id: 2, name: 'React', slug: 'react' },
  ],
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderWithProviders(id?: string) {
  const queryClient = createTestQueryClient();
  const initialEntry = id ? `/news/${id}/edit` : '/news/new';

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/news/new" element={<NewsFormPage />} />
          <Route path="/news/:id/edit" element={<NewsFormPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('NewsFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockImplementation((endpoint) => {
      if (endpoint.includes('/admin/news/1')) {
        return Promise.resolve({ data: mockNews });
      }
      if (endpoint.includes('/admin/tags')) {
        return Promise.resolve({ data: mockNews.tags });
      }
      if (endpoint.includes('/admin/media')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('loads and displays edit page with news data', async () => {
    renderWithProviders('1');

    await waitFor(() => {
      expect(screen.getByText('Edit Article')).toBeInTheDocument();
    });

    // Page subtitle should show article title
    expect(screen.getByText(/Editing: Articolo Test/)).toBeInTheDocument();

    // API should have been called
    expect(mockGet).toHaveBeenCalledWith('/admin/news/1');
  });

  it('displays cover image section in article details', async () => {
    renderWithProviders('1');

    await waitFor(() => {
      expect(screen.getByText('Edit Article')).toBeInTheDocument();
    });

    // Article details section should be visible
    expect(screen.getByText('Article Details')).toBeInTheDocument();

    // Cover image label should be visible
    expect(screen.getByText('Cover Image')).toBeInTheDocument();
  });

  it('displays tags section', async () => {
    renderWithProviders('1');

    await waitFor(() => {
      expect(screen.getByText('Edit Article')).toBeInTheDocument();
    });

    // Tags section should be visible
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });

  it('has save button that is disabled when form is clean', async () => {
    renderWithProviders('1');

    await waitFor(() => {
      expect(screen.getByText('Edit Article')).toBeInTheDocument();
    });

    // Save button should be disabled initially
    const saveButton = screen.getByRole('button', { name: /Save/i });
    expect(saveButton).toBeDisabled();
  });

  it('displays reading time field with auto-calculation hint', async () => {
    renderWithProviders('1');

    await waitFor(() => {
      expect(screen.getByText('Edit Article')).toBeInTheDocument();
    });

    // Reading time input should be visible
    const readingTimeInput = screen.getByLabelText(/Reading Time/);
    expect(readingTimeInput).toBeInTheDocument();

    // Auto-calculated hint should be shown
    expect(screen.getByText(/Auto-calculated from Italian body/)).toBeInTheDocument();
  });
});
