/**
 * FilterBar Component
 *
 * Search and filter controls for content lists.
 * Uses custom dropdowns matching the design system.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Filter, ArrowUpDown, X, ChevronDown, Check } from 'lucide-react';
import type { ContentStatus } from '@marcomarchione/shared';

export type SortField = 'title' | 'createdAt' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

interface FilterBarProps {
  /** Current search term */
  search: string;
  /** Callback when search changes */
  onSearchChange: (value: string) => void;
  /** Current status filter */
  status?: ContentStatus;
  /** Callback when status filter changes */
  onStatusChange: (status: ContentStatus | undefined) => void;
  /** Current sort field */
  sortBy: SortField;
  /** Callback when sort field changes */
  onSortByChange: (field: SortField) => void;
  /** Current sort order */
  sortOrder: SortOrder;
  /** Callback when sort order changes */
  onSortOrderChange: (order: SortOrder) => void;
}

const STATUS_OPTIONS: Array<{ value: ContentStatus | ''; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const SORT_OPTIONS: Array<{ value: SortField; label: string }> = [
  { value: 'updatedAt', label: 'Updated' },
  { value: 'createdAt', label: 'Created' },
  { value: 'title', label: 'Title' },
];

interface DropdownProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  icon?: React.ReactNode;
  placeholder?: string;
  ariaLabel: string;
}

/**
 * Custom dropdown component with portal for z-index layering.
 */
function Dropdown<T extends string>({
  value,
  onChange,
  options,
  icon,
  placeholder,
  ariaLabel,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Calculate popup position
  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopupPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 150),
      });
    }
  }, []);

  // Update position on scroll/resize
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        popupRef.current && !popupRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          onChange(options[focusedIndex].value);
          setIsOpen(false);
        } else {
          setIsOpen(!isOpen);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex((prev) => Math.min(prev + 1, options.length - 1));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const handleOptionClick = (optionValue: T) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const toggleOpen = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
    if (!isOpen) {
      const currentIndex = options.findIndex((opt) => opt.value === value);
      setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  };

  // Dropdown menu rendered via portal
  const dropdownMenu = isOpen ? createPortal(
    <ul
      ref={popupRef}
      role="listbox"
      className="
        fixed py-1 rounded-lg
        bg-neutral-900 border border-neutral-700
        shadow-xl shadow-black/20
        max-h-60 overflow-auto
      "
      style={{
        top: popupPosition.top,
        left: popupPosition.left,
        width: popupPosition.width,
        zIndex: 99999,
      }}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        const isFocused = index === focusedIndex;

        return (
          <li
            key={option.value}
            role="option"
            aria-selected={isSelected}
            onClick={() => handleOptionClick(option.value)}
            onMouseEnter={() => setFocusedIndex(index)}
            className={`
              px-4 py-2 cursor-pointer flex items-center justify-between
              transition-colors text-sm
              ${isSelected
                ? 'bg-primary-500/20 text-primary-300'
                : isFocused
                  ? 'bg-neutral-800 text-neutral-200'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }
            `}
          >
            <span>{option.label}</span>
            {isSelected && (
              <Check className="w-4 h-4 text-primary-400" />
            )}
          </li>
        );
      })}
    </ul>,
    document.body
  ) : null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer
          bg-neutral-800/50 border text-neutral-200
          transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset
          border-neutral-700 hover:border-neutral-600
          ${icon ? 'pl-10' : ''}
        `}
      >
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
            {icon}
          </span>
        )}
        <span className="text-sm">{selectedOption?.label || placeholder}</span>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {dropdownMenu}
    </div>
  );
}

/**
 * Filter bar with search, status filter, and sort controls.
 */
export function FilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: FilterBarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleClearSearch = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  const toggleSortOrder = useCallback(() => {
    onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
  }, [sortOrder, onSortOrderChange]);

  const handleStatusChange = useCallback((value: ContentStatus | '') => {
    onStatusChange(value === '' ? undefined : value);
  }, [onStatusChange]);

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search input */}
      <div className="relative flex-1">
        <Search
          className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
            isSearchFocused ? 'text-primary-400' : 'text-neutral-500'
          }`}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          placeholder="Search by title..."
          className="w-full pl-10 pr-10 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-neutral-500 hover:text-neutral-300 hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Status filter dropdown */}
      <Dropdown<ContentStatus | ''>
        value={status ?? ''}
        onChange={handleStatusChange}
        options={STATUS_OPTIONS}
        icon={<Filter className="w-4 h-4" />}
        ariaLabel="Filter by status"
      />

      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <Dropdown<SortField>
          value={sortBy}
          onChange={onSortByChange}
          options={SORT_OPTIONS}
          ariaLabel="Sort by field"
        />
        <button
          type="button"
          onClick={toggleSortOrder}
          className="p-2.5 bg-neutral-800/50 border border-neutral-700 rounded-lg text-neutral-400 hover:text-neutral-100 hover:border-neutral-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset"
          title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        >
          <ArrowUpDown className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
}

export default FilterBar;
