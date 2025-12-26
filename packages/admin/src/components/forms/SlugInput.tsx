/**
 * SlugInput Component
 *
 * Input field for content slugs with real-time validation indicator.
 * Shows valid/invalid state based on slug pattern requirements.
 */
import { useMemo } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { validateSlug } from '@/lib/validation/content';

export interface SlugInputProps {
  /** Current slug value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Error message from form validation */
  error?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** HTML ID for the input */
  id?: string;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Slug input with validation indicator.
 */
export function SlugInput({
  value,
  onChange,
  error,
  disabled = false,
  id = 'slug',
  placeholder = 'my-content-slug',
}: SlugInputProps) {
  // Validate slug on each change
  const validation = useMemo(() => {
    if (!value) return { valid: false, showIndicator: false };
    const result = validateSlug(value);
    return { valid: result.valid, showIndicator: true, error: result.error };
  }, [value]);

  // Handle input change - auto-format to lowercase and replace spaces
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    onChange(newValue);
  };

  const hasError = Boolean(error) || (validation.showIndicator && !validation.valid);
  const isValid = validation.showIndicator && validation.valid;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-neutral-300"
      >
        Slug
        <span className="text-red-400 ml-0.5" aria-hidden="true">
          *
        </span>
      </label>
      <div className="relative">
        <input
          type="text"
          id={id}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={hasError}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`
            w-full px-4 py-2 pr-10 rounded-lg
            bg-neutral-800/50 border text-neutral-200 placeholder-neutral-500
            transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950
            disabled:opacity-50 disabled:cursor-not-allowed
            ${hasError
              ? 'border-red-500/50 focus-visible:ring-red-500'
              : isValid
                ? 'border-green-500/50 focus-visible:ring-green-500'
                : 'border-neutral-700 focus-visible:ring-primary-500'
            }
          `}
        />
        {/* Validation indicator */}
        {validation.showIndicator && (
          <span
            className={`absolute right-3 top-1/2 -translate-y-1/2 ${
              isValid ? 'text-green-400' : 'text-red-400'
            }`}
            aria-hidden="true"
          >
            {isValid ? (
              <Check className="w-4 h-4" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </span>
        )}
      </div>
      {/* Error message */}
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-400 flex items-center gap-1" role="alert">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      {/* Help text */}
      {!error && (
        <p className="text-xs text-neutral-500">
          Only lowercase letters, numbers, and hyphens. Example: my-project-name
        </p>
      )}
    </div>
  );
}

export default SlugInput;
