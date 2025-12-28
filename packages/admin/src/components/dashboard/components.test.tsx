/**
 * Dashboard Components Tests
 *
 * Tests for reusable dashboard UI components.
 */
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { TranslationIndicator } from './TranslationIndicator';
import { StatsCard } from './StatsCard';
import { FilterBar } from './FilterBar';
import { ContentTable } from './ContentTable';
import { FolderOpen } from 'lucide-react';

describe('StatusBadge', () => {
  test('renders draft status with amber styling', () => {
    render(<StatusBadge status="draft" />);
    const badge = screen.getByText('Draft');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('amber');
  });

  test('renders published status with green styling', () => {
    render(<StatusBadge status="published" />);
    const badge = screen.getByText('Published');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('green');
  });

  test('renders archived status with neutral styling', () => {
    render(<StatusBadge status="archived" />);
    const badge = screen.getByText('Archived');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('neutral');
  });
});

describe('TranslationIndicator', () => {
  test('shows filled indicators for completed languages', () => {
    render(<TranslationIndicator completedLanguages={['it', 'en']} />);
    const itBadge = screen.getByText('IT');
    const enBadge = screen.getByText('EN');
    expect(itBadge).toBeInTheDocument();
    expect(enBadge).toBeInTheDocument();
    expect(itBadge.className).toContain('primary');
    expect(enBadge.className).toContain('primary');
  });

  test('shows empty indicators for missing languages', () => {
    render(<TranslationIndicator completedLanguages={['it']} />);
    const esBadge = screen.getByText('ES');
    const deBadge = screen.getByText('DE');
    expect(esBadge.className).toContain('neutral');
    expect(deBadge.className).toContain('neutral');
  });
});

describe('StatsCard', () => {
  test('renders label and value', () => {
    render(<StatsCard label="Total Projects" value={42} />);
    expect(screen.getByText('Total Projects')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  test('renders with icon', () => {
    render(<StatsCard label="Projects" value={10} icon={FolderOpen} />);
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  test('renders children content', () => {
    render(
      <StatsCard label="Stats" value={5}>
        <div>Extra info</div>
      </StatsCard>
    );
    expect(screen.getByText('Extra info')).toBeInTheDocument();
  });
});

describe('FilterBar', () => {
  test('updates search input on change', () => {
    const onSearchChange = vi.fn();
    render(
      <FilterBar
        search=""
        onSearchChange={onSearchChange}
        status={undefined}
        onStatusChange={vi.fn()}
        sortBy="updatedAt"
        onSortByChange={vi.fn()}
        sortOrder="desc"
        onSortOrderChange={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Search by title...');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(onSearchChange).toHaveBeenCalledWith('test');
  });

  test('toggles sort order on button click', () => {
    const onSortOrderChange = vi.fn();
    render(
      <FilterBar
        search=""
        onSearchChange={vi.fn()}
        status={undefined}
        onStatusChange={vi.fn()}
        sortBy="updatedAt"
        onSortByChange={vi.fn()}
        sortOrder="desc"
        onSortOrderChange={onSortOrderChange}
      />
    );

    const button = screen.getByTitle('Descending');
    fireEvent.click(button);
    expect(onSortOrderChange).toHaveBeenCalledWith('asc');
  });
});

describe('ContentTable', () => {
  const mockItems = [
    {
      id: 1,
      slug: 'test-project',
      status: 'published' as const,
      featured: true,
      updatedAt: '2024-01-15T10:00:00Z',
      translations: [
        { lang: 'it' as const, title: 'Progetto Test' },
        { lang: 'en' as const, title: 'Test Project' },
      ],
    },
  ];

  test('renders table with content items', () => {
    render(
      <BrowserRouter>
        <ContentTable items={mockItems} contentType="projects" />
      </BrowserRouter>
    );
    expect(screen.getByText('Progetto Test')).toBeInTheDocument();
    expect(screen.getByText('test-project')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  test('shows featured badge when item is featured', () => {
    render(
      <BrowserRouter>
        <ContentTable items={mockItems} contentType="projects" />
      </BrowserRouter>
    );
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    render(
      <BrowserRouter>
        <ContentTable items={[]} contentType="projects" isLoading />
      </BrowserRouter>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('shows empty state when no items', () => {
    render(
      <BrowserRouter>
        <ContentTable items={[]} contentType="projects" />
      </BrowserRouter>
    );
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });
});
