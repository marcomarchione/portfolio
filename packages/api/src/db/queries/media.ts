/**
 * Media Query Helpers
 *
 * Database operations for media table.
 */
import { eq, and, isNull, isNotNull, lt, sql, desc, like } from 'drizzle-orm';
import type { DrizzleDB } from '../index';
import * as schema from '../schema';
import type { Media, NewMedia } from '../schema';

/** Options for listing media */
export interface ListMediaOptions {
  limit?: number;
  offset?: number;
  mimeType?: string;
  includeDeleted?: boolean;
}

/** Options for listing deleted media */
export interface ListDeletedMediaOptions {
  limit?: number;
  offset?: number;
  mimeType?: string;
}

/**
 * Inserts a new media record.
 *
 * @param db - Drizzle database instance
 * @param data - Media data to insert
 * @returns Inserted media record
 */
export async function insertMedia(db: DrizzleDB, data: NewMedia): Promise<Media> {
  const [media] = await db.insert(schema.media).values(data).returning();

  if (!media) {
    throw new Error('Failed to insert media');
  }

  return media;
}

/**
 * Gets a media record by ID.
 * Excludes soft-deleted records by default.
 *
 * @param db - Drizzle database instance
 * @param id - Media ID
 * @param includeDeleted - Whether to include soft-deleted records
 * @returns Media record or undefined
 */
export async function getMediaById(
  db: DrizzleDB,
  id: number,
  includeDeleted: boolean = false
): Promise<Media | undefined> {
  const conditions = [eq(schema.media.id, id)];

  if (!includeDeleted) {
    conditions.push(isNull(schema.media.deletedAt));
  }

  const [result] = await db
    .select()
    .from(schema.media)
    .where(and(...conditions));

  return result;
}

/**
 * Lists media records with optional filters.
 *
 * @param db - Drizzle database instance
 * @param options - List options
 * @returns Array of media records
 */
export async function listMedia(db: DrizzleDB, options: ListMediaOptions = {}): Promise<Media[]> {
  const { limit = 20, offset = 0, mimeType, includeDeleted = false } = options;

  const conditions = [];

  if (!includeDeleted) {
    conditions.push(isNull(schema.media.deletedAt));
  }

  if (mimeType) {
    // Convert glob pattern (e.g., "image/*") to SQL LIKE pattern (e.g., "image/%")
    const likePattern = mimeType.replace(/\*/g, '%');
    conditions.push(like(schema.media.mimeType, likePattern));
  }

  if (conditions.length > 0) {
    return db
      .select()
      .from(schema.media)
      .where(and(...conditions))
      .orderBy(desc(schema.media.createdAt))
      .limit(limit)
      .offset(offset);
  }

  return db
    .select()
    .from(schema.media)
    .orderBy(desc(schema.media.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Lists soft-deleted media records.
 * Orders by deletedAt descending (most recently deleted first).
 *
 * @param db - Drizzle database instance
 * @param options - List options
 * @returns Array of soft-deleted media records
 */
export async function listDeletedMedia(db: DrizzleDB, options: ListDeletedMediaOptions = {}): Promise<Media[]> {
  const { limit = 20, offset = 0, mimeType } = options;

  const conditions = [isNotNull(schema.media.deletedAt)];

  if (mimeType) {
    // Convert glob pattern (e.g., "image/*") to SQL LIKE pattern (e.g., "image/%")
    const likePattern = mimeType.replace(/\*/g, '%');
    conditions.push(like(schema.media.mimeType, likePattern));
  }

  return db
    .select()
    .from(schema.media)
    .where(and(...conditions))
    .orderBy(desc(schema.media.deletedAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Counts soft-deleted media records.
 *
 * @param db - Drizzle database instance
 * @param options - List options
 * @returns Total count of soft-deleted records
 */
export async function countDeletedMedia(db: DrizzleDB, options: ListDeletedMediaOptions = {}): Promise<number> {
  const { mimeType } = options;

  const conditions = [isNotNull(schema.media.deletedAt)];

  if (mimeType) {
    // Convert glob pattern (e.g., "image/*") to SQL LIKE pattern (e.g., "image/%")
    const likePattern = mimeType.replace(/\*/g, '%');
    conditions.push(like(schema.media.mimeType, likePattern));
  }

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.media)
    .where(and(...conditions));

  return result?.count ?? 0;
}

/**
 * Counts media records with optional filters.
 *
 * @param db - Drizzle database instance
 * @param options - List options
 * @returns Total count
 */
export async function countMedia(db: DrizzleDB, options: ListMediaOptions = {}): Promise<number> {
  const { mimeType, includeDeleted = false } = options;

  const conditions = [];

  if (!includeDeleted) {
    conditions.push(isNull(schema.media.deletedAt));
  }

  if (mimeType) {
    // Convert glob pattern (e.g., "image/*") to SQL LIKE pattern (e.g., "image/%")
    const likePattern = mimeType.replace(/\*/g, '%');
    conditions.push(like(schema.media.mimeType, likePattern));
  }

  if (conditions.length > 0) {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.media)
      .where(and(...conditions));
    return result?.count ?? 0;
  }

  const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.media);
  return result?.count ?? 0;
}

/**
 * Updates media alt text.
 *
 * @param db - Drizzle database instance
 * @param id - Media ID
 * @param altText - New alt text value
 * @returns Updated media record or undefined if not found
 */
export async function updateMediaAltText(
  db: DrizzleDB,
  id: number,
  altText: string | null
): Promise<Media | undefined> {
  const media = await getMediaById(db, id);
  if (!media) {
    return undefined;
  }

  await db.update(schema.media)
    .set({ altText })
    .where(eq(schema.media.id, id));

  return getMediaById(db, id);
}

/**
 * Updates media variants and dimensions.
 *
 * @param db - Drizzle database instance
 * @param id - Media ID
 * @param data - Variants and dimensions to update
 * @returns Updated media record or undefined if not found
 */
export async function updateMediaVariants(
  db: DrizzleDB,
  id: number,
  data: { variants?: string; width?: number; height?: number }
): Promise<Media | undefined> {
  const media = await getMediaById(db, id, true);
  if (!media) {
    return undefined;
  }

  await db.update(schema.media)
    .set(data)
    .where(eq(schema.media.id, id));

  return getMediaById(db, id, true);
}

/**
 * Soft-deletes a media record by setting deletedAt timestamp.
 *
 * @param db - Drizzle database instance
 * @param id - Media ID
 * @returns Updated media record or undefined if not found
 */
export async function softDeleteMedia(db: DrizzleDB, id: number): Promise<Media | undefined> {
  const media = await getMediaById(db, id);
  if (!media) {
    return undefined;
  }

  const now = new Date();
  await db.update(schema.media)
    .set({ deletedAt: now })
    .where(eq(schema.media.id, id));

  return getMediaById(db, id, true);
}

/**
 * Restores a soft-deleted media record by clearing deletedAt timestamp.
 *
 * @param db - Drizzle database instance
 * @param id - Media ID
 * @returns Updated media record or undefined if not found/not deleted
 */
export async function restoreMedia(db: DrizzleDB, id: number): Promise<Media | undefined> {
  // Get media including deleted ones
  const media = await getMediaById(db, id, true);
  if (!media) {
    return undefined;
  }

  // Only restore if it was actually deleted
  if (!media.deletedAt) {
    return undefined;
  }

  await db.update(schema.media)
    .set({ deletedAt: null })
    .where(eq(schema.media.id, id));

  return getMediaById(db, id);
}

/**
 * Gets soft-deleted media records older than specified days.
 * Used for cleanup operations.
 *
 * @param db - Drizzle database instance
 * @param daysOld - Minimum age in days for deletedAt
 * @returns Array of expired media records
 */
export async function getExpiredSoftDeletedMedia(db: DrizzleDB, daysOld: number = 30): Promise<Media[]> {
  const threshold = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

  return db
    .select()
    .from(schema.media)
    .where(
      and(
        lt(schema.media.deletedAt, threshold),
        isNotNull(schema.media.deletedAt)
      )
    );
}

/**
 * Permanently deletes a media record from the database.
 * Use only after physical files have been deleted.
 *
 * @param db - Drizzle database instance
 * @param id - Media ID
 * @returns true if record existed and was deleted
 */
export async function permanentlyDeleteMedia(db: DrizzleDB, id: number): Promise<boolean> {
  // Check if media exists before deleting
  const media = await getMediaById(db, id, true);
  if (!media) {
    return false;
  }

  await db.delete(schema.media).where(eq(schema.media.id, id));
  return true;
}
