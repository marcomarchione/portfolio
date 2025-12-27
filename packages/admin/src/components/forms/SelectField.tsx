/**
 * SelectField Component
 *
 * Fully custom dropdown that matches the glass-card design system.
 * Uses div-based implementation for complete styling control.
 */
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, AlertCircle, Check } from 'lucide-react';
import type { ReactNode } from 'react';

/** Option type for select dropdown */
export interface SelectOption {
  /** The value stored when this option is selected */
  value: string;
  /** The display label shown to the user */
  label: string;
}

export interface SelectFieldProps {
  /** Label text for the field */
  label: string;
  /** Array of options with value and label */
  options: SelectOption[];
  /** Current selected value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** HTML ID for the select element */
  id?: string;
  /** Error message to display */
  error?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Placeholder text when no value selected */
  placeholder?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Help text displayed below the select */
  helpText?: string;
  /** Additional CSS classes for the container */
  className?: string;
  /** Icon to display on the left side */
  icon?: ReactNode;
}

/**
 * Custom select field with glass-card design system styling.
 * Fully custom implementation for complete styling control.
 */
export function SelectField({
  label,
  options,
  value,
  onChange,
  id = 'select',
  error,
  disabled = false,
  placeholder = 'Select an option',
  required = false,
  helpText,
  className = '',
  icon,
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const hasError = Boolean(error);

  // Find the currently selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

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

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const toggleOpen = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        const currentIndex = options.findIndex((opt) => opt.value === value);
        setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
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
        {required && (
          <span className="text-red-400 ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {/* Custom select */}
      <div className="relative">
        {/* Trigger button */}
        <button
          type="button"
          id={id}
          onClick={toggleOpen}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={hasError}
          aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
          className={`
            w-full px-4 py-2 rounded-lg cursor-pointer text-left
            bg-neutral-800/50 border text-neutral-200
            transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-between gap-2
            ${icon ? 'pl-10' : ''}
            ${hasError
              ? 'border-red-500/50 focus-visible:ring-red-500'
              : 'border-neutral-700 focus-visible:ring-primary-500 hover:border-neutral-600'
            }
          `}
        >
          {/* Left icon */}
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
              {icon}
            </span>
          )}

          {/* Selected value or placeholder */}
          <span className={selectedOption ? 'text-neutral-200' : 'text-neutral-500'}>
            {selectedOption?.label || placeholder}
          </span>

          {/* Dropdown arrow */}
          <ChevronDown
            className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <ul
            ref={listRef}
            role="listbox"
            aria-labelledby={id}
            className="
              absolute z-50 w-full mt-1 py-1 rounded-lg
              bg-neutral-900 border border-neutral-700
              shadow-xl shadow-black/20
              max-h-60 overflow-auto
            "
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
                    transition-colors
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
          </ul>
        )}
      </div>

      {/* Help text */}
      {helpText && !error && (
        <p id={`${id}-help`} className="text-xs text-neutral-500">
          {helpText}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-400 flex items-center gap-1" role="alert">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

export default SelectField;
