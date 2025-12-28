/**
 * Media Page
 *
 * Full-featured media library for file management including upload,
 * browse, filter, bulk actions, and trash management.
 */
import { useState, useCallback, useRef } from 'react';
import { Page } from '@/components/common/Page';
import { Pagination } from '@/components/common/Pagination';
import { MediaGrid } from '@/components/media/MediaGrid';
import { MediaToolbar } from '@/components/media/MediaToolbar';
import { DropZone } from '@/components/media/DropZone';
import { UploadQueue } from '@/components/media/UploadQueue';
import { MediaDetailModal } from '@/components/media/MediaDetailModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useMediaLibrary } from '@/hooks/useMediaLibrary';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { useTrashMedia } from '@/hooks/useTrashMedia';
import type { MediaItem } from '@/types/media';
import { Loader2 } from 'lucide-react';

export default function MediaPage() {
  // Media library state
  const {
    items,
    total,
    totalPages,
    page,
    mimeFilter,
    viewMode,
    isLoading,
    isFetching,
    setPage,
    setMimeFilter,
    setViewMode,
  } = useMediaLibrary();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [detailMediaId, setDetailMediaId] = useState<number | null>(null);

  // Confirmation dialog state
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<number | null>(null);

  // Upload functionality
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadQueue, addFiles, removeFromQueue, isUploading } = useMediaUpload();

  // Trash functionality
  const { restoreMedia, permanentDeleteMedia, isRestoring, isPermanentDeleting } = useTrashMedia();

  // Check if all visible items are selected
  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));

  // Handle select all toggle
  const handleSelectAllToggle = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  }, [allSelected, items]);

  // Handle item click (open detail modal)
  const handleItemClick = useCallback((item: MediaItem) => {
    setDetailMediaId(item.id);
  }, []);

  // Handle delete selected (soft delete)
  const handleDeleteSelected = useCallback(async () => {
    setConfirmDelete(false);
    // This will be implemented via useBulkDeleteMedia hook
    // For now, clear selection
    setSelectedIds(new Set());
  }, []);

  // Handle permanent delete
  const handlePermanentDelete = useCallback(async (id: number) => {
    await permanentDeleteMedia(id);
    setConfirmPermanentDelete(null);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [permanentDeleteMedia]);

  // Handle restore from trash
  const handleRestore = useCallback(async (id: number) => {
    await restoreMedia(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [restoreMedia]);

  // Handle upload button click
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle file drop/select
  const handleFileDrop = useCallback((files: File[]) => {
    addFiles(files);
  }, [addFiles]);

  // Handle view mode change (clear selection)
  const handleViewModeChange = useCallback((mode: 'library' | 'trash') => {
    setSelectedIds(new Set());
    setViewMode(mode);
  }, [setViewMode]);

  // Subtitle based on current view
  const subtitle = viewMode === 'trash'
    ? 'Deleted files waiting for permanent removal'
    : 'Manage images and files';

  return (
    <Page title="Media Library" subtitle={subtitle}>
      <div className="space-y-6">
        {/* Toolbar */}
        <MediaToolbar
          totalItems={total}
          mimeFilter={mimeFilter}
          onMimeFilterChange={setMimeFilter}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          selectedCount={selectedIds.size}
          allSelected={allSelected}
          onSelectAllToggle={handleSelectAllToggle}
          onDeleteSelected={() => setConfirmDelete(true)}
          onUploadClick={handleUploadClick}
          uploadDisabled={isUploading}
        />

        {/* Drop zone (library view only) */}
        {viewMode === 'library' && (
          <DropZone
            onDrop={handleFileDrop}
            isUploading={isUploading}
          />
        )}

        {/* Upload queue */}
        {uploadQueue.length > 0 && (
          <UploadQueue
            items={uploadQueue}
            onRemove={removeFromQueue}
          />
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        )}

        {/* Media grid */}
        {!isLoading && (
          <div className={isFetching ? 'opacity-50 pointer-events-none' : ''}>
            <MediaGrid
              items={items}
              onItemClick={handleItemClick}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              selectionMode={selectedIds.size > 0}
            />
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center pt-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Media detail modal */}
      <MediaDetailModal
        mediaId={detailMediaId}
        isOpen={detailMediaId !== null}
        onClose={() => setDetailMediaId(null)}
        isTrashView={viewMode === 'trash'}
        onRestore={handleRestore}
        onPermanentDelete={(id) => setConfirmPermanentDelete(id)}
        isRestoring={isRestoring}
      />

      {/* Bulk delete confirmation */}
      <ConfirmDialog
        isOpen={confirmDelete}
        title="Delete Selected Items"
        message={`Are you sure you want to delete ${selectedIds.size} selected item${selectedIds.size !== 1 ? 's' : ''}? They will be moved to trash.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteSelected}
        onCancel={() => setConfirmDelete(false)}
        variant="danger"
      />

      {/* Permanent delete confirmation */}
      <ConfirmDialog
        isOpen={confirmPermanentDelete !== null}
        title="Permanently Delete"
        message="This action cannot be undone. The file and all its variants will be permanently removed."
        confirmLabel="Delete Permanently"
        onConfirm={() => confirmPermanentDelete && handlePermanentDelete(confirmPermanentDelete)}
        onCancel={() => setConfirmPermanentDelete(null)}
        variant="danger"
        isLoading={isPermanentDeleting}
      />

      {/* Hidden file input for upload button */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) {
            handleFileDrop(files);
          }
          e.target.value = '';
        }}
        className="sr-only"
        aria-hidden="true"
      />
    </Page>
  );
}
