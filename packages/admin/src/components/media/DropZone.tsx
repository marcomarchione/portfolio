/**
 * Drop Zone Component
 *
 * Drag-and-drop area for file uploads.
 */
import { useState, useCallback, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface DropZoneProps {
  /** Callback when files are dropped */
  onDrop: (files: File[]) => void;
  /** Whether uploads are in progress */
  isUploading?: boolean;
  /** Accepted MIME types (optional filter) */
  accept?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
}

/**
 * Drop zone component for drag-and-drop file uploads.
 */
export function DropZone({
  onDrop,
  isUploading = false,
  accept,
  disabled = false,
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onDrop(files);
    }
  }, [onDrop, disabled, isUploading]);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onDrop(files);
    }
    // Reset input to allow selecting the same file again
    e.target.value = '';
  }, [onDrop]);

  return (
    <div
      role="button"
      tabIndex={disabled || isUploading ? -1 : 0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        relative p-6 rounded-lg transition-all duration-200
        border-2 border-dashed
        ${
          disabled || isUploading
            ? 'border-white/5 bg-white/2 cursor-not-allowed opacity-50'
            : isDragOver
            ? 'border-primary-500 bg-primary-500/10 scale-[1.02]'
            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 cursor-pointer'
        }
      `}
      aria-label="Drop files here to upload"
    >
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        {isUploading ? (
          <>
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <div>
              <p className="text-sm font-medium text-neutral-200">
                Uploading files...
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Please wait
              </p>
            </div>
          </>
        ) : (
          <>
            <Upload
              className={`w-8 h-8 ${
                isDragOver ? 'text-primary-500' : 'text-neutral-400'
              }`}
            />
            <div>
              <p className="text-sm font-medium text-neutral-200">
                {isDragOver ? 'Drop files here' : 'Drag and drop files here'}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                or click to browse
              </p>
            </div>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleFileChange}
        className="sr-only"
        disabled={disabled || isUploading}
        aria-hidden="true"
      />
    </div>
  );
}

export default DropZone;
