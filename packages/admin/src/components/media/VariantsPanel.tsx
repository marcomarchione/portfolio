/**
 * Variants Panel Component
 *
 * Displays image variants with preview thumbnails and copyable URLs.
 */
import { useState, useCallback } from 'react';
import { Check, Copy, Image as ImageIcon } from 'lucide-react';
import type { MediaItem, MediaVariant } from '@/types/media';

interface VariantsPanelProps {
  /** Media item to display variants for */
  media: MediaItem;
}

interface VariantRowProps {
  /** Variant label */
  label: string;
  /** Variant data */
  variant: MediaVariant | { url: string; width?: number | null; height?: number | null };
  /** Whether this is the original */
  isOriginal?: boolean;
}

/**
 * Copies text to clipboard.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Single variant row with preview and copy button.
 */
function VariantRow({ label, variant, isOriginal = false }: VariantRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const success = await copyToClipboard(variant.url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [variant.url]);

  const hasImage = variant.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-800/30">
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-12 h-12 rounded bg-neutral-700/50 overflow-hidden">
        {hasImage ? (
          <img
            src={variant.url}
            alt={`${label} variant`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-neutral-500" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-200">
          {label}
          {isOriginal && (
            <span className="ml-2 text-xs text-neutral-400">(Original)</span>
          )}
        </p>
        {variant.width && variant.height && (
          <p className="text-xs text-neutral-400">
            {variant.width} x {variant.height} px
          </p>
        )}
      </div>

      {/* Copy button */}
      <button
        type="button"
        onClick={handleCopy}
        className={`
          flex-shrink-0 p-2 rounded-lg transition-colors
          ${
            copied
              ? 'text-green-400 bg-green-500/10'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/10'
          }
        `}
        title={copied ? 'Copied!' : 'Copy URL'}
        aria-label={copied ? 'URL copied' : `Copy ${label} URL`}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

/**
 * Variants panel component.
 */
export function VariantsPanel({ media }: VariantsPanelProps) {
  const isImage = media.mimeType.startsWith('image/');
  const hasVariants = media.variants && (
    media.variants.thumb || media.variants.medium || media.variants.large
  );

  return (
    <div className="glass-card rounded-lg p-4">
      <h3 className="text-sm font-medium text-neutral-200 mb-4">
        {isImage && hasVariants ? 'Image Variants' : 'File URL'}
      </h3>
      <div className="space-y-2">
        {/* Original */}
        <VariantRow
          label="Original"
          variant={{
            url: media.url,
            width: media.width,
            height: media.height,
          }}
          isOriginal
        />

        {/* Variants (only for images with variants) */}
        {isImage && media.variants && (
          <>
            {media.variants.large && (
              <VariantRow label="Large" variant={media.variants.large} />
            )}
            {media.variants.medium && (
              <VariantRow label="Medium" variant={media.variants.medium} />
            )}
            {media.variants.thumb && (
              <VariantRow label="Thumbnail" variant={media.variants.thumb} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default VariantsPanel;
