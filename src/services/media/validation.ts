/**
 * Media Validation Utilities
 *
 * Functions for validating file types and sizes for media uploads.
 * Supports images (JPEG, PNG, WebP, GIF, SVG) and documents (PDF).
 */

/** Size limits in bytes */
export const SIZE_LIMITS = {
  /** 10MB limit for images */
  IMAGE: 10 * 1024 * 1024,
  /** 25MB limit for PDFs */
  PDF: 25 * 1024 * 1024,
} as const;

/**
 * Allowed MIME types with their size limits.
 * Maps MIME type to maximum file size in bytes.
 */
export const ALLOWED_MIME_TYPES: Record<string, number> = {
  // Raster images - 10MB limit
  'image/jpeg': SIZE_LIMITS.IMAGE,
  'image/png': SIZE_LIMITS.IMAGE,
  'image/webp': SIZE_LIMITS.IMAGE,
  'image/gif': SIZE_LIMITS.IMAGE,
  // Vector images - 10MB limit
  'image/svg+xml': SIZE_LIMITS.IMAGE,
  // Documents - 25MB limit
  'application/pdf': SIZE_LIMITS.PDF,
} as const;

/** MIME types that support image variant generation */
const RASTER_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

/**
 * Validates if a MIME type is allowed for upload.
 *
 * @param mimeType - MIME type to validate
 * @returns true if the MIME type is allowed
 */
export function validateFileType(mimeType: string): boolean {
  return mimeType in ALLOWED_MIME_TYPES;
}

/**
 * Validates if file size is within limits for the given MIME type.
 *
 * @param mimeType - MIME type of the file
 * @param size - File size in bytes
 * @returns true if the file size is within limits
 */
export function validateFileSize(mimeType: string, size: number): boolean {
  const maxSize = ALLOWED_MIME_TYPES[mimeType];
  if (maxSize === undefined) {
    return false;
  }
  return size <= maxSize;
}

/**
 * Checks if a MIME type is a raster image that supports variant generation.
 * SVG and PDF files should not have WebP variants generated.
 *
 * @param mimeType - MIME type to check
 * @returns true if the MIME type is a raster image
 */
export function isRasterImage(mimeType: string): boolean {
  return RASTER_IMAGE_TYPES.has(mimeType);
}

/**
 * Gets the maximum file size for a given MIME type.
 *
 * @param mimeType - MIME type to check
 * @returns Maximum file size in bytes, or undefined if type not allowed
 */
export function getMaxFileSize(mimeType: string): number | undefined {
  return ALLOWED_MIME_TYPES[mimeType];
}

/**
 * Gets all allowed MIME types as an array.
 *
 * @returns Array of allowed MIME type strings
 */
export function getAllowedMimeTypes(): string[] {
  return Object.keys(ALLOWED_MIME_TYPES);
}
