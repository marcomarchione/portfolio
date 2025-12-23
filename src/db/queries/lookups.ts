/**
 * Lookup Table Query Helpers
 *
 * CRUD operations for technologies and tags tables.
 */
import { eq, sql } from 'drizzle-orm';
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import * as schema from '../schema';

type DrizzleDB = BunSQLiteDatabase<typeof schema>;

/** Data for creating a technology */
export interface CreateTechnologyData {
  name: string;
  icon?: string | null;
  color?: string | null;
}

/** Data for updating a technology */
export interface UpdateTechnologyData {
  name?: string;
  icon?: string | null;
  color?: string | null;
}

/** Data for creating a tag */
export interface CreateTagData {
  name: string;
  slug: string;
}

/** Data for updating a tag */
export interface UpdateTagData {
  name?: string;
  slug?: string;
}

// Technologies

/**
 * Lists all technologies.
 *
 * @param db - Drizzle database instance
 * @returns Array of technologies
 */
export function listTechnologies(db: DrizzleDB) {
  return db.select().from(schema.technologies).all();
}

/**
 * Gets a technology by ID.
 *
 * @param db - Drizzle database instance
 * @param id - Technology ID
 * @returns Technology or undefined
 */
export function getTechnologyById(db: DrizzleDB, id: number) {
  return db.select().from(schema.technologies).where(eq(schema.technologies.id, id)).get();
}

/**
 * Gets a technology by name.
 *
 * @param db - Drizzle database instance
 * @param name - Technology name
 * @returns Technology or undefined
 */
export function getTechnologyByName(db: DrizzleDB, name: string) {
  return db.select().from(schema.technologies).where(eq(schema.technologies.name, name)).get();
}

/**
 * Creates a new technology.
 *
 * @param db - Drizzle database instance
 * @param data - Technology data
 * @returns Created technology
 */
export function createTechnology(db: DrizzleDB, data: CreateTechnologyData) {
  db.insert(schema.technologies)
    .values({
      name: data.name,
      icon: data.icon ?? null,
      color: data.color ?? null,
    })
    .run();

  return getTechnologyByName(db, data.name)!;
}

/**
 * Updates a technology.
 *
 * @param db - Drizzle database instance
 * @param id - Technology ID
 * @param data - Update data
 * @returns Updated technology or undefined
 */
export function updateTechnology(db: DrizzleDB, id: number, data: UpdateTechnologyData) {
  const existing = getTechnologyById(db, id);
  if (!existing) return undefined;

  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.icon !== undefined) updates.icon = data.icon;
  if (data.color !== undefined) updates.color = data.color;

  if (Object.keys(updates).length > 0) {
    db.update(schema.technologies)
      .set(updates)
      .where(eq(schema.technologies.id, id))
      .run();
  }

  return getTechnologyById(db, id);
}

/**
 * Checks if a technology is referenced by any projects.
 *
 * @param db - Drizzle database instance
 * @param id - Technology ID
 * @returns True if referenced
 */
export function isTechnologyReferenced(db: DrizzleDB, id: number) {
  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.projectTechnologies)
    .where(eq(schema.projectTechnologies.technologyId, id))
    .get();

  return (result?.count ?? 0) > 0;
}

/**
 * Deletes a technology if not referenced.
 *
 * @param db - Drizzle database instance
 * @param id - Technology ID
 * @returns True if deleted, false if referenced
 */
export function deleteTechnology(db: DrizzleDB, id: number): boolean {
  if (isTechnologyReferenced(db, id)) {
    return false;
  }

  db.delete(schema.technologies).where(eq(schema.technologies.id, id)).run();
  return true;
}

// Tags

/**
 * Lists all tags.
 *
 * @param db - Drizzle database instance
 * @returns Array of tags
 */
export function listTags(db: DrizzleDB) {
  return db.select().from(schema.tags).all();
}

/**
 * Gets a tag by ID.
 *
 * @param db - Drizzle database instance
 * @param id - Tag ID
 * @returns Tag or undefined
 */
export function getTagById(db: DrizzleDB, id: number) {
  return db.select().from(schema.tags).where(eq(schema.tags.id, id)).get();
}

/**
 * Gets a tag by slug.
 *
 * @param db - Drizzle database instance
 * @param slug - Tag slug
 * @returns Tag or undefined
 */
export function getTagBySlug(db: DrizzleDB, slug: string) {
  return db.select().from(schema.tags).where(eq(schema.tags.slug, slug)).get();
}

/**
 * Creates a new tag.
 *
 * @param db - Drizzle database instance
 * @param data - Tag data
 * @returns Created tag
 */
export function createTag(db: DrizzleDB, data: CreateTagData) {
  db.insert(schema.tags)
    .values({
      name: data.name,
      slug: data.slug,
    })
    .run();

  return getTagBySlug(db, data.slug)!;
}

/**
 * Updates a tag.
 *
 * @param db - Drizzle database instance
 * @param id - Tag ID
 * @param data - Update data
 * @returns Updated tag or undefined
 */
export function updateTag(db: DrizzleDB, id: number, data: UpdateTagData) {
  const existing = getTagById(db, id);
  if (!existing) return undefined;

  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.slug !== undefined) updates.slug = data.slug;

  if (Object.keys(updates).length > 0) {
    db.update(schema.tags)
      .set(updates)
      .where(eq(schema.tags.id, id))
      .run();
  }

  return getTagById(db, id);
}

/**
 * Checks if a tag is referenced by any news.
 *
 * @param db - Drizzle database instance
 * @param id - Tag ID
 * @returns True if referenced
 */
export function isTagReferenced(db: DrizzleDB, id: number) {
  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.newsTags)
    .where(eq(schema.newsTags.tagId, id))
    .get();

  return (result?.count ?? 0) > 0;
}

/**
 * Deletes a tag if not referenced.
 *
 * @param db - Drizzle database instance
 * @param id - Tag ID
 * @returns True if deleted, false if referenced
 */
export function deleteTag(db: DrizzleDB, id: number): boolean {
  if (isTagReferenced(db, id)) {
    return false;
  }

  db.delete(schema.tags).where(eq(schema.tags.id, id)).run();
  return true;
}
