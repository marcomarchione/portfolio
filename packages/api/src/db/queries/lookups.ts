/**
 * Lookup Table Query Helpers
 *
 * CRUD operations for technologies and tags tables.
 */
import { eq, sql } from 'drizzle-orm';
import type { DrizzleDB } from '../index';
import * as schema from '../schema';

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
export async function listTechnologies(db: DrizzleDB) {
  return db.select().from(schema.technologies);
}

/**
 * Gets a technology by ID.
 *
 * @param db - Drizzle database instance
 * @param id - Technology ID
 * @returns Technology or undefined
 */
export async function getTechnologyById(db: DrizzleDB, id: number) {
  const [result] = await db.select().from(schema.technologies).where(eq(schema.technologies.id, id));
  return result;
}

/**
 * Gets a technology by name.
 *
 * @param db - Drizzle database instance
 * @param name - Technology name
 * @returns Technology or undefined
 */
export async function getTechnologyByName(db: DrizzleDB, name: string) {
  const [result] = await db.select().from(schema.technologies).where(eq(schema.technologies.name, name));
  return result;
}

/**
 * Creates a new technology.
 *
 * @param db - Drizzle database instance
 * @param data - Technology data
 * @returns Created technology
 */
export async function createTechnology(db: DrizzleDB, data: CreateTechnologyData) {
  const [result] = await db.insert(schema.technologies)
    .values({
      name: data.name,
      icon: data.icon ?? null,
      color: data.color ?? null,
    })
    .returning();

  return result;
}

/**
 * Updates a technology.
 *
 * @param db - Drizzle database instance
 * @param id - Technology ID
 * @param data - Update data
 * @returns Updated technology or undefined
 */
export async function updateTechnology(db: DrizzleDB, id: number, data: UpdateTechnologyData) {
  const existing = await getTechnologyById(db, id);
  if (!existing) return undefined;

  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.icon !== undefined) updates.icon = data.icon;
  if (data.color !== undefined) updates.color = data.color;

  if (Object.keys(updates).length > 0) {
    await db.update(schema.technologies)
      .set(updates)
      .where(eq(schema.technologies.id, id));
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
export async function isTechnologyReferenced(db: DrizzleDB, id: number) {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.projectTechnologies)
    .where(eq(schema.projectTechnologies.technologyId, id));

  return (result?.count ?? 0) > 0;
}

/**
 * Deletes a technology if not referenced.
 *
 * @param db - Drizzle database instance
 * @param id - Technology ID
 * @returns True if deleted, false if referenced
 */
export async function deleteTechnology(db: DrizzleDB, id: number): Promise<boolean> {
  if (await isTechnologyReferenced(db, id)) {
    return false;
  }

  await db.delete(schema.technologies).where(eq(schema.technologies.id, id));
  return true;
}

/**
 * Deletes a technology with cascade, removing all project_technologies references first.
 *
 * @param db - Drizzle database instance
 * @param id - Technology ID
 * @returns True if deleted
 */
export async function deleteTechnologyWithCascade(db: DrizzleDB, id: number): Promise<boolean> {
  // Delete all project_technologies records for this technology
  await db.delete(schema.projectTechnologies)
    .where(eq(schema.projectTechnologies.technologyId, id));

  // Delete the technology
  await db.delete(schema.technologies).where(eq(schema.technologies.id, id));
  return true;
}

// Tags

/**
 * Lists all tags.
 *
 * @param db - Drizzle database instance
 * @returns Array of tags
 */
export async function listTags(db: DrizzleDB) {
  return db.select().from(schema.tags);
}

/**
 * Gets a tag by ID.
 *
 * @param db - Drizzle database instance
 * @param id - Tag ID
 * @returns Tag or undefined
 */
export async function getTagById(db: DrizzleDB, id: number) {
  const [result] = await db.select().from(schema.tags).where(eq(schema.tags.id, id));
  return result;
}

/**
 * Gets a tag by slug.
 *
 * @param db - Drizzle database instance
 * @param slug - Tag slug
 * @returns Tag or undefined
 */
export async function getTagBySlug(db: DrizzleDB, slug: string) {
  const [result] = await db.select().from(schema.tags).where(eq(schema.tags.slug, slug));
  return result;
}

/**
 * Creates a new tag.
 *
 * @param db - Drizzle database instance
 * @param data - Tag data
 * @returns Created tag
 */
export async function createTag(db: DrizzleDB, data: CreateTagData) {
  const [result] = await db.insert(schema.tags)
    .values({
      name: data.name,
      slug: data.slug,
    })
    .returning();

  return result;
}

/**
 * Updates a tag.
 *
 * @param db - Drizzle database instance
 * @param id - Tag ID
 * @param data - Update data
 * @returns Updated tag or undefined
 */
export async function updateTag(db: DrizzleDB, id: number, data: UpdateTagData) {
  const existing = await getTagById(db, id);
  if (!existing) return undefined;

  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.slug !== undefined) updates.slug = data.slug;

  if (Object.keys(updates).length > 0) {
    await db.update(schema.tags)
      .set(updates)
      .where(eq(schema.tags.id, id));
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
export async function isTagReferenced(db: DrizzleDB, id: number) {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.newsTags)
    .where(eq(schema.newsTags.tagId, id));

  return (result?.count ?? 0) > 0;
}

/**
 * Deletes a tag if not referenced.
 *
 * @param db - Drizzle database instance
 * @param id - Tag ID
 * @returns True if deleted, false if referenced
 */
export async function deleteTag(db: DrizzleDB, id: number): Promise<boolean> {
  if (await isTagReferenced(db, id)) {
    return false;
  }

  await db.delete(schema.tags).where(eq(schema.tags.id, id));
  return true;
}

/**
 * Deletes a tag with cascade, removing all news_tags references first.
 *
 * @param db - Drizzle database instance
 * @param id - Tag ID
 * @returns True if deleted
 */
export async function deleteTagWithCascade(db: DrizzleDB, id: number): Promise<boolean> {
  // Delete all news_tags records for this tag
  await db.delete(schema.newsTags)
    .where(eq(schema.newsTags.tagId, id));

  // Delete the tag
  await db.delete(schema.tags).where(eq(schema.tags.id, id));
  return true;
}
