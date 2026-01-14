/**
 * Gallery Selector Component
 *
 * Component for selecting and ordering gallery images for projects.
 * Features:
 * - Grid display of selected images with thumbnails
 * - Drag-and-drop reordering (HTML5 native)
 * - Add button opens MediaPicker modal
 * - Remove button on each image
 * - Position badge shows current order
 */
import { useState, useCallback } from 'react';
import { Plus, X, GripVertical, Image as ImageIcon } from 'lucide-react';
import { MediaPicker, type SelectedMedia } from './MediaPicker';

/**
 * Gallery item structure with ordering.
 */
export interface GalleryItem {
  mediaId: number;
  url: string;
  alt?: string | null;
  displayOrder: number;
}

/**
 * Props for the GallerySelector component.
 */
export interface GallerySelectorProps {
  /** Label for the selector */
  label: string;
  /** Currently selected gallery items (ordered) */
  items: GalleryItem[];
  /** Callback when items change */
  onChange: (items: GalleryItem[]) => void;
  /** Help text below the component */
  helpText?: string;
}

/**
 * GallerySelector component for managing project gallery images.
 */
export function GallerySelector({
  label,
  items,
  onChange,
  helpText,
}: GallerySelectorProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Handle adding new media
  const handleMediaSelect = useCallback(
    (media: SelectedMedia) => {
      // Check if already added
      if (items.some((item) => item.mediaId === media.id)) {
        setIsPickerOpen(false);
        return;
      }

      // Add to end with next displayOrder
      const maxOrder =
        items.length > 0 ? Math.max(...items.map((i) => i.displayOrder)) : -1;

      const newItem: GalleryItem = {
        mediaId: media.id,
        url: media.url,
        alt: null,
        displayOrder: maxOrder + 1,
      };

      onChange([...items, newItem]);
      setIsPickerOpen(false);
    },
    [items, onChange]
  );

  // Handle removing media
  const handleRemove = useCallback(
    (mediaId: number) => {
      const filtered = items.filter((item) => item.mediaId !== mediaId);
      // Reorder remaining items
      const reordered = filtered.map((item, index) => ({
        ...item,
        displayOrder: index,
      }));
      onChange(reordered);
    },
    [items, onChange]
  );

  // Drag handlers
  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      const dragIndex = draggedIndex;

      if (dragIndex === null || dragIndex === dropIndex) {
        setDraggedIndex(null);
        setDragOverIndex(null);
        return;
      }

      // Reorder items
      const sortedItems = [...items].sort(
        (a, b) => a.displayOrder - b.displayOrder
      );
      const newItems = [...sortedItems];
      const [draggedItem] = newItems.splice(dragIndex, 1);
      newItems.splice(dropIndex, 0, draggedItem);

      // Update displayOrder
      const reordered = newItems.map((item, index) => ({
        ...item,
        displayOrder: index,
      }));

      onChange(reordered);
      setDraggedIndex(null);
      setDragOverIndex(null);
    },
    [draggedIndex, items, onChange]
  );

  // Sort items by displayOrder for rendering
  const sortedItems = [...items].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  return (
    <div className="space-y-3">
      {/* Label */}
      <label className="block text-sm font-medium text-neutral-300">
        {label}
      </label>

      {/* Gallery Grid */}
      {sortedItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {sortedItems.map((item, index) => (
            <div
              key={item.mediaId}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, index)}
              className={`
                group relative aspect-square rounded-lg overflow-hidden
                bg-neutral-800/50 border-2 transition-all cursor-move
                ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
                ${
                  dragOverIndex === index && draggedIndex !== index
                    ? 'border-primary-500 ring-2 ring-primary-500/50'
                    : 'border-white/10 hover:border-primary-500/30'
                }
              `}
            >
              {/* Image */}
              <img
                src={item.url}
                alt={item.alt || `Gallery image ${index + 1}`}
                className="w-full h-full object-cover pointer-events-none"
              />

              {/* Drag handle overlay */}
              <div className="absolute top-2 left-2 p-1 rounded bg-neutral-900/70 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4" />
              </div>

              {/* Order badge */}
              <div className="absolute top-2 right-8 px-2 py-0.5 rounded text-xs font-medium bg-neutral-900/70 text-neutral-300">
                {index + 1}
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(item.mediaId);
                }}
                className="absolute top-2 right-2 p-1 rounded bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                aria-label="Remove from gallery"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Add button as last grid item */}
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            className="aspect-square rounded-lg border-2 border-dashed border-neutral-700 bg-neutral-800/30 flex flex-col items-center justify-center gap-2 text-neutral-500 hover:text-primary-400 hover:border-primary-500/50 transition-all"
          >
            <Plus className="w-6 h-6" />
            <span className="text-xs">Add Image</span>
          </button>
        </div>
      ) : (
        /* Empty state */
        <button
          type="button"
          onClick={() => setIsPickerOpen(true)}
          className="w-full py-8 rounded-lg border-2 border-dashed border-neutral-700 bg-neutral-800/30 flex flex-col items-center justify-center gap-3 text-neutral-500 hover:text-primary-400 hover:border-primary-500/50 transition-all"
        >
          <ImageIcon className="w-12 h-12" />
          <div className="text-center">
            <p className="font-medium">No gallery images</p>
            <p className="text-sm">
              Click to add images to the project gallery
            </p>
          </div>
        </button>
      )}

      {/* Help text */}
      {helpText && <p className="text-sm text-neutral-500">{helpText}</p>}

      {/* Media Picker Modal */}
      <MediaPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleMediaSelect}
        mimeTypeFilter="image/*"
      />
    </div>
  );
}

export default GallerySelector;
