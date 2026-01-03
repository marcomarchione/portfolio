/**
 * Media Detail Modal Component
 *
 * Professional modal for viewing media details with enhanced preview,
 * metadata display, variant management, and alt text editing.
 */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Loader2,
  RotateCcw,
  Trash2,
  Download,
  Copy,
  Check,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Image as ImageIcon,
  FileText,
  File,
} from 'lucide-react';
import { get } from '@/lib/api/client';
import { mediaKeys } from '@/lib/query/keys';
import { VariantsPanel } from './VariantsPanel';
import { AltTextEditor } from './AltTextEditor';
import type { MediaItem } from '@/types/media';
import type { ApiResponse } from '@/types/api';

interface MediaDetailModalProps {
  /** Media ID to display */
  mediaId: number | null;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal closes */
  onClose: () => void;
  /** Whether viewing trash item */
  isTrashView?: boolean;
  /** Callback for restore action */
  onRestore?: (id: number) => void;
  /** Callback for permanent delete action */
  onPermanentDelete?: (id: number) => void;
  /** Whether restore is in progress */
  isRestoring?: boolean;
}

/**
 * Formats file size for display.
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Formats date for display.
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Gets a friendly file type name and icon.
 */
function getFileTypeInfo(mimeType: string): { label: string; color: string; bgColor: string } {
  if (mimeType.startsWith('image/svg')) {
    return { label: 'SVG Vector', color: 'text-purple-400', bgColor: 'bg-purple-500/20' };
  }
  if (mimeType === 'image/png') {
    return { label: 'PNG Image', color: 'text-blue-400', bgColor: 'bg-blue-500/20' };
  }
  if (mimeType === 'image/jpeg') {
    return { label: 'JPEG Image', color: 'text-green-400', bgColor: 'bg-green-500/20' };
  }
  if (mimeType === 'image/webp') {
    return { label: 'WebP Image', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' };
  }
  if (mimeType === 'image/gif') {
    return { label: 'GIF Image', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
  }
  if (mimeType.startsWith('image/')) {
    return { label: 'Image', color: 'text-blue-400', bgColor: 'bg-blue-500/20' };
  }
  if (mimeType === 'application/pdf') {
    return { label: 'PDF Document', color: 'text-red-400', bgColor: 'bg-red-500/20' };
  }
  return { label: 'File', color: 'text-neutral-400', bgColor: 'bg-neutral-500/20' };
}

/**
 * Copy to clipboard button component.
 */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-white/10 transition-colors"
      title={label}
    >
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

/**
 * Media detail modal component.
 */
export function MediaDetailModal({
  mediaId,
  isOpen,
  onClose,
  isTrashView = false,
  onRestore,
  onPermanentDelete,
  isRestoring = false,
}: MediaDetailModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Fetch media detail
  const { data: response, isLoading, error } = useQuery({
    queryKey: mediaKeys.detail(String(mediaId)),
    queryFn: () => get<ApiResponse<MediaItem>>(`/admin/media/${mediaId}`),
    enabled: isOpen && mediaId !== null,
  });

  const media = response?.data;

  // Reset zoom when media changes
  useEffect(() => {
    setZoom(1);
    setIsFullscreen(false);
  }, [mediaId]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const isImage = media?.mimeType.startsWith('image/');
  const fileTypeInfo = media ? getFileTypeInfo(media.mimeType) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-detail-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-950/90 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="glass-card relative z-10 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-neutral-900/50">
          <div className="flex items-center gap-4 min-w-0">
            {fileTypeInfo && (
              <div className={`p-2 rounded-lg ${fileTypeInfo.bgColor}`}>
                {isImage ? (
                  <ImageIcon className={`w-5 h-5 ${fileTypeInfo.color}`} />
                ) : media?.mimeType === 'application/pdf' ? (
                  <FileText className={`w-5 h-5 ${fileTypeInfo.color}`} />
                ) : (
                  <File className={`w-5 h-5 ${fileTypeInfo.color}`} />
                )}
              </div>
            )}
            <div className="min-w-0">
              <h2
                id="media-detail-title"
                className="text-lg font-display font-semibold text-neutral-100 truncate"
              >
                {media?.filename || 'Media Details'}
              </h2>
              {fileTypeInfo && (
                <p className={`text-sm ${fileTypeInfo.color}`}>{fileTypeInfo.label}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Trash view actions */}
            {isTrashView && media && (
              <>
                <button
                  type="button"
                  onClick={() => onRestore?.(media.id)}
                  disabled={isRestoring}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restore
                </button>
                <button
                  type="button"
                  onClick={() => onPermanentDelete?.(media.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Forever
                </button>
              </>
            )}

            {/* Download button */}
            {media && !isTrashView && (
              <a
                href={media.url}
                download={media.filename}
                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-white/10 transition-colors"
                title="Download original"
              >
                <Download className="w-5 h-5" />
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center py-20">
              <p className="text-red-400">Failed to load media details</p>
            </div>
          )}

          {/* Media content */}
          {media && !isLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
              {/* Preview section (3 cols) */}
              <div className="lg:col-span-3 bg-neutral-900/30 border-b lg:border-b-0 lg:border-r border-white/5">
                {/* Preview controls */}
                {isImage && (
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-neutral-800/30">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                        disabled={zoom <= 0.25}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-white/10 disabled:opacity-30 transition-colors"
                        title="Zoom out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-neutral-400 min-w-[3rem] text-center">
                        {Math.round(zoom * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                        disabled={zoom >= 3}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-white/10 disabled:opacity-30 transition-colors"
                        title="Zoom in"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoom(1)}
                        className="px-2 py-1 rounded text-xs text-neutral-400 hover:text-neutral-100 hover:bg-white/10 transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={media.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-white/10 transition-colors"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setIsFullscreen(true)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-white/10 transition-colors"
                        title="Fullscreen"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Preview area */}
                <div className="flex items-center justify-center p-6 min-h-[300px] lg:min-h-[400px] overflow-auto">
                  {isImage ? (
                    <div
                      className="transition-transform duration-200"
                      style={{ transform: `scale(${zoom})` }}
                    >
                      <img
                        src={media.url}
                        alt={media.altText || media.filename}
                        className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-2xl ring-1 ring-white/10"
                        draggable={false}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className={`w-24 h-24 rounded-2xl ${fileTypeInfo?.bgColor || 'bg-neutral-700/50'} flex items-center justify-center mb-6`}>
                        {media.mimeType === 'application/pdf' ? (
                          <FileText className={`w-12 h-12 ${fileTypeInfo?.color || 'text-neutral-400'}`} />
                        ) : (
                          <File className={`w-12 h-12 ${fileTypeInfo?.color || 'text-neutral-400'}`} />
                        )}
                      </div>
                      <p className="text-lg font-medium text-neutral-200 mb-2">{media.filename}</p>
                      <p className="text-sm text-neutral-400">{formatFileSize(media.size)}</p>
                      <a
                        href={media.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open file
                      </a>
                    </div>
                  )}
                </div>

                {/* Image dimensions badge */}
                {isImage && media.width && media.height && (
                  <div className="flex items-center justify-center pb-4">
                    <span className="px-3 py-1 rounded-full bg-neutral-800/50 text-xs text-neutral-400 border border-white/10">
                      {media.width} × {media.height} px
                    </span>
                  </div>
                )}
              </div>

              {/* Details section (2 cols) */}
              <div className="lg:col-span-2 p-6 space-y-6">
                {/* Quick info */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-neutral-300 uppercase tracking-wider">
                    File Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                      <span className="text-sm text-neutral-400">Size</span>
                      <span className="text-sm text-neutral-200">{formatFileSize(media.size)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                      <span className="text-sm text-neutral-400">Type</span>
                      <span className={`text-sm ${fileTypeInfo?.color || 'text-neutral-200'}`}>
                        {media.mimeType}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                      <span className="text-sm text-neutral-400">Created</span>
                      <span className="text-sm text-neutral-200">{formatDate(media.createdAt)}</span>
                    </div>
                    {media.deletedAt && (
                      <div className="flex items-center justify-between py-2 border-b border-white/5">
                        <span className="text-sm text-red-400">Deleted</span>
                        <span className="text-sm text-red-300">{formatDate(media.deletedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* URL section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-neutral-300 uppercase tracking-wider">
                    URL
                  </h3>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-neutral-800/50 border border-white/5">
                    <code className="flex-1 text-xs text-neutral-300 truncate font-mono">
                      {media.url}
                    </code>
                    <CopyButton value={media.url} label="Copy URL" />
                  </div>
                </div>

                {/* Alt text editor (only for images and not in trash) */}
                {isImage && !isTrashView && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-neutral-300 uppercase tracking-wider">
                      Alt Text
                    </h3>
                    <AltTextEditor mediaId={media.id} initialValue={media.altText} />
                  </div>
                )}

                {/* Variants panel */}
                {media.variants && Object.keys(media.variants).length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-neutral-300 uppercase tracking-wider">
                      Variants
                    </h3>
                    <VariantsPanel media={media} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen overlay */}
      {isFullscreen && media && isImage && (
        <div
          className="fixed inset-0 z-[60] bg-neutral-950 flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 p-3 rounded-xl bg-neutral-800/50 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
            aria-label="Exit fullscreen"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={media.url}
            alt={media.altText || media.filename}
            className="max-w-[95vw] max-h-[95vh] object-contain"
          />
        </div>
      )}
    </div>
  );
}

export default MediaDetailModal;
