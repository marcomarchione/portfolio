/**
 * Storage Key and Path Utilities
 *
 * Functions for generating storage keys, variant paths, and URLs for media files.
 * Storage keys follow the format: {year}/{month}/{uuid}-{sanitized-filename}
 */
import { join } from 'path';

/** Variant types for resized images */
export type VariantType = 'thumb' | 'medium' | 'large';

/**
 * Sanitizes a filename by removing special characters and spaces.
 * Preserves the file extension.
 *
 * @param filename - Original filename
 * @returns Sanitized filename safe for filesystem storage
 */
function sanitizeFilename(filename: string): string {
  // Get extension
  const lastDot = filename.lastIndexOf('.');
  const extension = lastDot > 0 ? filename.slice(lastDot) : '';
  const name = lastDot > 0 ? filename.slice(0, lastDot) : filename;

  // Remove special characters, replace spaces with hyphens, convert to lowercase
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return sanitized + extension.toLowerCase();
}

/**
 * Generates a unique storage key for a file.
 * Format: {year}/{month}/{uuid}-{sanitized-filename}
 *
 * @param filename - Original filename
 * @returns Unique storage key
 */
export function generateStorageKey(filename: string): string {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const uuid = crypto.randomUUID();
  const sanitized = sanitizeFilename(filename);

  return `${year}/${month}/${uuid}-${sanitized}`;
}

/**
 * Generates the storage key for a variant of an image.
 * Returns: {key-without-ext}-{variant}.webp
 *
 * @param storageKey - Original storage key
 * @param variant - Variant type (thumb, medium, large)
 * @returns Variant storage key with .webp extension
 */
export function getVariantKey(storageKey: string, variant: VariantType): string {
  // Remove extension from original key
  const lastDot = storageKey.lastIndexOf('.');
  const keyWithoutExt = lastDot > 0 ? storageKey.slice(0, lastDot) : storageKey;

  return `${keyWithoutExt}-${variant}.webp`;
}

/**
 * Generates the public URL for a storage key.
 * Returns: /media/{storageKey}
 *
 * @param storageKey - Storage key
 * @returns Public URL path
 */
export function getPublicUrl(storageKey: string): string {
  return `/media/${storageKey}`;
}

/**
 * Gets the absolute filesystem path for a storage key.
 *
 * @param uploadsPath - Base uploads directory path
 * @param storageKey - Storage key
 * @returns Absolute filesystem path
 */
export function getFilePath(uploadsPath: string, storageKey: string): string {
  return join(uploadsPath, storageKey);
}

/**
 * Extracts the directory path from a storage key.
 *
 * @param storageKey - Storage key (e.g., "2025/01/uuid-file.jpg")
 * @returns Directory portion (e.g., "2025/01")
 */
export function getStorageDir(storageKey: string): string {
  const lastSlash = storageKey.lastIndexOf('/');
  return lastSlash > 0 ? storageKey.slice(0, lastSlash) : '';
}
