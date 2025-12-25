/**
 * Image Processing Service
 *
 * Uses Sharp library to generate WebP variants at different sizes.
 * Extracts image dimensions and creates optimized versions.
 */
import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { getVariantKey, getStorageDir, type VariantType } from './storage';
import { isRasterImage } from './validation';

/** Variant configuration with target width */
export const VARIANT_WIDTHS: Record<VariantType, number> = {
  thumb: 400,
  medium: 800,
  large: 1200,
} as const;

/** Metadata for a single image variant */
export interface VariantInfo {
  /** Storage path for the variant */
  path: string;
  /** Variant width in pixels */
  width: number;
  /** Variant height in pixels */
  height: number;
}

/** Result of image processing operation */
export interface ProcessingResult {
  /** Original image width */
  width: number;
  /** Original image height */
  height: number;
  /** Generated variants metadata */
  variants: {
    thumb?: VariantInfo;
    medium?: VariantInfo;
    large?: VariantInfo;
  };
}

/**
 * Processes an image and generates WebP variants at different sizes.
 * Skips processing for SVG and PDF files.
 *
 * @param inputPath - Absolute path to the original image file
 * @param uploadsPath - Base uploads directory
 * @param storageKey - Storage key for the original file
 * @param mimeType - MIME type of the original file
 * @returns Processing result with dimensions and variant metadata
 */
export async function processImage(
  inputPath: string,
  uploadsPath: string,
  storageKey: string,
  mimeType: string
): Promise<ProcessingResult> {
  // Skip processing for non-raster images (SVG, PDF)
  if (!isRasterImage(mimeType)) {
    return {
      width: 0,
      height: 0,
      variants: {},
    };
  }

  // Get original image metadata
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const originalWidth = metadata.width ?? 0;
  const originalHeight = metadata.height ?? 0;

  if (originalWidth === 0 || originalHeight === 0) {
    console.warn(`Could not read dimensions from: ${inputPath}`);
    return {
      width: 0,
      height: 0,
      variants: {},
    };
  }

  const variants: ProcessingResult['variants'] = {};

  // Generate each variant
  for (const variant of ['thumb', 'medium', 'large'] as const) {
    const targetWidth = VARIANT_WIDTHS[variant];

    // Skip variant if original is smaller than target width
    if (originalWidth <= targetWidth) {
      continue;
    }

    const variantKey = getVariantKey(storageKey, variant);
    const variantPath = join(uploadsPath, variantKey);

    // Ensure directory exists
    await mkdir(dirname(variantPath), { recursive: true });

    // Calculate proportional height
    const scaleFactor = targetWidth / originalWidth;
    const targetHeight = Math.round(originalHeight * scaleFactor);

    try {
      // Generate WebP variant
      await sharp(inputPath)
        .resize(targetWidth, targetHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toFile(variantPath);

      variants[variant] = {
        path: variantKey,
        width: targetWidth,
        height: targetHeight,
      };
    } catch (error) {
      console.error(`Failed to generate ${variant} variant for ${storageKey}:`, error);
      // Continue with other variants even if one fails
    }
  }

  return {
    width: originalWidth,
    height: originalHeight,
    variants,
  };
}

/**
 * Extracts dimensions from an image file without generating variants.
 * Useful for getting dimensions of already-uploaded files.
 *
 * @param inputPath - Absolute path to the image file
 * @returns Object with width and height, or null values if extraction fails
 */
export async function getImageDimensions(
  inputPath: string
): Promise<{ width: number | null; height: number | null }> {
  try {
    const metadata = await sharp(inputPath).metadata();
    return {
      width: metadata.width ?? null,
      height: metadata.height ?? null,
    };
  } catch {
    return { width: null, height: null };
  }
}
