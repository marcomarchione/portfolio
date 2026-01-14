/**
 * Storage Provider
 *
 * Unified storage abstraction that supports both local filesystem and R2.
 * Automatically selects backend based on STORAGE_BACKEND environment variable.
 */
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import {
  generateStorageKey,
  getFilePath,
  getVariantKey,
  type VariantType,
} from './storage';
import {
  saveFile as saveFileLocal,
  deleteFile as deleteFileLocal,
  fileExists as fileExistsLocal,
  type SaveResult,
} from './upload-service';
import {
  getR2ConfigFromEnv,
  saveFileToR2,
  saveBufferToR2,
  deleteFileFromR2,
  fileExistsInR2,
  getR2PublicUrl,
  type R2Config,
} from './r2-storage';

/** Storage backend type */
export type StorageBackend = 'local' | 'r2';

/** Storage configuration */
export interface StorageConfig {
  backend: StorageBackend;
  uploadsPath: string;
  r2Config: R2Config | null;
}

/** Unified save result */
export interface StorageSaveResult {
  storageKey: string;
  filename: string;
  mimeType: string;
  size: number;
}

/**
 * Gets storage configuration from environment.
 */
export function getStorageConfig(): StorageConfig {
  const backend = (process.env.STORAGE_BACKEND || 'local') as StorageBackend;
  const uploadsPath = process.env.UPLOADS_PATH || './uploads';
  const r2Config = getR2ConfigFromEnv();

  return { backend, uploadsPath, r2Config };
}

/**
 * Validates storage configuration.
 * Throws if R2 backend is selected but not configured.
 */
export function validateStorageConfig(config: StorageConfig): void {
  if (config.backend === 'r2' && !config.r2Config) {
    throw new Error(
      'R2 storage backend selected but R2 configuration is missing. ' +
        'Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL.'
    );
  }
}

/**
 * Saves a file using the configured storage backend.
 */
export async function saveFile(file: File, config: StorageConfig): Promise<StorageSaveResult> {
  validateStorageConfig(config);

  if (config.backend === 'r2' && config.r2Config) {
    const result = await saveFileToR2(file, config.r2Config);
    return {
      storageKey: result.storageKey,
      filename: result.filename,
      mimeType: result.mimeType,
      size: result.size,
    };
  }

  // Local storage
  const result = await saveFileLocal(file, config.uploadsPath);
  return {
    storageKey: result.storageKey,
    filename: result.filename,
    mimeType: result.mimeType,
    size: result.size,
  };
}

/**
 * Saves a buffer with a specific storage key.
 * Used for saving processed image variants.
 */
export async function saveBuffer(
  buffer: Buffer | Uint8Array,
  storageKey: string,
  mimeType: string,
  config: StorageConfig
): Promise<void> {
  validateStorageConfig(config);

  if (config.backend === 'r2' && config.r2Config) {
    await saveBufferToR2(buffer, storageKey, mimeType, config.r2Config);
    return;
  }

  // Local storage
  const filePath = getFilePath(config.uploadsPath, storageKey);
  await mkdir(dirname(filePath), { recursive: true });
  await Bun.write(filePath, buffer);
}

/**
 * Deletes a file and optionally its variants.
 */
export async function deleteFile(
  storageKey: string,
  config: StorageConfig,
  includeVariants: boolean = true
): Promise<void> {
  validateStorageConfig(config);

  if (config.backend === 'r2' && config.r2Config) {
    await deleteFileFromR2(storageKey, config.r2Config, includeVariants);
    return;
  }

  // Local storage
  await deleteFileLocal(config.uploadsPath, storageKey, includeVariants);
}

/**
 * Checks if a file exists.
 */
export async function fileExists(storageKey: string, config: StorageConfig): Promise<boolean> {
  validateStorageConfig(config);

  if (config.backend === 'r2' && config.r2Config) {
    return fileExistsInR2(storageKey, config.r2Config);
  }

  // Local storage
  const filePath = getFilePath(config.uploadsPath, storageKey);
  return fileExistsLocal(filePath);
}

/**
 * Gets the public URL for a storage key.
 * For local storage, returns /media/{key}
 * For R2, returns the configured public URL.
 */
export function getPublicUrl(storageKey: string, config: StorageConfig): string {
  if (config.backend === 'r2' && config.r2Config) {
    return getR2PublicUrl(storageKey, config.r2Config);
  }

  // Local storage uses /media/ prefix
  return `/media/${storageKey}`;
}

/**
 * Gets URLs for all variants of an image.
 */
export function getVariantUrls(
  storageKey: string,
  config: StorageConfig
): Record<VariantType, string> {
  const variants: VariantType[] = ['thumb', 'medium', 'large'];
  const urls: Record<string, string> = {};

  for (const variant of variants) {
    const variantKey = getVariantKey(storageKey, variant);
    urls[variant] = getPublicUrl(variantKey, config);
  }

  return urls as Record<VariantType, string>;
}
