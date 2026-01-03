/**
 * ItemSelector Component
 *
 * Generic component for selecting and managing tags or technologies.
 * Displays selected items as removable pills with a searchable dropdown
 * for adding new items and inline creation capability.
 * Uses React Portal for proper z-index layering.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, ChevronDown, Loader2, Sparkles, Palette } from 'lucide-react';
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
 * Preset colors for quick selection
 */
const COLOR_PRESETS = [
  { color: '#61DAFB', name: 'Cyan' },
  { color: '#3178C6', name: 'Blue' },
  { color: '#339933', name: 'Green' },
  { color: '#FF5D01', name: 'Orange' },
  { color: '#E34F26', name: 'Red' },
  { color: '#8B5CF6', name: 'Purple' },
  { color: '#F7DF1E', name: 'Yellow' },
  { color: '#06B6D4', name: 'Teal' },
];

/**
 * Suggested emojis for technologies
 */
const EMOJI_SUGGESTIONS = ['⚛️', '📘', '🚀', '🔧', '💻', '🎨', '📦', '⚡', '🔥', '🌐', '🗃️', '🐳'];

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
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

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

  // Calculate popup position
  const updatePosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const popupHeight = 320; // Approximate max height of dropdown
      const viewportHeight = window.innerHeight;

      // Check if there's enough space below
      const spaceBelow = viewportHeight - rect.bottom;
      const showAbove = spaceBelow < popupHeight && rect.top > popupHeight;

      setPopupPosition({
        top: showAbove ? rect.top - popupHeight - 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  // Update position on scroll/resize when open
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, updatePosition]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Don't close if clicking inside the modal
      if (modalRef.current && modalRef.current.contains(target)) {
        return;
      }
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        popupRef.current && !popupRef.current.contains(target)
      ) {
        setIsOpen(false);
        // Only close create form if not clicking inside modal
        if (!showCreateForm) {
          setShowCreateForm(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, showCreateForm]);

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

  // Get item icon (only for technologies)
  const getItemIcon = (item: Item): string | null => {
    if ('icon' in item) {
      return item.icon;
    }
    return null;
  };

  // Open dropdown with position update
  const handleOpen = useCallback(() => {
    updatePosition();
    setIsOpen(true);
  }, [updatePosition]);

  // Dropdown popup rendered via portal
  const dropdownPopup = isOpen ? createPortal(
    <div
      ref={popupRef}
      role="listbox"
      aria-label={`${type === 'technology' ? 'Technologies' : 'Tags'} dropdown`}
      className="fixed py-1 rounded-lg bg-neutral-900 border border-neutral-700 shadow-2xl shadow-black/50 max-h-80 overflow-auto"
      style={{
        top: popupPosition.top,
        left: popupPosition.left,
        width: popupPosition.width,
        zIndex: 99999,
      }}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
        </div>
      ) : (
        <>
          {/* Available Items */}
          {availableItems.length > 0 ? (
            availableItems.map((item) => {
              const color = getItemColor(item) || '#3d7eff';
              const icon = getItemIcon(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className="w-full px-4 py-2.5 text-left text-neutral-200 hover:bg-neutral-800 transition-colors flex items-center gap-3 group"
                >
                  {/* Icon or colored dot */}
                  {icon ? (
                    <span className="text-lg leading-none">{icon}</span>
                  ) : (
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0 transition-shadow group-hover:shadow-lg"
                      style={{
                        backgroundColor: color,
                        boxShadow: `0 0 8px ${color}60`,
                      }}
                    />
                  )}
                  <span className="flex-1">{item.name}</span>
                  {/* Subtle color indicator */}
                  <span
                    className="w-1.5 h-1.5 rounded-full opacity-60"
                    style={{ backgroundColor: color }}
                  />
                </button>
              );
            })
          ) : (
            <div className="px-4 py-3 text-neutral-500 text-sm">
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
            className="w-full px-4 py-2.5 text-left text-primary-400 hover:bg-neutral-800 transition-colors flex items-center gap-2 border-t border-neutral-700 mt-1"
          >
            <Plus className="h-4 w-4" />
            Create New {type === 'technology' ? 'Technology' : 'Tag'}
            {searchTerm && ` "${searchTerm}"`}
          </button>
        </>
      )}
    </div>,
    document.body
  ) : null;

  // Create modal rendered via portal
  const createModal = showCreateForm ? createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowCreateForm(false)}
      />

      {/* Modal */}
      <div ref={modalRef} className="relative w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/20">
              <Sparkles className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-100">
                New {type === 'technology' ? 'Technology' : 'Tag'}
              </h3>
              <p className="text-sm text-neutral-500">
                {type === 'technology' ? 'Add a new technology to your project' : 'Create a new tag'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm(false)}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview */}
        {type === 'technology' && (newItemName || newItemIcon) && (
          <div className="px-6 py-4 border-b border-neutral-700 bg-neutral-800/30">
            <p className="text-xs text-neutral-500 mb-3 uppercase tracking-wider">Preview</p>
            <div className="flex justify-center">
              <span
                className="inline-flex items-center gap-2 pl-3 pr-4 py-2 rounded-full text-sm font-medium"
                style={{
                  background: `linear-gradient(135deg, ${newItemColor}25 0%, ${newItemColor}15 100%)`,
                  boxShadow: `0 0 20px ${newItemColor}20, inset 0 1px 0 ${newItemColor}30`,
                  border: `1px solid ${newItemColor}50`,
                }}
              >
                {newItemIcon ? (
                  <span className="text-base leading-none">{newItemIcon}</span>
                ) : (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: newItemColor,
                      boxShadow: `0 0 8px ${newItemColor}80`,
                    }}
                  />
                )}
                <span style={{ color: newItemColor }}>
                  {newItemName || 'Technology Name'}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="px-6 py-5 space-y-5">
          {/* Name Input */}
          <div>
            <label htmlFor="create-name" className="block text-sm font-medium text-neutral-300 mb-2">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              id="create-name"
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={type === 'technology' ? 'e.g., React, Vue, Python' : 'Tag name'}
              className="w-full px-4 py-2.5 rounded-lg bg-neutral-800/50 border border-neutral-700 text-neutral-200 placeholder-neutral-500 focus-ring transition-colors hover:border-neutral-600"
              autoFocus
            />
          </div>

          {type === 'technology' && (
            <>
              {/* Icon Input with Suggestions */}
              <div>
                <label htmlFor="create-icon" className="block text-sm font-medium text-neutral-300 mb-2">
                  Icon (emoji)
                </label>
                <input
                  id="create-icon"
                  type="text"
                  value={newItemIcon}
                  onChange={(e) => setNewItemIcon(e.target.value)}
                  placeholder="Click a suggestion or type an emoji"
                  className="w-full px-4 py-2.5 rounded-lg bg-neutral-800/50 border border-neutral-700 text-neutral-200 placeholder-neutral-500 focus-ring transition-colors hover:border-neutral-600 mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {EMOJI_SUGGESTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewItemIcon(emoji)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                        newItemIcon === emoji
                          ? 'bg-primary-500/30 ring-2 ring-primary-500'
                          : 'bg-neutral-800 hover:bg-neutral-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Input with Presets */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  <Palette className="w-4 h-4 inline mr-1.5" />
                  Color
                </label>
                <div className="flex gap-3 mb-3">
                  <input
                    type="color"
                    value={newItemColor}
                    onChange={(e) => setNewItemColor(e.target.value)}
                    className="w-12 h-10 rounded-lg border border-neutral-700 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={newItemColor}
                    onChange={(e) => setNewItemColor(e.target.value)}
                    placeholder="#3d7eff"
                    className="flex-1 px-4 py-2 rounded-lg bg-neutral-800/50 border border-neutral-700 text-neutral-200 placeholder-neutral-500 focus-ring font-mono text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map(({ color, name }) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewItemColor(color)}
                      className={`group relative w-8 h-8 rounded-full transition-all hover:scale-110 ${
                        newItemColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      title={name}
                    >
                      {newItemColor === color && (
                        <span className="absolute inset-0 flex items-center justify-center text-white text-xs">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {type === 'tag' && newItemName && (
            <div className="px-4 py-3 rounded-lg bg-neutral-800/50 border border-neutral-700">
              <p className="text-xs text-neutral-500 mb-1">Generated slug</p>
              <p className="text-sm text-neutral-300 font-mono">{generateSlug(newItemName)}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-neutral-700 bg-neutral-800/30">
          <button
            type="button"
            onClick={() => setShowCreateForm(false)}
            className="flex-1 px-4 py-2.5 rounded-lg bg-neutral-700/50 text-neutral-300 hover:bg-neutral-700 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!newItemName.trim() || createMutation.isPending}
            className="flex-1 px-4 py-2.5 rounded-lg bg-primary-600 text-white hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create {type === 'technology' ? 'Technology' : 'Tag'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {/* Label */}
      <label className="block text-sm font-medium text-neutral-300">
        {label}
      </label>

      {/* Selected Items - Modern Chips */}
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {selectedItems.map((item) => {
          const color = getItemColor(item) || '#3d7eff';
          const icon = getItemIcon(item);
          return (
            <span
              key={item.id}
              className="group relative inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 cursor-default"
              style={{
                background: `linear-gradient(135deg, ${color}25 0%, ${color}15 100%)`,
                boxShadow: `0 0 20px ${color}20, inset 0 1px 0 ${color}30`,
                border: `1px solid ${color}50`,
              }}
            >
              {/* Glow effect on hover */}
              <span
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{
                  boxShadow: `0 0 25px ${color}40`,
                }}
              />

              {/* Icon or color dot */}
              {icon ? (
                <span className="text-base leading-none relative z-10">{icon}</span>
              ) : (
                <span
                  className="w-2 h-2 rounded-full relative z-10"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}80`,
                  }}
                />
              )}

              {/* Name */}
              <span
                className="relative z-10"
                style={{ color }}
              >
                {item.name}
              </span>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="relative z-10 ml-0.5 rounded-full p-1 transition-all duration-200 hover:bg-white/20"
                style={{ color }}
                aria-label={`Remove ${item.name}`}
              >
                <X className="h-3.5 w-3.5" />
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
          onFocus={handleOpen}
          placeholder={`Search ${type === 'technology' ? 'technologies' : 'tags'}...`}
          className="w-full px-4 py-2 pr-10 rounded-lg bg-neutral-800/50 border border-neutral-700 text-neutral-200 placeholder-neutral-500 focus-ring transition-colors hover:border-neutral-600"
        />
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Dropdown via portal */}
      {dropdownPopup}

      {/* Create modal via portal */}
      {createModal}
    </div>
  );
}
