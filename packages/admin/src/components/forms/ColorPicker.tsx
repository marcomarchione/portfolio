/**
 * ColorPicker Component
 *
 * A hex color picker with text input and color swatch preview.
 * Includes a "pick from icon" feature for simple-icons brand colors.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Pipette, X } from 'lucide-react';
import { getIconBySlug } from '../../lib/icons';

export interface ColorPickerProps {
  /** Label text for the field */
  label: string;
  /** Current color value (hex without #) */
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
  /** Icon slug to get brand color from */
  iconSlug?: string | null;
}

/** Predefined color palette */
const PRESET_COLORS = [
  'EF4444', // red
  'F97316', // orange
  'F59E0B', // amber
  'EAB308', // yellow
  '84CC16', // lime
  '22C55E', // green
  '10B981', // emerald
  '14B8A6', // teal
  '06B6D4', // cyan
  '0EA5E9', // sky
  '3B82F6', // blue
  '6366F1', // indigo
  '8B5CF6', // violet
  'A855F7', // purple
  'D946EF', // fuchsia
  'EC4899', // pink
  'F43F5E', // rose
  '000000', // black
  '4B5563', // gray
  'FFFFFF', // white
];

/**
 * Validates a hex color string (without #).
 */
function isValidHex(hex: string): boolean {
  return /^[0-9A-Fa-f]{6}$/.test(hex);
}

/**
 * Color picker with hex input and swatch display.
 */
export function ColorPicker({
  label,
  value,
  onChange,
  id = 'color-picker',
  error,
  disabled = false,
  placeholder = 'Enter hex color',
  helpText,
  className = '',
  iconSlug,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value ?? '');
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const hasError = Boolean(error);

  // Get brand color from icon if available
  const iconBrandColor = iconSlug ? getIconBySlug(iconSlug)?.hex : null;

  // Sync input value with prop value
  useEffect(() => {
    setInputValue(value ?? '');
  }, [value]);

  // Calculate popup position
  const updatePosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const popupHeight = 200;
      const viewportHeight = window.innerHeight;

      const spaceBelow = viewportHeight - rect.bottom;
      const showAbove = spaceBelow < popupHeight && rect.top > popupHeight;

      setPopupPosition({
        top: showAbove ? rect.top - popupHeight - 4 : rect.bottom + 4,
        left: rect.left,
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

  // Close popup when clicking outside
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove # if typed
    let newValue = e.target.value.replace(/^#/, '').toUpperCase();
    // Only allow hex characters
    newValue = newValue.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
    setInputValue(newValue);

    if (newValue === '') {
      onChange(null);
    } else if (isValidHex(newValue)) {
      onChange(newValue);
    }
  };

  const handleInputBlur = () => {
    // Validate on blur
    if (inputValue && !isValidHex(inputValue)) {
      setInputValue(value ?? '');
    }
  };

  const handleColorSelect = (color: string) => {
    setInputValue(color);
    onChange(color);
    setIsOpen(false);
  };

  const handlePickFromIcon = () => {
    if (iconBrandColor) {
      setInputValue(iconBrandColor);
      onChange(iconBrandColor);
    }
  };

  const handleClear = () => {
    setInputValue('');
    onChange(null);
  };

  const handleFocus = () => {
    if (!disabled) {
      updatePosition();
      setIsOpen(true);
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

      {/* Input with color swatch */}
      <div className="relative flex items-center gap-2">
        {/* Color swatch */}
        <div
          className="w-10 h-10 rounded-lg border border-neutral-700 flex-shrink-0 cursor-pointer"
          style={{
            backgroundColor: value && isValidHex(value) ? `#${value}` : 'transparent',
          }}
          onClick={handleFocus}
        >
          {(!value || !isValidHex(value)) && (
            <div className="w-full h-full flex items-center justify-center text-neutral-500">
              <span className="text-xs">#</span>
            </div>
          )}
        </div>

        {/* Text input */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">#</span>
          <input
            ref={inputRef}
            type="text"
            id={id}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={handleFocus}
            disabled={disabled}
            placeholder={placeholder}
            maxLength={6}
            aria-invalid={hasError}
            className={`
              w-full pl-7 pr-10 py-2 rounded-lg
              bg-neutral-800/50 border text-neutral-200 placeholder-neutral-500
              transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-950
              disabled:opacity-50 disabled:cursor-not-allowed
              uppercase font-mono
              ${hasError
                ? 'border-red-500/50 focus:ring-red-500'
                : 'border-neutral-700 focus:ring-primary-500 hover:border-neutral-600'
              }
            `}
          />

          {/* Clear button */}
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-700 rounded transition-colors"
              aria-label="Clear color"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>
          )}
        </div>

        {/* Pick from icon button */}
        {iconBrandColor && (
          <button
            type="button"
            onClick={handlePickFromIcon}
            disabled={disabled}
            title={`Use icon color: #${iconBrandColor}`}
            className="p-2 rounded-lg border border-neutral-700 hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Pipette className="w-4 h-4 text-neutral-400" />
            <div
              className="w-4 h-4 rounded border border-neutral-600"
              style={{ backgroundColor: `#${iconBrandColor}` }}
            />
          </button>
        )}
      </div>

      {/* Color palette popup via portal */}
      {isOpen &&
        createPortal(
          <div
            ref={popupRef}
            className="fixed rounded-lg bg-neutral-900 border border-neutral-700 shadow-2xl shadow-black/50 p-3"
            style={{
              top: popupPosition.top,
              left: popupPosition.left,
              width: 280,
              zIndex: 200000,
            }}
          >
            <div className="text-xs text-neutral-500 mb-2">Preset Colors</div>
            <div className="grid grid-cols-10 gap-1">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  title={`#${color}`}
                  className={`
                    w-6 h-6 rounded transition-transform hover:scale-110
                    ${color === value ? 'ring-2 ring-primary-500 ring-offset-1 ring-offset-neutral-900' : ''}
                    ${color === 'FFFFFF' ? 'border border-neutral-600' : ''}
                  `}
                  style={{ backgroundColor: `#${color}` }}
                />
              ))}
            </div>

            {/* Icon brand color suggestion */}
            {iconBrandColor && (
              <div className="mt-3 pt-3 border-t border-neutral-700">
                <div className="text-xs text-neutral-500 mb-2">Icon Brand Color</div>
                <button
                  type="button"
                  onClick={() => handleColorSelect(iconBrandColor)}
                  className={`
                    flex items-center gap-2 w-full p-2 rounded-lg hover:bg-neutral-800 transition-colors
                    ${iconBrandColor === value ? 'bg-primary-500/20 ring-1 ring-primary-500' : ''}
                  `}
                >
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: `#${iconBrandColor}` }}
                  />
                  <span className="text-sm text-neutral-300 font-mono">#{iconBrandColor}</span>
                </button>
              </div>
            )}
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

export default ColorPicker;
