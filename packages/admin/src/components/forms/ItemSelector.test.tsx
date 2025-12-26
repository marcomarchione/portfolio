/**
 * ItemSelector Component Tests
 *
 * Tests for the reusable tag/technology selector component.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ItemSelector } from './ItemSelector';

// Mock the API client
vi.mock('@/lib/api/client', () => ({
  get: vi.fn(),
  post: vi.fn(),
}));

// Import mocked functions
import { get, post } from '@/lib/api/client';

const mockTechnologies = [
  { id: 1, name: 'React', icon: null, color: '#61dafb' },
  { id: 2, name: 'TypeScript', icon: null, color: '#3178c6' },
  { id: 3, name: 'Node.js', icon: null, color: '#339933' },
];

const mockTags = [
  { id: 1, name: 'Tutorial', slug: 'tutorial' },
  { id: 2, name: 'Guide', slug: 'guide' },
  { id: 3, name: 'News', slug: 'news' },
];

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    ),
    queryClient,
  };
}

describe('ItemSelector Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(get).mockResolvedValue({ data: mockTechnologies });
    vi.mocked(post).mockResolvedValue({ data: { id: 4, name: 'New Tech', icon: null, color: null } });
  });

  test('renders selected items as removable pills', async () => {
    vi.mocked(get).mockResolvedValue({ data: mockTechnologies });

    renderWithProviders(
      <ItemSelector
        type="technology"
        selectedIds={[1, 2]}
        onChange={mockOnChange}
        label="Technologies"
      />
    );

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('React')).toBeInTheDocument();
    });

    // Both selected items should be visible as pills
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();

    // Each pill should have a remove button
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    expect(removeButtons.length).toBe(2);
  });

  test('dropdown shows available items', async () => {
    const user = userEvent.setup();
    vi.mocked(get).mockResolvedValue({ data: mockTechnologies });

    renderWithProviders(
      <ItemSelector
        type="technology"
        selectedIds={[1]}
        onChange={mockOnChange}
        label="Technologies"
      />
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    // Focus the search input to open dropdown
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.click(searchInput);

    // Available (non-selected) items should appear in dropdown
    await waitFor(() => {
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
    });
  });

  test('selecting item adds to selection', async () => {
    const user = userEvent.setup();
    vi.mocked(get).mockResolvedValue({ data: mockTechnologies });

    renderWithProviders(
      <ItemSelector
        type="technology"
        selectedIds={[1]}
        onChange={mockOnChange}
        label="Technologies"
      />
    );

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    // Open dropdown
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.click(searchInput);

    // Wait for dropdown items
    await waitFor(() => {
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });

    // Click on an unselected item
    await user.click(screen.getByText('TypeScript'));

    // onChange should be called with the new selection
    expect(mockOnChange).toHaveBeenCalledWith([1, 2]);
  });

  test('removing pill removes from selection', async () => {
    const user = userEvent.setup();
    vi.mocked(get).mockResolvedValue({ data: mockTechnologies });

    renderWithProviders(
      <ItemSelector
        type="technology"
        selectedIds={[1, 2]}
        onChange={mockOnChange}
        label="Technologies"
      />
    );

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('React')).toBeInTheDocument();
    });

    // Click the remove button on the first pill (React)
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await user.click(removeButtons[0]);

    // onChange should be called without the removed item
    expect(mockOnChange).toHaveBeenCalledWith([2]);
  });

  test('"Create New" opens inline form for technologies', async () => {
    const user = userEvent.setup();
    vi.mocked(get).mockResolvedValue({ data: mockTechnologies });

    renderWithProviders(
      <ItemSelector
        type="technology"
        selectedIds={[]}
        onChange={mockOnChange}
        label="Technologies"
      />
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    // Open dropdown
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.click(searchInput);

    // Wait for dropdown to open and find "Create New" option
    await waitFor(() => {
      expect(screen.getByText(/create new/i)).toBeInTheDocument();
    });

    // Click "Create New"
    await user.click(screen.getByText(/create new/i));

    // Inline form should appear with name field
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });
  });

  test('"Create New" opens inline form for tags and shows slug preview', async () => {
    const user = userEvent.setup();
    vi.mocked(get).mockResolvedValue({ data: mockTags });

    renderWithProviders(
      <ItemSelector
        type="tag"
        selectedIds={[]}
        onChange={mockOnChange}
        label="Tags"
      />
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    // Open dropdown
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.click(searchInput);

    // Wait for dropdown to open and find "Create New" option
    await waitFor(() => {
      expect(screen.getByText(/create new/i)).toBeInTheDocument();
    });

    // Click "Create New"
    await user.click(screen.getByText(/create new/i));

    // Inline form should appear with name field
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    // Type in the name field and check for slug preview
    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'My New Tag');

    // Slug preview should appear
    await waitFor(() => {
      expect(screen.getByText(/my-new-tag/i)).toBeInTheDocument();
    });
  });
});
