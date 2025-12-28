/**
 * Media Query Helpers
 *
 * Database operations for media table.
 */
import { eq, and, isNull, isNotNull, lt, sql, desc, like } from 'drizzle-orm';
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import * as schema from '../schema';
import type { Media, NewMedia } from '../schema';

type DrizzleDB = BunSQLiteDatabase<typeof schema>;

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
export function insertMedia(db: DrizzleDB, data: NewMedia): Media {
  db.insert(schema.media).values(data).run();

  const media = db
    .select()
    .from(schema.media)
    .where(eq(schema.media.storageKey, data.storageKey))
    .get();

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
export function getMediaById(
  db: DrizzleDB,
  id: number,
  includeDeleted: boolean = false
): Media | undefined {
  const conditions = [eq(schema.media.id, id)];

  if (!includeDeleted) {
    conditions.push(isNull(schema.media.deletedAt));
  }

  return db
    .select()
    .from(schema.media)
    .where(and(...conditions))
    .get();
}

/**
 * Lists media records with optional filters.
 *
 * @param db - Drizzle database instance
 * @param options - List options
 * @returns Array of media records
 */
export function listMedia(db: DrizzleDB, options: ListMediaOptions = {}): Media[] {
  const { limit = 20, offset = 0, mimeType, includeDeleted = false } = options;

  const conditions = [];

  if (!includeDeleted) {
    conditions.push(isNull(schema.media.deletedAt));
  }

  if (mimeType) {
    conditions.push(like(schema.media.mimeType, `${mimeType}%`));
  }

  const query = db
    .select()
    .from(schema.media)
    .orderBy(desc(schema.media.createdAt))
    .limit(limit)
    .offset(offset);

  if (conditions.length > 0) {
    return query.where(and(...conditions)).all();
  }

  return query.all();
}

/**
 * Lists soft-deleted media records.
 * Orders by deletedAt descending (most recently deleted first).
 *
 * @param db - Drizzle database instance
 * @param options - List options
 * @returns Array of soft-deleted media records
 */
export function listDeletedMedia(db: DrizzleDB, options: ListDeletedMediaOptions = {}): Media[] {
  const { limit = 20, offset = 0, mimeType } = options;

  const conditions = [isNotNull(schema.media.deletedAt)];

  if (mimeType) {
    conditions.push(like(schema.media.mimeType, `${mimeType}%`));
  }

  return db
    .select()
    .from(schema.media)
    .where(and(...conditions))
    .orderBy(desc(schema.media.deletedAt))
    .limit(limit)
    .offset(offset)
    .all();
}

/**
 * Counts soft-deleted media records.
 *
 * @param db - Drizzle database instance
 * @param options - List options
 * @returns Total count of soft-deleted records
 */
export function countDeletedMedia(db: DrizzleDB, options: ListDeletedMediaOptions = {}): number {
  const { mimeType } = options;

  const conditions = [isNotNull(schema.media.deletedAt)];

  if (mimeType) {
    conditions.push(like(schema.media.mimeType, `${mimeType}%`));
  }

  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.media)
    .where(and(...conditions))
    .get();

  return result?.count ?? 0;
}

/**
 * Counts media records with optional filters.
 *
 * @param db - Drizzle database instance
 * @param options - List options
 * @returns Total count
 */
export function countMedia(db: DrizzleDB, options: ListMediaOptions = {}): number {
  const { mimeType, includeDeleted = false } = options;

  const conditions = [];

  if (!includeDeleted) {
    conditions.push(isNull(schema.media.deletedAt));
  }

  if (mimeType) {
    conditions.push(like(schema.media.mimeType, `${mimeType}%`));
  }

  const query = db.select({ count: sql<number>`count(*)` }).from(schema.media);

  if (conditions.length > 0) {
    const result = query.where(and(...conditions)).get();
    return result?.count ?? 0;
  }

  const result = query.get();
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
export function updateMediaAltText(
  db: DrizzleDB,
  id: number,
  altText: string | null
): Media | undefined {
  const media = getMediaById(db, id);
  if (!media) {
    return undefined;
  }

  db.update(schema.media)
    .set({ altText })
    .where(eq(schema.media.id, id))
    .run();

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
export function updateMediaVariants(
  db: DrizzleDB,
  id: number,
  data: { variants?: string; width?: number; height?: number }
): Media | undefined {
  const media = getMediaById(db, id, true);
  if (!media) {
    return undefined;
  }

  db.update(schema.media)
    .set(data)
    .where(eq(schema.media.id, id))
    .run();

  return getMediaById(db, id, true);
}

/**
 * Soft-deletes a media record by setting deletedAt timestamp.
 *
 * @param db - Drizzle database instance
 * @param id - Media ID
 * @returns Updated media record or undefined if not found
 */
export function softDeleteMedia(db: DrizzleDB, id: number): Media | undefined {
  const media = getMediaById(db, id);
  if (!media) {
    return undefined;
  }

  const now = new Date();
  db.update(schema.media)
    .set({ deletedAt: now })
    .where(eq(schema.media.id, id))
    .run();

  return getMediaById(db, id, true);
}

/**
 * Restores a soft-deleted media record by clearing deletedAt timestamp.
 *
 * @param db - Drizzle database instance
 * @param id - Media ID
 * @returns Updated media record or undefined if not found/not deleted
 */
export function restoreMedia(db: DrizzleDB, id: number): Media | undefined {
  // Get media including deleted ones
  const media = getMediaById(db, id, true);
  if (!media) {
    return undefined;
  }

  // Only restore if it was actually deleted
  if (!media.deletedAt) {
    return undefined;
  }

  db.update(schema.media)
    .set({ deletedAt: null })
    .where(eq(schema.media.id, id))
    .run();

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
export function getExpiredSoftDeletedMedia(db: DrizzleDB, daysOld: number = 30): Media[] {
  const threshold = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

  return db
    .select()
    .from(schema.media)
    .where(
      and(
        lt(schema.media.deletedAt, threshold),
        sql`${schema.media.deletedAt} IS NOT NULL`
      )
    )
    .all();
}

/**
 * Permanently deletes a media record from the database.
 * Use only after physical files have been deleted.
 *
 * @param db - Drizzle database instance
 * @param id - Media ID
 * @returns true if record existed and was deleted
 */
export function permanentlyDeleteMedia(db: DrizzleDB, id: number): boolean {
  // Check if media exists before deleting
  const media = getMediaById(db, id, true);
  if (!media) {
    return false;
  }

  db.delete(schema.media).where(eq(schema.media.id, id)).run();
  return true;
}
