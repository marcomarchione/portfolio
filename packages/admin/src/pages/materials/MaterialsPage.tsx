/**
 * Materials Page
 *
 * Materials list with filtering, sorting, and management options.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Page } from '@/components/common/Page';
import { Pagination } from '@/components/common/Pagination';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ContentTable, FilterBar, type ContentItem } from '@/components/dashboard';
import { useContentList, useArchiveContent } from '@/hooks';
import { materialKeys } from '@/lib/query/keys';
import { ROUTES } from '@/routes';
import type { Language } from '@marcomarchione/shared';

/** Extended material item from API */
interface MaterialItem extends ContentItem {
  category: string;
  downloadUrl: string;
  fileSize: number | null;
}

export default function MaterialsPage() {
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
  } = useContentList<MaterialItem>({
    queryKey: materialKeys.lists(),
    endpoint: '/admin/materials',
  });

  const { archive, isArchiving } = useArchiveContent({
    contentType: 'materials',
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
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    publishedAt: item.publishedAt,
    translations: item.translations.map((t) => ({
      lang: t.lang as Language,
      title: t.title,
    })),
  }));

  return (
    <Page
      title="Materials"
      subtitle={`${total} material${total !== 1 ? 's' : ''}`}
      actions={
        <Link
          to={ROUTES.MATERIALS_NEW}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity focus-ring"
        >
          <Plus className="h-4 w-4" />
          New Material
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
        contentType="materials"
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
        onCancel={() => setArchiveId(null)}
        onConfirm={confirmArchive}
        title="Archive Material"
        message="Are you sure you want to archive this material? It will be moved to the archived status and hidden from public view."
        confirmLabel="Archive"
        isLoading={isArchiving}
      />
    </Page>
  );
}
