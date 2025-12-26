/**
 * ItemSelector Component
 *
 * Generic component for selecting and managing tags or technologies.
 * Displays selected items as removable pills with a searchable dropdown
 * for adding new items and inline creation capability.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, ChevronDown, Loader2 } from 'lucide-react';
import { get, post } from '@/lib/api/client';
import { settingsKeys } from '@/lib/query/keys';
import type { ApiResponse } from '@/types/api';
import type { Technology, Tag } from '@marcomarchione/shared';

type ItemType = 'technology' | 'tag';

interface ItemSelectorProps {
  /** Type of items to select */
  type: ItemType;
  /** Array of selected item IDs */
  selectedIds: number[];
  /** Callback when selection changes */
  onChange: (ids: number[]) => void;
  /** Label for the selector */
  label: string;
}

type Item = Technology | Tag;

interface CreateTechnologyData {
  name: string;
  icon: string | null;
  color: string | null;
}

interface CreateTagData {
  name: string;
  slug: string;
}

/**
 * Generates a slug from a name string.
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * ItemSelector component for selecting tags or technologies.
 */
export function ItemSelector({
  type,
  selectedIds,
  onChange,
  label,
}: ItemSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemIcon, setNewItemIcon] = useState('');
  const [newItemColor, setNewItemColor] = useState('#3d7eff');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  // Fetch items based on type
  const queryKey = type === 'technology' ? settingsKeys.technologies() : settingsKeys.tags();
  const endpoint = type === 'technology' ? '/admin/technologies' : '/admin/tags';

  const { data: itemsResponse, isLoading } = useQuery({
    queryKey,
    queryFn: () => get<ApiResponse<Item[]>>(endpoint),
  });

  const items = itemsResponse?.data ?? [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateTechnologyData | CreateTagData) => {
      return post<ApiResponse<Item>>(endpoint, data);
    },
    onSuccess: (response) => {
      // Invalidate query to refetch items
      queryClient.invalidateQueries({ queryKey });
      // Add the new item to selection
      if (response.data) {
        onChange([...selectedIds, response.data.id]);
      }
      // Reset form
      setShowCreateForm(false);
      setNewItemName('');
      setNewItemIcon('');
      setNewItemColor('#3d7eff');
      setIsOpen(false);
    },
  });

  // Get selected items data
  const selectedItems = items.filter((item) => selectedIds.includes(item.id));

  // Get available items (not selected)
  const availableItems = items.filter(
    (item) =>
      !selectedIds.includes(item.id) &&
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle item selection
  const handleSelect = useCallback(
    (itemId: number) => {
      onChange([...selectedIds, itemId]);
      setSearchTerm('');
      setIsOpen(false);
    },
    [selectedIds, onChange]
  );

  // Handle item removal
  const handleRemove = useCallback(
    (itemId: number) => {
      onChange(selectedIds.filter((id) => id !== itemId));
    },
    [selectedIds, onChange]
  );

  // Handle create form submission
  const handleCreate = useCallback(() => {
    if (!newItemName.trim()) return;

    if (type === 'technology') {
      createMutation.mutate({
        name: newItemName.trim(),
        icon: newItemIcon.trim() || null,
        color: newItemColor || null,
      });
    } else {
      createMutation.mutate({
        name: newItemName.trim(),
        slug: generateSlug(newItemName),
      });
    }
  }, [type, newItemName, newItemIcon, newItemColor, createMutation]);

  // Get item display color
  const getItemColor = (item: Item): string | null => {
    if ('color' in item) {
      return item.color;
    }
    return null;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Label */}
      <label className="block text-sm font-medium text-neutral-300 mb-2">
        {label}
      </label>

      {/* Selected Items Pills */}
      <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
        {selectedItems.map((item) => {
          const color = getItemColor(item);
          return (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: color ? `${color}20` : 'rgba(61, 126, 255, 0.2)',
                color: color || '#3d7eff',
                border: `1px solid ${color || '#3d7eff'}40`,
              }}
            >
              {item.name}
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-white/20 transition-colors focus-ring"
                aria-label={`Remove ${item.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={`Search ${type === 'technology' ? 'technologies' : 'tags'}...`}
          className="w-full px-4 py-2 pr-10 rounded-lg bg-neutral-800/50 border border-neutral-700 text-neutral-200 placeholder-neutral-500 focus-ring transition-colors"
        />
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 py-1 rounded-lg glass-card shadow-xl max-h-64 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
            </div>
          ) : showCreateForm ? (
            /* Inline Create Form */
            <div className="p-3 space-y-3">
              <div>
                <label htmlFor="new-item-name" className="block text-sm font-medium text-neutral-300 mb-1">
                  Name
                </label>
                <input
                  id="new-item-name"
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={type === 'technology' ? 'Technology name' : 'Tag name'}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-800/50 border border-neutral-700 text-neutral-200 placeholder-neutral-500 focus-ring"
                  autoFocus
                />
              </div>

              {type === 'technology' && (
                <>
                  <div>
                    <label htmlFor="new-item-icon" className="block text-sm font-medium text-neutral-300 mb-1">
                      Icon (emoji)
                    </label>
                    <input
                      id="new-item-icon"
                      type="text"
                      value={newItemIcon}
                      onChange={(e) => setNewItemIcon(e.target.value)}
                      placeholder="e.g., 🔧"
                      className="w-full px-3 py-2 rounded-lg bg-neutral-800/50 border border-neutral-700 text-neutral-200 placeholder-neutral-500 focus-ring"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-item-color" className="block text-sm font-medium text-neutral-300 mb-1">
                      Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="new-item-color"
                        type="color"
                        value={newItemColor}
                        onChange={(e) => setNewItemColor(e.target.value)}
                        className="w-12 h-10 rounded-lg border border-neutral-700 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={newItemColor}
                        onChange={(e) => setNewItemColor(e.target.value)}
                        placeholder="#3d7eff"
                        className="flex-1 px-3 py-2 rounded-lg bg-neutral-800/50 border border-neutral-700 text-neutral-200 placeholder-neutral-500 focus-ring"
                      />
                    </div>
                  </div>
                </>
              )}

              {type === 'tag' && newItemName && (
                <div className="text-sm text-neutral-500">
                  Slug: <span className="text-neutral-400">{generateSlug(newItemName)}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-3 py-2 rounded-lg bg-neutral-700/50 text-neutral-300 hover:bg-neutral-700 transition-colors focus-ring"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!newItemName.trim() || createMutation.isPending}
                  className="flex-1 px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-ring flex items-center justify-center gap-2"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Available Items */}
              {availableItems.length > 0 ? (
                availableItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className="w-full px-4 py-2 text-left text-neutral-200 hover:bg-white/5 transition-colors flex items-center gap-2"
                  >
                    {getItemColor(item) && (
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getItemColor(item)! }}
                      />
                    )}
                    {item.name}
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-neutral-500 text-sm">
                  {searchTerm ? 'No matching items found' : 'No items available'}
                </div>
              )}

              {/* Create New Option */}
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(true);
                  setNewItemName(searchTerm);
                }}
                className="w-full px-4 py-2 text-left text-primary-400 hover:bg-white/5 transition-colors flex items-center gap-2 border-t border-neutral-700/50 mt-1"
              >
                <Plus className="h-4 w-4" />
                Create New {type === 'technology' ? 'Technology' : 'Tag'}
                {searchTerm && ` "${searchTerm}"`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
