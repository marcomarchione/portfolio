/**
 * FormField Component
 *
 * Wrapper component for form inputs with label and error display.
 * Provides consistent styling and accessibility for form fields.
 */
import type { ReactNode } from 'react';

export interface FormFieldProps {
  /** Label text for the field */
  label: string;
  /** HTML ID for the input element */
  htmlFor?: string;
  /** Error message to display */
  error?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Help text displayed below the input */
  helpText?: string;
  /** Additional CSS classes */
  className?: string;
  /** Child input element(s) */
  children: ReactNode;
}

/**
 * Form field wrapper with label and error handling.
 */
export function FormField({
  label,
  htmlFor,
  error,
  required = false,
  helpText,
  className = '',
  children,
}: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-neutral-300"
      >
        {label}
        {required && (
          <span className="text-red-400 ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {helpText && !error && (
        <p className="text-xs text-neutral-500">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default FormField;
