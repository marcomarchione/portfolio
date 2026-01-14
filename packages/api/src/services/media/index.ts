/**
 * Media Services Barrel Export
 *
 * Exports all media-related utilities and services.
 */

// Validation utilities
export {
  validateFileType,
  validateFileSize,
  isRasterImage,
  getMaxFileSize,
  getAllowedMimeTypes,
  ALLOWED_MIME_TYPES,
  SIZE_LIMITS,
} from './validation';

// Storage utilities
export {
  generateStorageKey,
  getVariantKey,
  getPublicUrl,
  getFilePath,
  getStorageDir,
  type VariantType,
} from './storage';

// Image processing
export {
  processImage,
  processImageLegacy,
  getImageDimensions,
  VARIANT_WIDTHS,
  type VariantInfo,
  type ProcessingResult,
} from './image-processor';

// Upload service (local filesystem)
export {
  saveFile as saveFileLocal,
  deleteFile as deleteFileLocal,
  fileExists as fileExistsLocal,
  ensureUploadsDir,
  type SaveResult,
} from './upload-service';

// R2 Storage
export {
  getR2Client,
  getR2ConfigFromEnv,
  saveFileToR2,
  saveBufferToR2,
  deleteFileFromR2,
  fileExistsInR2,
  getR2PublicUrl,
  type R2Config,
  type R2SaveResult,
} from './r2-storage';

// Storage Provider (unified interface for local and R2)
export {
  getStorageConfig,
  validateStorageConfig,
  saveFile,
  saveBuffer,
  deleteFile,
  fileExists,
  getPublicUrl as getStoragePublicUrl,
  getVariantUrls,
  type StorageBackend,
  type StorageConfig,
  type StorageSaveResult,
} from './storage-provider';

// Cleanup service
export {
  cleanupExpiredMedia,
  getCleanupCount,
  type CleanupResult,
} from './cleanup';
