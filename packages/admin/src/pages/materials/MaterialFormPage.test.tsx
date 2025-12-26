/**
 * MaterialFormPage Tests
 *
 * Tests for the material editor form component.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import MaterialFormPage from './MaterialFormPage';

// Mock the API client
vi.mock('@/lib/api/client', () => ({
  get: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
}));

// Mock toast notifications
vi.mock('@/components/common/Toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showApiError: vi.fn(),
  ToastProvider: () => null,
}));

import { get, put, patch } from '@/lib/api/client';
import { showSuccess, showApiError } from '@/components/common/Toast';

const mockGet = vi.mocked(get);
const mockPut = vi.mocked(put);
const mockShowApiError = vi.mocked(showApiError);

// Sample material data
const mockMaterial = {
  id: 1,
  type: 'material' as const,
  slug: 'test-material',
  status: 'draft' as const,
  featured: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
  publishedAt: null,
  category: 'guide' as const,
  downloadUrl: 'https://example.com/file.pdf',
  fileSize: 1048576,
  translations: [
    {
      id: 1,
      contentId: 1,
      lang: 'it' as const,
      title: 'Guida Test',
      description: 'Descrizione della guida',
      body: '# Body content',
      metaTitle: null,
      metaDescription: null,
    },
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
  const initialEntry = id ? `/materials/${id}/edit` : '/materials/new';

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/materials/new" element={<MaterialFormPage />} />
          <Route path="/materials/:id/edit" element={<MaterialFormPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('MaterialFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockImplementation((endpoint) => {
      if (endpoint.includes('/admin/materials/1')) {
        return Promise.resolve({ data: mockMaterial });
      }
      if (endpoint.includes('/admin/media')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('loads and displays edit page with material data', async () => {
    renderWithProviders('1');

    await waitFor(() => {
      expect(screen.getByText('Edit Material')).toBeInTheDocument();
    });

    // Page subtitle should show material title
    expect(screen.getByText(/Editing: Guida Test/)).toBeInTheDocument();

    // API should have been called
    expect(mockGet).toHaveBeenCalledWith('/admin/materials/1');
  });

  it('displays category dropdown in material details section', async () => {
    renderWithProviders('1');

    await waitFor(() => {
      expect(screen.getByText('Edit Material')).toBeInTheDocument();
    });

    // Category field should be visible
    expect(screen.getByText('Material Details')).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/)).toBeInTheDocument();
  });

  it('has browse media button for download URL', async () => {
    renderWithProviders('1');

    await waitFor(() => {
      expect(screen.getByText('Edit Material')).toBeInTheDocument();
    });

    // Browse media button should be visible
    const browseButton = screen.getByRole('button', { name: /Browse Media/i });
    expect(browseButton).toBeInTheDocument();
  });

  it('has save button that is disabled when form is clean', async () => {
    renderWithProviders('1');

    await waitFor(() => {
      expect(screen.getByText('Edit Material')).toBeInTheDocument();
    });

    // Save button should be disabled initially
    const saveButton = screen.getByRole('button', { name: /Save/i });
    expect(saveButton).toBeDisabled();
  });

  it('shows publication status section for editing', async () => {
    renderWithProviders('1');

    await waitFor(() => {
      expect(screen.getByText('Edit Material')).toBeInTheDocument();
    });

    // Publication status should be visible
    expect(screen.getByText('Publication Status')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });
});
