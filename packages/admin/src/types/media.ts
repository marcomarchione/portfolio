/**
 * Media Types
 *
 * Type definitions for media library components.
 */

/**
 * Media variant metadata.
 */
export interface MediaVariant {
  /** Public URL for the variant */
  url: string;
  /** Variant width in pixels */
  width: number;
  /** Variant height in pixels */
  height: number;
}

/**
 * Media variants object containing all generated image variants.
 */
export interface MediaVariants {
  /** Thumbnail variant (400px width) */
  thumb?: MediaVariant;
  /** Medium variant (800px width) */
  medium?: MediaVariant;
  /** Large variant (1200px width) */
  large?: MediaVariant;
}

/**
 * Media item from the API.
 */
export interface MediaItem {
  /** Unique identifier */
  id: number;
  /** Original filename */
  filename: string;
  /** MIME type (e.g., image/jpeg, application/pdf) */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** Public URL for the original file */
  url: string;
  /** Alt text for accessibility */
  altText?: string | null;
  /** Original image width in pixels (null for non-images) */
  width?: number | null;
  /** Original image height in pixels (null for non-images) */
  height?: number | null;
  /** Generated image variants */
  variants?: MediaVariants;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of soft-deletion (null if not deleted) */
  deletedAt?: string | null;
}

/**
 * Upload queue item status.
 */
export type UploadStatus = 'pending' | 'uploading' | 'complete' | 'error';

/**
 * Item in the upload queue.
 */
export interface UploadQueueItem {
  /** Unique identifier for the upload */
  id: string;
  /** File being uploaded */
  file: File;
  /** Current upload status */
  status: UploadStatus;
  /** Upload progress (0-100) */
  progress: number;
  /** Error message if status is 'error' */
  error?: string;
  /** Resulting media item if upload succeeded */
  result?: MediaItem;
}

/**
 * MIME type filter options.
 */
export type MimeTypeFilterValue = 'all' | 'image' | 'document';

/**
 * View mode for the media page.
 */
export type MediaViewMode = 'library' | 'trash';
