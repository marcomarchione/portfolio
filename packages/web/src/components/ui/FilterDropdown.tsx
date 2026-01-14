/**
 * FilterDropdown Component
 *
 * Reusable dropdown component for filters, matching LanguageSwitcher style.
 * Used for status filter, sort filter, and similar use cases.
 */
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDropdownProps {
  /** Label shown before the dropdown */
  label: string;
  /** List of available options */
  options: FilterOption[];
  /** Currently selected value */
  value: string;
  /** Callback when selection changes */
  onChange: (value: string) => void;
  /** Accessible label for screen readers */
  ariaLabel?: string;
}

export function FilterDropdown({
  label,
  options,
  value,
  onChange,
  ariaLabel,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Find current option label
  const currentOption = options.find((opt) => opt.value === value);
  const displayLabel = currentOption?.label || options[0]?.label || '';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSelect = (newValue: string) => {
    setIsOpen(false);
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, optionValue: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect(optionValue);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-neutral-400 [.light_&]:text-neutral-600">
        {label}:
      </span>
      <div ref={containerRef} className="relative">
        <button
          ref={buttonRef}
          type="button"
          data-testid="sort-dropdown"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-300 bg-neutral-800/50 border border-neutral-700 hover:bg-neutral-700/50 hover:text-white transition-colors [.light_&]:bg-white [.light_&]:border-neutral-200 [.light_&]:text-neutral-700 [.light_&]:hover:bg-cream-100 [.light_&]:hover:border-neutral-300 min-w-[140px] justify-between"
          aria-label={ariaLabel || label}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="text-sm">{displayLabel}</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div
            className="absolute left-0 mt-2 w-full min-w-[160px] bg-neutral-800/95 backdrop-blur-sm border border-neutral-700 rounded-lg shadow-lg overflow-hidden z-50 [.light_&]:bg-white [.light_&]:border-neutral-200"
            role="listbox"
            aria-label={ariaLabel || label}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => handleSelect(option.value)}
                onKeyDown={(e) => handleKeyDown(e, option.value)}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  option.value === value
                    ? 'bg-primary-500/20 text-primary-300 [.light_&]:bg-cream-200 [.light_&]:text-cream-600'
                    : 'text-neutral-300 hover:bg-white/5 hover:text-white [.light_&]:text-neutral-700 [.light_&]:hover:bg-cream-100 [.light_&]:hover:text-neutral-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FilterDropdown;
