/**
 * Content Query Helpers
 *
 * Base content lookup and listing functions for content_base table.
 */
import { eq, and, sql, desc, asc } from 'drizzle-orm';
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import * as schema from '../schema';
import type { ContentType, ContentStatus } from '../schema';

type DrizzleDB = BunSQLiteDatabase<typeof schema>;

/** Options for listing content */
export interface ListContentOptions {
  limit?: number;
  offset?: number;
  status?: ContentStatus;
  featured?: boolean;
  publishedOnly?: boolean;
}

/**
 * Gets content by ID.
 *
 * @param db - Drizzle database instance
 * @param id - Content ID
 * @returns Content base record or undefined
 */
export function getContentById(db: DrizzleDB, id: number) {
  return db.select().from(schema.contentBase).where(eq(schema.contentBase.id, id)).get();
}

/**
 * Gets content by slug and type.
 *
 * @param db - Drizzle database instance
 * @param slug - Content slug
 * @param type - Content type
 * @returns Content base record or undefined
 */
export function getContentBySlug(db: DrizzleDB, slug: string, type: ContentType) {
  return db
    .select()
    .from(schema.contentBase)
    .where(and(eq(schema.contentBase.slug, slug), eq(schema.contentBase.type, type)))
    .get();
}

/**
 * Gets content by slug only (for uniqueness checks).
 *
 * @param db - Drizzle database instance
 * @param slug - Content slug
 * @returns Content base record or undefined
 */
export function getContentBySlugOnly(db: DrizzleDB, slug: string) {
  return db.select().from(schema.contentBase).where(eq(schema.contentBase.slug, slug)).get();
}

/**
 * Lists content by type with pagination and filters.
 *
 * @param db - Drizzle database instance
 * @param type - Content type
 * @param options - List options
 * @returns Array of content base records
 */
export function listContent(db: DrizzleDB, type: ContentType, options: ListContentOptions = {}) {
  const { limit = 20, offset = 0, status, featured, publishedOnly = false } = options;

  const conditions = [eq(schema.contentBase.type, type)];

  if (status) {
    conditions.push(eq(schema.contentBase.status, status));
  } else if (publishedOnly) {
    conditions.push(eq(schema.contentBase.status, 'published'));
  }

  if (featured !== undefined) {
    conditions.push(eq(schema.contentBase.featured, featured));
  }

  return db
    .select()
    .from(schema.contentBase)
    .where(and(...conditions))
    .orderBy(desc(schema.contentBase.publishedAt), desc(schema.contentBase.createdAt))
    .limit(limit)
    .offset(offset)
    .all();
}

/**
 * Counts content by type with filters.
 *
 * @param db - Drizzle database instance
 * @param type - Content type
 * @param options - List options
 * @returns Total count
 */
export function countContent(db: DrizzleDB, type: ContentType, options: ListContentOptions = {}) {
  const { status, featured, publishedOnly = false } = options;

  const conditions = [eq(schema.contentBase.type, type)];

  if (status) {
    conditions.push(eq(schema.contentBase.status, status));
  } else if (publishedOnly) {
    conditions.push(eq(schema.contentBase.status, 'published'));
  }

  if (featured !== undefined) {
    conditions.push(eq(schema.contentBase.featured, featured));
  }

  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.contentBase)
    .where(and(...conditions))
    .get();

  return result?.count ?? 0;
}

/**
 * Updates content status.
 *
 * @param db - Drizzle database instance
 * @param id - Content ID
 * @param status - New status
 * @returns Updated content or undefined
 */
export function updateContentStatus(db: DrizzleDB, id: number, status: ContentStatus) {
  const now = new Date();
  const updates: Partial<schema.ContentBase> = {
    status,
    updatedAt: now,
  };

  // Set publishedAt when first published
  if (status === 'published') {
    const existing = getContentById(db, id);
    if (existing && !existing.publishedAt) {
      updates.publishedAt = now;
    }
  }

  db.update(schema.contentBase).set(updates).where(eq(schema.contentBase.id, id)).run();

  return getContentById(db, id);
}

/**
 * Soft deletes content by setting status to archived.
 *
 * @param db - Drizzle database instance
 * @param id - Content ID
 * @returns Updated content or undefined
 */
export function archiveContent(db: DrizzleDB, id: number) {
  return updateContentStatus(db, id, 'archived');
}
