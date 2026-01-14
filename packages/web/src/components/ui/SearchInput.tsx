/**
 * SearchInput Component
 *
 * Debounced search input with clear button.
 * Used for filtering materials and other searchable content.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps {
  /** Current controlled value */
  value: string;
  /** Callback when value changes (debounced) */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Accessible label for screen readers */
  ariaLabel?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  ariaLabel = 'Search',
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(value);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  // Sync internal value when external value changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Debounced onChange callback
  useEffect(() => {
    // Skip debounce on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      if (internalValue !== value) {
        onChange(internalValue);
      }
    }, debounceMs);

    // Cleanup on unmount or value change
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [internalValue, debounceMs, onChange, value]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
    },
    []
  );

  const handleClear = useCallback(() => {
    setInternalValue('');
    // Immediately call onChange for clear action (no debounce)
    onChange('');
  }, [onChange]);

  return (
    <div className="relative">
      {/* Search Icon */}
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 [.light_&]:text-neutral-500 pointer-events-none"
        aria-hidden="true"
      />

      {/* Input */}
      <input
        type="text"
        data-testid="search-input"
        value={internalValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-full pl-10 pr-10 py-2 rounded-lg text-sm text-neutral-300 bg-neutral-800/50 border border-neutral-700 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-colors [.light_&]:bg-white [.light_&]:border-neutral-200 [.light_&]:text-neutral-900 [.light_&]:placeholder-neutral-400 [.light_&]:focus:ring-terra-500/50 [.light_&]:focus:border-terra-500"
      />

      {/* Clear Button */}
      {internalValue && (
        <button
          type="button"
          data-testid="search-clear"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 transition-colors [.light_&]:text-neutral-500 [.light_&]:hover:text-neutral-700"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
