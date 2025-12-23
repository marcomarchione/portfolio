/**
 * Junction Table Query Helpers
 *
 * Many-to-many relationship operations for project-technologies and news-tags.
 */
import { eq, and } from 'drizzle-orm';
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import * as schema from '../schema';

type DrizzleDB = BunSQLiteDatabase<typeof schema>;

/**
 * Gets technologies for a project.
 *
 * @param db - Drizzle database instance
 * @param projectId - Project ID (from projects table)
 * @returns Array of technologies
 */
export function getProjectTechnologies(db: DrizzleDB, projectId: number) {
  return db
    .select({ technology: schema.technologies })
    .from(schema.projectTechnologies)
    .innerJoin(
      schema.technologies,
      eq(schema.projectTechnologies.technologyId, schema.technologies.id)
    )
    .where(eq(schema.projectTechnologies.projectId, projectId))
    .all()
    .map((r) => r.technology);
}

/**
 * Assigns technologies to a project, replacing existing associations.
 *
 * @param db - Drizzle database instance
 * @param projectId - Project ID (from projects table)
 * @param technologyIds - Array of technology IDs
 */
export function assignTechnologies(db: DrizzleDB, projectId: number, technologyIds: number[]) {
  // Remove existing associations
  db.delete(schema.projectTechnologies)
    .where(eq(schema.projectTechnologies.projectId, projectId))
    .run();

  // Add new associations
  for (const technologyId of technologyIds) {
    db.insert(schema.projectTechnologies)
      .values({ projectId, technologyId })
      .run();
  }
}

/**
 * Removes a single technology from a project.
 *
 * @param db - Drizzle database instance
 * @param projectId - Project ID
 * @param technologyId - Technology ID to remove
 */
export function removeTechnology(db: DrizzleDB, projectId: number, technologyId: number) {
  db.delete(schema.projectTechnologies)
    .where(
      and(
        eq(schema.projectTechnologies.projectId, projectId),
        eq(schema.projectTechnologies.technologyId, technologyId)
      )
    )
    .run();
}

/**
 * Gets tags for a news item.
 *
 * @param db - Drizzle database instance
 * @param newsId - News ID (from news table)
 * @returns Array of tags
 */
export function getNewsTags(db: DrizzleDB, newsId: number) {
  return db
    .select({ tag: schema.tags })
    .from(schema.newsTags)
    .innerJoin(schema.tags, eq(schema.newsTags.tagId, schema.tags.id))
    .where(eq(schema.newsTags.newsId, newsId))
    .all()
    .map((r) => r.tag);
}

/**
 * Assigns tags to a news item, replacing existing associations.
 *
 * @param db - Drizzle database instance
 * @param newsId - News ID (from news table)
 * @param tagIds - Array of tag IDs
 */
export function assignTags(db: DrizzleDB, newsId: number, tagIds: number[]) {
  // Remove existing associations
  db.delete(schema.newsTags)
    .where(eq(schema.newsTags.newsId, newsId))
    .run();

  // Add new associations
  for (const tagId of tagIds) {
    db.insert(schema.newsTags)
      .values({ newsId, tagId })
      .run();
  }
}

/**
 * Removes a single tag from a news item.
 *
 * @param db - Drizzle database instance
 * @param newsId - News ID
 * @param tagId - Tag ID to remove
 */
export function removeTag(db: DrizzleDB, newsId: number, tagId: number) {
  db.delete(schema.newsTags)
    .where(
      and(
        eq(schema.newsTags.newsId, newsId),
        eq(schema.newsTags.tagId, tagId)
      )
    )
    .run();
}

/**
 * Gets project by content ID.
 *
 * @param db - Drizzle database instance
 * @param contentId - Content ID
 * @returns Project or undefined
 */
export function getProjectByContentId(db: DrizzleDB, contentId: number) {
  return db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.contentId, contentId))
    .get();
}

/**
 * Gets news by content ID.
 *
 * @param db - Drizzle database instance
 * @param contentId - Content ID
 * @returns News or undefined
 */
export function getNewsByContentId(db: DrizzleDB, contentId: number) {
  return db
    .select()
    .from(schema.news)
    .where(eq(schema.news.contentId, contentId))
    .get();
}
