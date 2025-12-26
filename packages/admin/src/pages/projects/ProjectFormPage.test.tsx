/**
 * ProjectFormPage Tests
 *
 * Tests for the project editor form component.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProjectFormPage from './ProjectFormPage';

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

// Sample project data
const mockProject = {
  id: 1,
  type: 'project' as const,
  slug: 'test-project',
  status: 'draft' as const,
  featured: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
  publishedAt: null,
  githubUrl: 'https://github.com/test/repo',
  demoUrl: 'https://example.com',
  projectStatus: 'in-progress' as const,
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: null,
  translations: [
    {
      id: 1,
      contentId: 1,
      lang: 'it' as const,
      title: 'Progetto Test',
      description: 'Descrizione del progetto',
      body: '# Body content',
      metaTitle: 'Meta titolo',
      metaDescription: 'Meta descrizione',
    },
    {
      id: 2,
      contentId: 1,
      lang: 'en' as const,
      title: 'Test Project',
      description: 'Project description',
      body: '# Body content EN',
      metaTitle: null,
      metaDescription: null,
    },
  ],
  technologies: [
    { id: 1, name: 'React', icon: null, color: '#61dafb' },
    { id: 2, name: 'TypeScript', icon: null, color: '#3178c6' },
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
  const initialEntry = id ? `/projects/${id}/edit` : '/projects/new';

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/projects/new" element={<ProjectFormPage />} />
          <Route path="/projects/:id/edit" element={<ProjectFormPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ProjectFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockImplementation((endpoint) => {
      if (endpoint.includes('/admin/technologies')) {
        return Promise.resolve({ data: mockProject.technologies });
      }
      if (endpoint.includes('/admin/projects/1')) {
        return Promise.resolve({ data: mockProject });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('loads and displays edit page with project data', async () => {
    renderWithProviders('1');

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText('Edit Project')).toBeInTheDocument();
    });

    // Page subtitle should show project title
    expect(screen.getByText(/Editing: Progetto Test/)).toBeInTheDocument();

    // API should have been called
    expect(mockGet).toHaveBeenCalledWith('/admin/projects/1');
  });

  it('shows Italian tab as the default active tab', async () => {
    renderWithProviders('1');

    await waitFor(() => {
      expect(screen.getByText('Edit Project')).toBeInTheDocument();
    });

    // Italian tab should be visible and selected
    const italianTab = screen.getByRole('tab', { name: /IT/i });
    expect(italianTab).toHaveAttribute('aria-selected', 'true');
  });

  it('displays technologies section', async () => {
    renderWithProviders('1');

    await waitFor(() => {
      expect(screen.getByText('Edit Project')).toBeInTheDocument();
    });

    // Technologies heading should be visible
    expect(screen.getByText('Technologies')).toBeInTheDocument();
  });

  it('has save button that is disabled when form is clean', async () => {
    renderWithProviders('1');

    await waitFor(() => {
      expect(screen.getByText('Edit Project')).toBeInTheDocument();
    });

    // Save button should be disabled initially
    const saveButton = screen.getByRole('button', { name: /Save/i });
    expect(saveButton).toBeDisabled();
  });

  it('shows publication status section for editing', async () => {
    renderWithProviders('1');

    await waitFor(() => {
      expect(screen.getByText('Edit Project')).toBeInTheDocument();
    });

    // Publication status should be visible
    expect(screen.getByText('Publication Status')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });
});
