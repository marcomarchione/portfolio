/**
 * Media Page
 *
 * Professional media library with table view, upload queue, and detail modal.
 * Matches the design language of other content management pages.
 */
import { useState, useCallback, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Page } from '@/components/common/Page';
import { Pagination } from '@/components/common/Pagination';
import { MediaTable } from '@/components/media/MediaTable';
import { MediaToolbar } from '@/components/media/MediaToolbar';
import { DropZone } from '@/components/media/DropZone';
import { UploadQueue } from '@/components/media/UploadQueue';
import { MediaDetailModal } from '@/components/media/MediaDetailModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useMediaLibrary } from '@/hooks/useMediaLibrary';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { useTrashMedia } from '@/hooks/useTrashMedia';
import { useDeleteMedia } from '@/hooks/useDeleteMedia';
import type { MediaItem } from '@/types/media';

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
  const [confirmSingleDelete, setConfirmSingleDelete] = useState<number | null>(null);

  // Upload functionality
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadQueue, addFiles, removeFromQueue, clearCompleted, isUploading } = useMediaUpload();

  // Trash functionality
  const { restoreMedia, permanentDeleteMedia, isRestoring, isPermanentDeleting } = useTrashMedia();

  // Delete functionality (soft delete)
  const { deleteMedia, bulkDeleteMedia, isDeleting, isBulkDeleting } = useDeleteMedia();

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
    const ids = Array.from(selectedIds);
    await bulkDeleteMedia(ids);
    setConfirmDelete(false);
    setSelectedIds(new Set());
  }, [selectedIds, bulkDeleteMedia]);

  // Handle single item delete (soft delete from modal)
  const handleSingleDelete = useCallback(async (id: number) => {
    await deleteMedia(id);
    setConfirmSingleDelete(null);
    setDetailMediaId(null);
  }, [deleteMedia]);

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
    ? `${total} file${total !== 1 ? 's' : ''} in trash`
    : `${total} file${total !== 1 ? 's' : ''}`;

  return (
    <Page
      title="Media Library"
      subtitle={subtitle}
      actions={
        viewMode === 'library' && (
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={isUploading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity focus-ring disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            Upload Files
          </button>
        )
      }
    >
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

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        )}

        {/* Media table */}
        {!isLoading && (
          <div className={isFetching ? 'opacity-50 pointer-events-none' : ''}>
            <MediaTable
              items={items}
              onItemClick={handleItemClick}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              isTrashView={viewMode === 'trash'}
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

      {/* Upload queue (floating) */}
      <UploadQueue
        items={uploadQueue}
        onRemove={removeFromQueue}
        onClearCompleted={clearCompleted}
      />

      {/* Media detail modal */}
      <MediaDetailModal
        mediaId={detailMediaId}
        isOpen={detailMediaId !== null}
        onClose={() => setDetailMediaId(null)}
        isTrashView={viewMode === 'trash'}
        onRestore={handleRestore}
        onPermanentDelete={(id) => setConfirmPermanentDelete(id)}
        onDelete={(id) => setConfirmSingleDelete(id)}
        isRestoring={isRestoring}
        isDeleting={isDeleting}
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

      {/* Single item delete confirmation (soft delete) */}
      <ConfirmDialog
        isOpen={confirmSingleDelete !== null}
        title="Delete Media"
        message="Are you sure you want to delete this file? It will be moved to trash and can be restored later."
        confirmLabel="Move to Trash"
        onConfirm={() => confirmSingleDelete && handleSingleDelete(confirmSingleDelete)}
        onCancel={() => setConfirmSingleDelete(null)}
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Hidden file input for upload button */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf"
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
