/**
 * ToggleField Component
 *
 * Toggle switch field for boolean values like featured checkbox.
 * Provides accessible toggle with label and description.
 */

export interface ToggleFieldProps {
  /** Current checked state */
  checked: boolean;
  /** Change handler */
  onChange: (checked: boolean) => void;
  /** Label text */
  label: string;
  /** Optional description text */
  description?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** HTML ID for the input */
  id?: string;
}

/**
 * Toggle switch with label and description.
 */
export function ToggleField({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id = 'toggle',
}: ToggleFieldProps) {
  const handleChange = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleChange();
    }
  };

  return (
    <div className="flex items-start gap-3">
      {/* Toggle switch */}
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        disabled={disabled}
        onClick={handleChange}
        onKeyDown={handleKeyDown}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
          border-2 border-transparent transition-colors duration-200 ease-in-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950
          disabled:opacity-50 disabled:cursor-not-allowed
          ${checked ? 'bg-primary-500' : 'bg-neutral-700'}
        `}
      >
        <span
          aria-hidden="true"
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full
            bg-white shadow-lg ring-0 transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>

      {/* Label and description */}
      <div className="flex-1">
        <label
          id={`${id}-label`}
          htmlFor={id}
          className={`text-sm font-medium ${
            disabled ? 'text-neutral-500' : 'text-neutral-200'
          } cursor-pointer`}
        >
          {label}
        </label>
        {description && (
          <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

export default ToggleField;
