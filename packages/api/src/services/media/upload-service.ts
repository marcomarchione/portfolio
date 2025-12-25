/**
 * Upload Service
 *
 * Handles saving files to local filesystem and cleanup operations.
 */
import { mkdir, rm, access } from 'fs/promises';
import { join, dirname } from 'path';
import { generateStorageKey, getFilePath, getVariantKey, type VariantType } from './storage';

/** Result of a file save operation */
export interface SaveResult {
  /** Generated storage key */
  storageKey: string;
  /** Absolute path where file was saved */
  filePath: string;
  /** Original filename */
  filename: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  size: number;
}

/**
 * Saves a file to the uploads directory.
 * Creates directory structure if needed.
 *
 * @param file - File object from multipart form data
 * @param uploadsPath - Base uploads directory path
 * @returns Save result with storage key and metadata
 */
export async function saveFile(file: File, uploadsPath: string): Promise<SaveResult> {
  const storageKey = generateStorageKey(file.name);
  const filePath = getFilePath(uploadsPath, storageKey);

  // Ensure directory exists
  await mkdir(dirname(filePath), { recursive: true });

  // Write file to disk
  const arrayBuffer = await file.arrayBuffer();
  await Bun.write(filePath, arrayBuffer);

  return {
    storageKey,
    filePath,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
  };
}

/**
 * Deletes a file and optionally its variants from the filesystem.
 * Silently ignores if files don't exist.
 *
 * @param uploadsPath - Base uploads directory path
 * @param storageKey - Storage key of the original file
 * @param includeVariants - Whether to also delete variant files
 */
export async function deleteFile(
  uploadsPath: string,
  storageKey: string,
  includeVariants: boolean = true
): Promise<void> {
  const filePath = getFilePath(uploadsPath, storageKey);

  // Delete original file
  try {
    await rm(filePath, { force: true });
  } catch {
    // Ignore errors if file doesn't exist
  }

  // Delete variant files
  if (includeVariants) {
    const variants: VariantType[] = ['thumb', 'medium', 'large'];
    for (const variant of variants) {
      const variantKey = getVariantKey(storageKey, variant);
      const variantPath = getFilePath(uploadsPath, variantKey);
      try {
        await rm(variantPath, { force: true });
      } catch {
        // Ignore errors if variant doesn't exist
      }
    }
  }
}

/**
 * Checks if a file exists at the given path.
 *
 * @param filePath - Absolute path to check
 * @returns true if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensures the uploads directory exists.
 * Creates it recursively if needed.
 *
 * @param uploadsPath - Base uploads directory path
 */
export async function ensureUploadsDir(uploadsPath: string): Promise<void> {
  await mkdir(uploadsPath, { recursive: true });
}
