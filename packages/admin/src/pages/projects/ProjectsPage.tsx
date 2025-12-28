/**
 * Projects Page
 *
 * Projects list with filtering, sorting, and management options.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Page } from '@/components/common/Page';
import { Pagination } from '@/components/common/Pagination';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ContentTable, FilterBar, type ContentItem } from '@/components/dashboard';
import { useContentList, useArchiveContent } from '@/hooks';
import { projectKeys } from '@/lib/query/keys';
import { ROUTES } from '@/routes';
import type { Language } from '@marcomarchione/shared';

/** Extended project item from API */
interface ProjectItem extends ContentItem {
  githubUrl: string | null;
  demoUrl: string | null;
  projectStatus: string;
  startDate: string | null;
  endDate: string | null;
  technologies: Array<{ id: number; name: string; icon: string | null; color: string | null }>;
}

export default function ProjectsPage() {
  const [archiveId, setArchiveId] = useState<number | null>(null);

  const {
    items,
    total,
    totalPages,
    isLoading,
    filters,
    setSearch,
    setStatus,
    setSortBy,
    setSortOrder,
    setPage,
    refetch,
  } = useContentList<ProjectItem>({
    queryKey: projectKeys.lists(),
    endpoint: '/admin/projects',
  });

  const { archive, isArchiving } = useArchiveContent({
    contentType: 'projects',
    onSuccess: () => {
      setArchiveId(null);
      refetch();
    },
  });

  const handleArchive = (id: number) => {
    setArchiveId(id);
  };

  const confirmArchive = () => {
    if (archiveId) {
      archive(archiveId);
    }
  };

  // Map API response to ContentTable format
  const tableItems: ContentItem[] = items.map((item) => ({
    id: item.id,
    slug: item.slug,
    status: item.status,
    featured: item.featured,
    updatedAt: item.updatedAt,
    translations: item.translations.map((t) => ({
      lang: t.lang as Language,
      title: t.title,
    })),
  }));

  return (
    <Page
      title="Projects"
      subtitle={`${total} project${total !== 1 ? 's' : ''}`}
      actions={
        <Link
          to={ROUTES.PROJECTS_NEW}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity focus-ring"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      }
    >
      {/* Filter Bar */}
      <div className="mb-6">
        <FilterBar
          search={filters.search}
          onSearchChange={setSearch}
          status={filters.status}
          onStatusChange={setStatus}
          sortBy={filters.sortBy}
          onSortByChange={setSortBy}
          sortOrder={filters.sortOrder}
          onSortOrderChange={setSortOrder}
        />
      </div>

      {/* Content Table */}
      <ContentTable
        items={tableItems}
        contentType="projects"
        isLoading={isLoading}
        onArchive={handleArchive}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination
            currentPage={filters.page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={archiveId !== null}
        onClose={() => setArchiveId(null)}
        onConfirm={confirmArchive}
        title="Archive Project"
        description="Are you sure you want to archive this project? It will be moved to the archived status and hidden from public view."
        confirmText="Archive"
        isLoading={isArchiving}
      />
    </Page>
  );
}
