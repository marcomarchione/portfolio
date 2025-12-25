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
  getImageDimensions,
  VARIANT_WIDTHS,
  type VariantInfo,
  type ProcessingResult,
} from './image-processor';

// Upload service
export {
  saveFile,
  deleteFile,
  fileExists,
  ensureUploadsDir,
  type SaveResult,
} from './upload-service';

// Cleanup service
export {
  cleanupExpiredMedia,
  getCleanupCount,
  type CleanupResult,
} from './cleanup';
