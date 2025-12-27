/**
 * SelectField Component
 *
 * Custom styled dropdown that matches the glass-card design system.
 * Replaces native select elements with consistent dark theme styling.
 */
import { ChevronDown, AlertCircle } from 'lucide-react';
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
 */
export function SelectField({
  label,
  options,
  value,
  onChange,
  id = 'select',
  error,
  disabled = false,
  placeholder,
  required = false,
  helpText,
  className = '',
  icon,
}: SelectFieldProps) {
  const hasError = Boolean(error);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
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

      {/* Select wrapper */}
      <div className="relative">
        {/* Left icon */}
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
            {icon}
          </span>
        )}

        {/* Custom styled select */}
        <select
          id={id}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
          className={`
            w-full px-4 py-2 rounded-lg appearance-none cursor-pointer
            bg-neutral-800/50 border text-neutral-200
            transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950
            disabled:opacity-50 disabled:cursor-not-allowed
            ${icon ? 'pl-10' : ''}
            pr-10
            ${hasError
              ? 'border-red-500/50 focus-visible:ring-red-500'
              : 'border-neutral-700 focus-visible:ring-primary-500 hover:border-neutral-600'
            }
          `}
        >
          {/* Placeholder option */}
          {placeholder && (
            <option value="" disabled className="text-neutral-500">
              {placeholder}
            </option>
          )}
          {/* Options */}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-neutral-900 text-neutral-200"
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom dropdown arrow */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
          <ChevronDown className="w-4 h-4" />
        </span>
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
