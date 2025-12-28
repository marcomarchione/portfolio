/**
 * Media Toolbar Component
 *
 * Toolbar with filters, actions, and view toggles for the media library.
 */
import { Trash2, Upload, Library, CheckSquare, XSquare } from 'lucide-react';
import { MimeTypeFilter } from './MimeTypeFilter';
import type { MimeTypeFilterValue, MediaViewMode } from '@/types/media';

interface MediaToolbarProps {
  /** Total item count */
  totalItems: number;
  /** Current MIME type filter */
  mimeFilter: MimeTypeFilterValue;
  /** Callback when MIME filter changes */
  onMimeFilterChange: (value: MimeTypeFilterValue) => void;
  /** Current view mode */
  viewMode: MediaViewMode;
  /** Callback when view mode changes */
  onViewModeChange: (mode: MediaViewMode) => void;
  /** Number of selected items */
  selectedCount: number;
  /** Whether all visible items are selected */
  allSelected: boolean;
  /** Callback for select all toggle */
  onSelectAllToggle: () => void;
  /** Callback for delete selected */
  onDeleteSelected: () => void;
  /** Callback for upload button */
  onUploadClick: () => void;
  /** Whether uploads are disabled */
  uploadDisabled?: boolean;
}

/**
 * Media library toolbar component.
 */
export function MediaToolbar({
  totalItems,
  mimeFilter,
  onMimeFilterChange,
  viewMode,
  onViewModeChange,
  selectedCount,
  allSelected,
  onSelectAllToggle,
  onDeleteSelected,
  onUploadClick,
  uploadDisabled = false,
}: MediaToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 glass-card rounded-lg">
      {/* Left side: Item count and view toggle */}
      <div className="flex items-center gap-4">
        {/* View mode tabs */}
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          <button
            type="button"
            onClick={() => onViewModeChange('library')}
            className={`
              flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors
              ${
                viewMode === 'library'
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'bg-transparent text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }
            `}
            aria-pressed={viewMode === 'library'}
          >
            <Library className="w-4 h-4" />
            <span className="hidden sm:inline">Library</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('trash')}
            className={`
              flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors border-l border-white/10
              ${
                viewMode === 'trash'
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'bg-transparent text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }
            `}
            aria-pressed={viewMode === 'trash'}
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Trash</span>
          </button>
        </div>

        {/* Item count */}
        <span className="text-sm text-neutral-400">
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
          {selectedCount > 0 && (
            <span className="text-primary-400 ml-2">
              ({selectedCount} selected)
            </span>
          )}
        </span>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {/* MIME filter (library view only) */}
        {viewMode === 'library' && (
          <MimeTypeFilter
            value={mimeFilter}
            onChange={onMimeFilterChange}
          />
        )}

        {/* Select All toggle */}
        {totalItems > 0 && (
          <button
            type="button"
            onClick={onSelectAllToggle}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:bg-white/10 transition-colors"
            title={allSelected ? 'Deselect all' : 'Select all'}
          >
            {allSelected ? (
              <XSquare className="w-4 h-4" />
            ) : (
              <CheckSquare className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {allSelected ? 'Deselect All' : 'Select All'}
            </span>
          </button>
        )}

        {/* Delete Selected (only when items selected) */}
        {selectedCount > 0 && (
          <button
            type="button"
            onClick={onDeleteSelected}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete Selected</span>
          </button>
        )}

        {/* Upload button (library view only) */}
        {viewMode === 'library' && (
          <button
            type="button"
            onClick={onUploadClick}
            disabled={uploadDisabled}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default MediaToolbar;
