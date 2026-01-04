/**
 * IconPicker Component
 *
 * A searchable icon picker that uses simple-icons library.
 * Displays icons in a virtualized grid for performance with 3000+ icons.
 * Uses React Portal for proper z-index layering.
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, AlertCircle, Grid3X3 } from 'lucide-react';
import { searchIcons, getIconBySlug, type IconMeta } from '../../lib/icons';

export interface IconPickerProps {
  /** Label text for the field */
  label: string;
  /** Current selected icon slug */
  value: string | null;
  /** Change handler */
  onChange: (value: string | null) => void;
  /** HTML ID for the input element */
  id?: string;
  /** Error message to display */
  error?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Help text displayed below the input */
  helpText?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Icon picker with search and virtualized grid display.
 */
export function IconPicker({
  label,
  value,
  onChange,
  id = 'icon-picker',
  error,
  disabled = false,
  placeholder = 'Search icons...',
  helpText,
  className = '',
}: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasError = Boolean(error);

  // Get the currently selected icon
  const selectedIcon = value ? getIconBySlug(value) : null;

  // Filter icons based on search query with memoization
  const filteredIcons = useMemo(() => {
    return searchIcons(searchQuery, 150);
  }, [searchQuery]);

  // Calculate popup position
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popupHeight = 400;
      const viewportHeight = window.innerHeight;

      const spaceBelow = viewportHeight - rect.bottom;
      const showAbove = spaceBelow < popupHeight && rect.top > popupHeight;

      setPopupPosition({
        top: showAbove ? rect.top - popupHeight - 4 : rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 320),
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popupRef.current &&
        !popupRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleIconSelect = (icon: IconMeta) => {
    onChange(icon.slug);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange(null);
  };

  const toggleOpen = () => {
    if (!disabled) {
      if (!isOpen) {
        updatePosition();
      }
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`} ref={containerRef}>
      {/* Label */}
      <label
        htmlFor={id}
        className="block text-sm font-medium text-neutral-300"
      >
        {label}
      </label>

      {/* Trigger button with clear action */}
      <div className="relative flex items-center gap-2">
        <button
          ref={triggerRef}
          type="button"
          id={id}
          onClick={toggleOpen}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-invalid={hasError}
          className={`
            flex-1 px-4 py-2 rounded-lg cursor-pointer text-left
            bg-neutral-800/50 border text-neutral-200
            transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center gap-3
            ${hasError
              ? 'border-red-500/50 focus-visible:ring-red-500'
              : 'border-neutral-700 focus-visible:ring-primary-500 hover:border-neutral-600'
            }
          `}
        >
          {/* Icon preview */}
          {selectedIcon ? (
            <div
              className="w-6 h-6 flex-shrink-0"
              dangerouslySetInnerHTML={{
                __html: `<svg role="img" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="${selectedIcon.path}"/></svg>`,
              }}
            />
          ) : (
            <Grid3X3 className="w-6 h-6 text-neutral-500 flex-shrink-0" />
          )}

          {/* Selected value or placeholder */}
          <span className={`flex-1 ${selectedIcon ? 'text-neutral-200' : 'text-neutral-500'}`}>
            {selectedIcon?.title || placeholder}
          </span>
        </button>

        {/* Clear button - outside the main button to avoid nesting */}
        {selectedIcon && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-2 rounded-lg border border-neutral-700 hover:bg-neutral-700 transition-colors"
            aria-label="Clear icon"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        )}
      </div>

      {/* Popup via portal */}
      {isOpen &&
        createPortal(
          <div
            ref={popupRef}
            role="dialog"
            aria-labelledby={`${id}-dialog-title`}
            className="fixed rounded-lg bg-neutral-900 border border-neutral-700 shadow-2xl shadow-black/50 overflow-hidden"
            style={{
              top: popupPosition.top,
              left: popupPosition.left,
              width: popupPosition.width,
              maxHeight: 400,
              zIndex: 200000,
            }}
            onKeyDown={handleKeyDown}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="p-3 border-b border-neutral-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search icons..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-neutral-800 border border-neutral-600 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            {/* Icons grid */}
            <div className="p-3 overflow-y-auto" style={{ maxHeight: 320 }}>
              {filteredIcons.length === 0 ? (
                <div className="text-center text-neutral-500 py-8">
                  No icons found for "{searchQuery}"
                </div>
              ) : (
                <div className="grid grid-cols-6 gap-1">
                  {filteredIcons.map((icon) => (
                    <button
                      key={icon.slug}
                      type="button"
                      onClick={() => handleIconSelect(icon)}
                      title={icon.title}
                      className={`
                        p-2 rounded-lg transition-colors flex items-center justify-center
                        ${icon.slug === value
                          ? 'bg-primary-500/20 text-primary-300 ring-1 ring-primary-500'
                          : 'hover:bg-neutral-800 text-neutral-300'
                        }
                      `}
                    >
                      <div
                        className="w-6 h-6"
                        dangerouslySetInnerHTML={{
                          __html: `<svg role="img" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="${icon.path}"/></svg>`,
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with count */}
            <div className="px-3 py-2 border-t border-neutral-700 text-xs text-neutral-500">
              {filteredIcons.length} icons shown
              {searchQuery && ` for "${searchQuery}"`}
            </div>
          </div>,
          document.body
        )}

      {/* Help text */}
      {helpText && !error && (
        <p className="text-xs text-neutral-500">{helpText}</p>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1" role="alert">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

export default IconPicker;
