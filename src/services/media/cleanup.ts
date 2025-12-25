/**
 * Media Cleanup Service
 *
 * Handles cleanup of soft-deleted media files after retention period.
 * Deletes physical files and database records for expired soft-deleted media.
 */
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import * as schema from '../../db/schema';
import {
  getExpiredSoftDeletedMedia,
  permanentlyDeleteMedia,
} from '../../db/queries';
import { deleteFile } from './upload-service';
import type { MediaVariants } from '../../db/schema';

/** Result of a cleanup operation */
export interface CleanupResult {
  /** Number of records successfully cleaned up */
  cleaned: number;
  /** Number of records that failed to clean up */
  failed: number;
  /** Error details for failed cleanups */
  errors: Array<{
    mediaId: number;
    storageKey: string;
    error: string;
  }>;
}

type DrizzleDB = BunSQLiteDatabase<typeof schema>;

/**
 * Cleans up expired soft-deleted media files.
 * Deletes physical files (original + variants) and database records.
 *
 * @param db - Drizzle database instance
 * @param uploadsPath - Base uploads directory path
 * @param daysOld - Minimum age in days for deletedAt (default: 30)
 * @returns Cleanup result with counts and errors
 */
export async function cleanupExpiredMedia(
  db: DrizzleDB,
  uploadsPath: string,
  daysOld: number = 30
): Promise<CleanupResult> {
  const result: CleanupResult = {
    cleaned: 0,
    failed: 0,
    errors: [],
  };

  // Get expired soft-deleted media
  const expiredMedia = getExpiredSoftDeletedMedia(db, daysOld);

  if (expiredMedia.length === 0) {
    return result;
  }

  console.log(`Found ${expiredMedia.length} expired media records to clean up`);

  for (const media of expiredMedia) {
    try {
      // Delete physical files
      await deleteFile(uploadsPath, media.storageKey, true);

      // Delete database record
      const deleted = permanentlyDeleteMedia(db, media.id);

      if (deleted) {
        result.cleaned++;
        console.log(`Cleaned up: ${media.storageKey}`);
      } else {
        result.failed++;
        result.errors.push({
          mediaId: media.id,
          storageKey: media.storageKey,
          error: 'Failed to delete database record',
        });
      }
    } catch (error) {
      result.failed++;
      result.errors.push({
        mediaId: media.id,
        storageKey: media.storageKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      console.error(`Failed to clean up ${media.storageKey}:`, error);
    }
  }

  return result;
}

/**
 * Gets the count of media records that would be cleaned up.
 * Useful for dry-run or reporting.
 *
 * @param db - Drizzle database instance
 * @param daysOld - Minimum age in days for deletedAt (default: 30)
 * @returns Number of records that would be cleaned up
 */
export function getCleanupCount(db: DrizzleDB, daysOld: number = 30): number {
  const expiredMedia = getExpiredSoftDeletedMedia(db, daysOld);
  return expiredMedia.length;
}
