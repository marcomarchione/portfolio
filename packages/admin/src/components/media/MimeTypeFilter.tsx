/**
 * MIME Type Filter Component
 *
 * Custom dropdown filter for filtering media by MIME type category.
 * Uses React Portal for proper z-index layering.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Filter } from 'lucide-react';
import type { MimeTypeFilterValue } from '@/types/media';

interface MimeTypeFilterProps {
  /** Current filter value */
  value: MimeTypeFilterValue;
  /** Callback when filter changes */
  onChange: (value: MimeTypeFilterValue) => void;
}

const FILTER_OPTIONS: { value: MimeTypeFilterValue; label: string }[] = [
  { value: 'all', label: 'All Files' },
  { value: 'image', label: 'Images' },
  { value: 'document', label: 'Documents' },
];

/**
 * Custom MIME type filter dropdown component.
 */
export function MimeTypeFilter({ value, onChange }: MimeTypeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLUListElement>(null);

  // Find the currently selected option
  const selectedOption = FILTER_OPTIONS.find((opt) => opt.value === value);

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
          onChange(FILTER_OPTIONS[focusedIndex].value);
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
          setFocusedIndex((prev) => Math.min(prev + 1, FILTER_OPTIONS.length - 1));
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

  const handleOptionClick = (optionValue: MimeTypeFilterValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const toggleOpen = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
    if (!isOpen) {
      const currentIndex = FILTER_OPTIONS.findIndex((opt) => opt.value === value);
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
      "
      style={{
        top: popupPosition.top,
        left: popupPosition.left,
        width: popupPosition.width,
        zIndex: 99999,
      }}
    >
      {FILTER_OPTIONS.map((option, index) => {
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
    <div className="relative inline-block">
      {/* Trigger button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Filter by file type"
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer
          bg-neutral-800/50 border text-neutral-200
          transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset
          border-neutral-700 hover:border-neutral-600
        `}
      >
        <Filter className="w-4 h-4 text-neutral-400" />
        <span className="text-sm">{selectedOption?.label || 'All Files'}</span>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown menu via portal */}
      {dropdownMenu}
    </div>
  );
}

/**
 * Converts filter value to API MIME type filter string.
 */
export function getApiMimeType(filter: MimeTypeFilterValue): string | undefined {
  switch (filter) {
    case 'image':
      return 'image/';
    case 'document':
      return 'application/pdf';
    default:
      return undefined;
  }
}

export default MimeTypeFilter;
