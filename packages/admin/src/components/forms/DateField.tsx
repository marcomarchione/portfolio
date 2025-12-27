/**
 * DateField Component
 *
 * Fully custom date picker that matches the glass-card design system.
 * Uses React Portal for proper z-index layering.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';

export interface DateFieldProps {
  /** Label text for the field */
  label: string;
  /** Current date value (ISO string or null) */
  value: string | null;
  /** Change handler */
  onChange: (value: string | null) => void;
  /** HTML ID for the field */
  id?: string;
  /** Error message to display */
  error?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Placeholder text when no date selected */
  placeholder?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Help text displayed below the field */
  helpText?: string;
  /** Additional CSS classes for the container */
  className?: string;
  /** Icon to display on the left side */
  icon?: ReactNode;
  /** Minimum selectable date (ISO string) */
  minDate?: string;
  /** Maximum selectable date (ISO string) */
  maxDate?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function parseDate(isoString: string | null): Date | null {
  if (!isoString) return null;
  const date = new Date(isoString);
  return isNaN(date.getTime()) ? null : date;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Custom date field with glass-card design system styling.
 */
export function DateField({
  label,
  value,
  onChange,
  id = 'date',
  error,
  disabled = false,
  placeholder = 'dd/mm/yyyy',
  required = false,
  helpText,
  className = '',
  icon,
  minDate,
  maxDate,
}: DateFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const hasError = Boolean(error);

  const selectedDate = parseDate(value);
  const minDateParsed = parseDate(minDate || null);
  const maxDateParsed = parseDate(maxDate || null);

  const today = new Date();
  const [viewYear, setViewYear] = useState(selectedDate?.getFullYear() || today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate?.getMonth() || today.getMonth());

  // Update view when value changes externally
  useEffect(() => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  }, [value]);

  // Calculate popup position when opening
  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popupHeight = 380; // Approximate height of calendar popup
      const viewportHeight = window.innerHeight;

      // Check if there's enough space below
      const spaceBelow = viewportHeight - rect.bottom;
      const showAbove = spaceBelow < popupHeight && rect.top > popupHeight;

      setPopupPosition({
        top: showAbove ? rect.top - popupHeight - 4 : rect.bottom + 4,
        left: rect.left,
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

  // Close on click outside
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

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day, 12, 0, 0);
    onChange(newDate.toISOString());
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const isDayDisabled = (day: number): boolean => {
    const date = new Date(viewYear, viewMonth, day);
    if (minDateParsed && date < minDateParsed) return true;
    if (maxDateParsed && date > maxDateParsed) return true;
    return false;
  };

  const toggleCalendar = () => {
    if (!disabled) {
      if (!isOpen) {
        updatePosition();
      }
      setIsOpen(!isOpen);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        toggleCalendar();
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const calendarDays: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Calendar popup rendered via portal
  const calendarPopup = isOpen ? createPortal(
    <div
      ref={popupRef}
      role="dialog"
      aria-modal="true"
      aria-label="Choose date"
      className="fixed p-4 rounded-lg bg-neutral-900 border border-neutral-700 shadow-2xl shadow-black/50 w-72"
      style={{
        top: popupPosition.top,
        left: popupPosition.left,
        zIndex: 99999,
      }}
    >
      {/* Month/Year header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPrevMonth}
          className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="font-medium text-neutral-200">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>

        <button
          type="button"
          onClick={goToNextMonth}
          className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_NAMES.map((dayName) => (
          <div
            key={dayName}
            className="text-center text-xs font-medium text-neutral-500 py-1"
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="p-2" />;
          }

          const isSelected = selectedDate && isSameDay(
            selectedDate,
            new Date(viewYear, viewMonth, day)
          );
          const isToday = isSameDay(
            today,
            new Date(viewYear, viewMonth, day)
          );
          const isDisabled = isDayDisabled(day);

          return (
            <button
              key={day}
              type="button"
              onClick={() => !isDisabled && handleDayClick(day)}
              disabled={isDisabled}
              className={`
                p-2 text-sm rounded-lg transition-colors
                ${isDisabled
                  ? 'text-neutral-600 cursor-not-allowed'
                  : isSelected
                    ? 'bg-primary-500/20 text-primary-300 font-medium'
                    : isToday
                      ? 'bg-neutral-800 text-neutral-200 ring-1 ring-neutral-600'
                      : 'text-neutral-300 hover:bg-neutral-800 hover:text-neutral-200'
                }
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Today button */}
      <div className="mt-4 pt-4 border-t border-neutral-700">
        <button
          type="button"
          onClick={() => {
            const now = new Date();
            setViewYear(now.getFullYear());
            setViewMonth(now.getMonth());
            handleDayClick(now.getDate());
          }}
          className="w-full py-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
        >
          Today
        </button>
      </div>
    </div>,
    document.body
  ) : null;

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

      {/* Custom date picker */}
      <div className="relative">
        {/* Trigger button */}
        <button
          ref={buttonRef}
          type="button"
          id={id}
          onClick={toggleCalendar}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-invalid={hasError}
          aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
          className={`
            w-full px-4 py-2 rounded-lg cursor-pointer text-left
            bg-neutral-800/50 border text-neutral-200
            transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-between gap-2
            pl-10
            ${hasError
              ? 'border-red-500/50 focus-visible:ring-red-500'
              : 'border-neutral-700 focus-visible:ring-primary-500 hover:border-neutral-600'
            }
          `}
        >
          {/* Left icon */}
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
            {icon || <Calendar className="w-4 h-4" />}
          </span>

          {/* Selected value or placeholder */}
          <span className={selectedDate ? 'text-neutral-200' : 'text-neutral-500'}>
            {selectedDate ? formatDate(selectedDate) : placeholder}
          </span>

          {/* Clear button or calendar icon */}
          {selectedDate && !disabled ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-neutral-500 hover:text-neutral-300 transition-colors"
              aria-label="Clear date"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <Calendar className="w-4 h-4 text-neutral-400" />
          )}
        </button>

        {/* Calendar popup via portal */}
        {calendarPopup}
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

export default DateField;
